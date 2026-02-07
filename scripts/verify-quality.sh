#!/bin/bash

# Automated Quality Verification Script
# Runs subset of checks from pre-ship-review that can be automated

set +e  # Don't exit on error (we want to report all failures)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Track overall pass/fail
OVERALL_PASS=true

print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
  OVERALL_PASS=false
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

run_check() {
  local check_name=$1
  local command=$2

  echo -e "${BOLD}Running: $check_name${NC}"

  if eval "$command"; then
    print_success "$check_name passed"
    return 0
  else
    print_error "$check_name failed"
    return 1
  fi
}

#######################################
# Layer 5: TypeScript & Build Checks
#######################################

check_typescript() {
  print_header "Layer 5.1: TypeScript Check"

  if ! command -v npm &> /dev/null; then
    print_error "npm not found"
    return 1
  fi

  run_check "Type check" "npm run type-check"
}

check_lint() {
  print_header "Layer 5.2: ESLint Check"

  run_check "Lint check" "npm run lint"
}

check_build() {
  print_header "Layer 5.3: Build Check"

  print_info "Building for production..."

  if npm run build > /tmp/build-output.txt 2>&1; then
    print_success "Build succeeded"

    # Check bundle size
    if [ -d ".next/static/chunks" ]; then
      echo ""
      echo -e "${BOLD}Bundle sizes (top 10 chunks):${NC}"
      ls -lh .next/static/chunks/*.js 2>/dev/null | \
        awk '{print $5 "\t" $9}' | \
        head -10

      # Check if main chunk is too large
      local main_size=$(find .next/static/chunks -name "main-*.js" -exec ls -l {} \; 2>/dev/null | awk '{print $5}')
      if [ -n "$main_size" ] && [ "$main_size" -gt 512000 ]; then
        print_warning "Main bundle >500KB ($main_size bytes) - consider code splitting"
      fi
    fi

    return 0
  else
    print_error "Build failed"
    echo ""
    echo "Build output:"
    cat /tmp/build-output.txt | tail -20
    return 1
  fi
}

#######################################
# Layer 6: Testing Checks
#######################################

check_tests() {
  print_header "Layer 6.1: Test Execution"

  # Check if tests exist
  if ! find . -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | grep -q .; then
    print_warning "No test files found"
    return 0
  fi

  run_check "Test suite" "npm test -- --passWithNoTests"
}

check_coverage() {
  print_header "Layer 6.2: Test Coverage"

  # Check if tests exist
  if ! find . -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | grep -q .; then
    print_warning "No test files found - skipping coverage"
    return 0
  fi

  print_info "Running tests with coverage..."

  if npm test -- --coverage --passWithNoTests > /tmp/coverage-output.txt 2>&1; then
    # Extract coverage summary
    echo ""
    echo -e "${BOLD}Coverage Summary:${NC}"
    grep -A 4 "All files" /tmp/coverage-output.txt || echo "Coverage data not found"

    # Check if coverage meets targets
    local overall_coverage=$(grep "All files" /tmp/coverage-output.txt | awk '{print $10}' | sed 's/%//')

    if [ -n "$overall_coverage" ] && [ "$overall_coverage" -lt 80 ]; then
      print_warning "Coverage $overall_coverage% < 80% target"
    else
      print_success "Coverage check passed"
    fi

    return 0
  else
    print_error "Coverage check failed"
    return 1
  fi
}

#######################################
# Layer 8: Pre-Deployment Checks
#######################################

check_debugging_artifacts() {
  print_header "Layer 8.1: Debugging Artifacts"

  local found_issues=false

  # Check for console.log (excluding console.error)
  echo "Checking for console.log statements..."
  local console_logs=$(grep -r "console\.log\|console\.debug\|console\.warn" . \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=coverage \
    2>/dev/null || true)

  if [ -n "$console_logs" ]; then
    print_error "Found console.log statements:"
    echo "$console_logs" | head -10
    if [ $(echo "$console_logs" | wc -l) -gt 10 ]; then
      echo "... and $(( $(echo "$console_logs" | wc -l) - 10 )) more"
    fi
    found_issues=true
  else
    print_success "No console.log statements found"
  fi

  # Check for debugger statements
  echo ""
  echo "Checking for debugger statements..."
  local debuggers=$(grep -r "debugger" . \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    2>/dev/null || true)

  if [ -n "$debuggers" ]; then
    print_error "Found debugger statements:"
    echo "$debuggers"
    found_issues=true
  else
    print_success "No debugger statements found"
  fi

  if $found_issues; then
    return 1
  else
    return 0
  fi
}

check_todo_comments() {
  print_header "Layer 8.2: TODO Comments"

  echo "Checking for unresolved TODOs..."
  local todos=$(grep -r "TODO\|FIXME\|XXX\|HACK" . \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    2>/dev/null || true)

  if [ -n "$todos" ]; then
    local todo_count=$(echo "$todos" | wc -l | tr -d ' ')
    print_warning "Found $todo_count TODO comments:"
    echo "$todos" | head -10
    if [ $(echo "$todos" | wc -l) -gt 10 ]; then
      echo "... and $(( $(echo "$todos" | wc -l) - 10 )) more"
    fi
    echo ""
    print_info "Consider creating GitHub issues for these TODOs"
  else
    print_success "No TODO comments found"
  fi

  return 0
}

check_env_example() {
  print_header "Layer 8.3: Environment Variables"

  if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found (may not be needed)"
  fi

  if [ ! -f ".env.example" ]; then
    print_warning ".env.example not found"
    print_info "Create .env.example with placeholder values"
    return 0
  fi

  # Check if .env.local is in .gitignore
  if grep -q "\.env\.local" .gitignore 2>/dev/null; then
    print_success ".env.local in .gitignore"
  else
    print_error ".env.local NOT in .gitignore - security risk!"
    return 1
  fi

  # Check for potential secrets in code
  echo ""
  echo "Checking for hardcoded secrets..."
  local secrets=$(grep -r "SUPABASE_URL\|SUPABASE_ANON_KEY\|API_KEY\|SECRET" . \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude="*.test.ts" \
    2>/dev/null | \
    grep -v "process\.env" | \
    grep -v "NEXT_PUBLIC_" || true)

  if [ -n "$secrets" ]; then
    print_error "Potential hardcoded secrets found:"
    echo "$secrets" | head -5
    return 1
  else
    print_success "No hardcoded secrets detected"
  fi

  return 0
}

check_git_status() {
  print_header "Layer 8.4: Git Status"

  if ! command -v git &> /dev/null; then
    print_warning "git not found - skipping git checks"
    return 0
  fi

  # Check if in a git repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_warning "Not a git repository"
    return 0
  fi

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    print_info "Uncommitted changes present"
    echo ""
    git status --short | head -10
  else
    print_success "No uncommitted changes"
  fi

  # Check recent commits
  echo ""
  echo -e "${BOLD}Recent commits:${NC}"
  git log --oneline -5

  return 0
}

#######################################
# Main Execution
#######################################

main() {
  print_header "Automated Quality Verification"

  echo "Running automated checks from pre-ship-review..."
  echo "For full verification, use: /pre-ship-review \"feature-name\""
  echo ""

  # TypeScript & Build (Layer 5)
  check_typescript
  check_lint
  check_build

  # Testing (Layer 6)
  check_tests
  check_coverage

  # Pre-Deployment (Layer 8)
  check_debugging_artifacts
  check_todo_comments
  check_env_example
  check_git_status

  # Summary
  print_header "Verification Summary"

  if $OVERALL_PASS; then
    echo -e "${GREEN}${BOLD}✅ All automated checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run full verification: /pre-ship-review \"feature-name\""
    echo "2. Manual checks: Integration, accessibility, mobile testing"
    echo "3. Create pull request when all verifications pass"
    exit 0
  else
    echo -e "${RED}${BOLD}❌ Some checks failed${NC}"
    echo ""
    echo "Fix the issues above and re-run:"
    echo "  npm run feature verify"
    exit 1
  fi
}

main "$@"
