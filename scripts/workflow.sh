#!/bin/bash

# Workflow Automation Script for Collaborative Whiteboard Development
# Guides through: Design → Decompose → Execute → Verify → Document

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Directories
WORKFLOW_DIR=".workflow"
CURRENT_FEATURE_FILE="$WORKFLOW_DIR/current-feature.txt"
CURRENT_PHASE_FILE="$WORKFLOW_DIR/current-phase.txt"
STARTED_AT_FILE="$WORKFLOW_DIR/started-at.txt"

# Workflow phases
PHASES=("design" "decompose" "execute" "verify" "document")

# Helper functions for phase-to-skill mapping (works with bash 3.2+)
get_phase_skill() {
  case "$1" in
    design) echo "/structured-design-thinking" ;;
    decompose) echo "/task-decomposition" ;;
    execute) echo "/systematic-execution" ;;
    verify) echo "/pre-ship-review" ;;
    document) echo "/session-summary" ;;
    *) echo "" ;;
  esac
}

get_phase_description() {
  case "$1" in
    design) echo "Create design document with success criteria and architecture" ;;
    decompose) echo "Break feature into small, implementable tasks (2-5 min each)" ;;
    execute) echo "Implement tasks systematically with /self-verification per task" ;;
    verify) echo "Run comprehensive verification (8 layers) before shipping" ;;
    document) echo "Create session summary and update project documentation" ;;
    *) echo "" ;;
  esac
}

#######################################
# Helper Functions
#######################################

print_header() {
  echo -e "${BOLD}${BLUE}================================================${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}================================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

print_phase() {
  local phase=$1
  local skill=$(get_phase_skill "$phase")
  local description=$(get_phase_description "$phase")

  echo -e "${BOLD}${MAGENTA}Phase: $phase${NC}"
  echo -e "${CYAN}Skill: $skill${NC}"
  echo -e "Description: $description"
  echo ""
}

# Initialize workflow directory
init_workflow_dir() {
  if [ ! -d "$WORKFLOW_DIR" ]; then
    mkdir -p "$WORKFLOW_DIR"
    print_success "Created $WORKFLOW_DIR directory"
  fi
}

# Get current feature
get_current_feature() {
  if [ -f "$CURRENT_FEATURE_FILE" ]; then
    cat "$CURRENT_FEATURE_FILE"
  else
    echo ""
  fi
}

# Get current phase
get_current_phase() {
  if [ -f "$CURRENT_PHASE_FILE" ]; then
    cat "$CURRENT_PHASE_FILE"
  else
    echo ""
  fi
}

# Get started timestamp
get_started_at() {
  if [ -f "$STARTED_AT_FILE" ]; then
    cat "$STARTED_AT_FILE"
  else
    echo ""
  fi
}

# Calculate time elapsed
calculate_elapsed() {
  local start_time=$(get_started_at)

  if [ -z "$start_time" ]; then
    echo "N/A"
    return
  fi

  local start_epoch=$(date -j -f "%Y-%m-%d %H:%M:%S" "$start_time" +%s 2>/dev/null || echo "0")
  local current_epoch=$(date +%s)
  local elapsed=$((current_epoch - start_epoch))

  local hours=$((elapsed / 3600))
  local minutes=$(((elapsed % 3600) / 60))

  if [ $hours -gt 0 ]; then
    echo "${hours}h ${minutes}m"
  else
    echo "${minutes}m"
  fi
}

# Get next phase
get_next_phase() {
  local current_phase=$1

  for i in "${!PHASES[@]}"; do
    if [ "${PHASES[$i]}" = "$current_phase" ]; then
      local next_index=$((i + 1))
      if [ $next_index -lt ${#PHASES[@]} ]; then
        echo "${PHASES[$next_index]}"
        return
      fi
    fi
  done

  echo ""
}

# Set current feature
set_current_feature() {
  init_workflow_dir
  echo "$1" > "$CURRENT_FEATURE_FILE"
}

# Set current phase
set_current_phase() {
  init_workflow_dir
  echo "$1" > "$CURRENT_PHASE_FILE"
}

# Set started timestamp
set_started_at() {
  init_workflow_dir
  date "+%Y-%m-%d %H:%M:%S" > "$STARTED_AT_FILE"
}

#######################################
# Commands
#######################################

cmd_start() {
  local feature_name="$1"

  if [ -z "$feature_name" ]; then
    print_error "Feature name required"
    echo "Usage: npm run feature start \"feature name\""
    exit 1
  fi

  # Check if already working on a feature
  local current_feature=$(get_current_feature)
  if [ -n "$current_feature" ]; then
    print_warning "Already working on feature: $current_feature"
    echo ""
    read -p "Do you want to abandon that and start a new feature? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_info "Continuing with current feature"
      exit 0
    fi
  fi

  print_header "Starting New Feature"

  # Initialize state
  set_current_feature "$feature_name"
  set_current_phase "design"
  set_started_at

  print_success "Feature initialized: $feature_name"
  echo ""

  # Show first phase
  print_phase "design"

  echo -e "${BOLD}Next steps:${NC}"
  echo "1. Run the design skill in Claude Code:"
  echo -e "   ${CYAN}/structured-design-thinking \"$feature_name\"${NC}"
  echo ""
  echo "2. Review the design document created in docs/plans/"
  echo ""
  echo "3. When design is complete, move to next phase:"
  echo -e "   ${CYAN}npm run feature next${NC}"
  echo ""
}

cmd_next() {
  local current_feature=$(get_current_feature)

  if [ -z "$current_feature" ]; then
    print_error "No active feature. Start one with: npm run feature start \"feature name\""
    exit 1
  fi

  local current_phase=$(get_current_phase)
  local next_phase=$(get_next_phase "$current_phase")

  if [ -z "$next_phase" ]; then
    print_success "All phases complete!"
    echo ""
    echo -e "${BOLD}${GREEN}Feature '$current_feature' is ready to ship! 🚀${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Create a pull request"
    echo "2. Run: npm run feature finish"
    exit 0
  fi

  print_header "Moving to Next Phase"

  echo -e "${BOLD}Feature:${NC} $current_feature"
  echo -e "${BOLD}Current phase:${NC} $current_phase → $next_phase"
  echo ""

  # Update phase
  set_current_phase "$next_phase"

  print_success "Moved to $next_phase phase"
  echo ""

  # Show next phase info
  print_phase "$next_phase"

  local skill=$(get_phase_skill "$next_phase")

  echo -e "${BOLD}Next steps:${NC}"
  echo "1. Run the $next_phase skill in Claude Code:"
  echo -e "   ${CYAN}$skill \"$current_feature\"${NC}"
  echo ""

  # Phase-specific guidance
  case $next_phase in
    "decompose")
      echo "2. Review the task list created"
      echo "3. Ensure tasks are small (2-5 minutes each)"
      ;;
    "execute")
      echo "2. For EACH task you write code:"
      echo "   - Write the code"
      echo "   - Run ${CYAN}/self-verification${NC} (code-level)"
      echo "   - Present to user"
      echo "   - Mark task complete"
      ;;
    "verify")
      echo "2. Alternatively, run automated checks:"
      echo -e "   ${CYAN}npm run feature verify${NC}"
      echo ""
      echo "3. Fix any issues found"
      echo "4. Re-run verification until all 8 layers pass"
      ;;
    "document")
      echo "2. Review the session summary created"
      echo "3. Ensure learnings are captured"
      ;;
  esac

  echo ""
  echo "When done, move to next phase:"
  echo -e "   ${CYAN}npm run feature next${NC}"
  echo ""
}

cmd_status() {
  local current_feature=$(get_current_feature)

  if [ -z "$current_feature" ]; then
    print_header "Workflow Status"
    print_warning "No active feature"
    echo ""
    echo "Start a new feature with:"
    echo -e "   ${CYAN}npm run feature start \"feature name\"${NC}"
    exit 0
  fi

  local current_phase=$(get_current_phase)
  local started_at=$(get_started_at)
  local elapsed=$(calculate_elapsed)

  print_header "Workflow Status"

  echo -e "${BOLD}Feature:${NC} $current_feature"
  echo -e "${BOLD}Current phase:${NC} $current_phase"
  echo -e "${BOLD}Started:${NC} $started_at"
  echo -e "${BOLD}Elapsed:${NC} $elapsed"
  echo ""

  # Show current phase details
  print_phase "$current_phase"

  # Show progress
  echo -e "${BOLD}Progress:${NC}"
  for phase in "${PHASES[@]}"; do
    if [ "$phase" = "$current_phase" ]; then
      echo -e "  ${YELLOW}▶${NC} $phase ${YELLOW}(current)${NC}"
    else
      # Check if phase is complete
      local phase_complete=false
      for i in "${!PHASES[@]}"; do
        if [ "${PHASES[$i]}" = "$phase" ]; then
          local current_index=-1
          for j in "${!PHASES[@]}"; do
            if [ "${PHASES[$j]}" = "$current_phase" ]; then
              current_index=$j
              break
            fi
          done

          if [ $i -lt $current_index ]; then
            phase_complete=true
          fi
          break
        fi
      done

      if $phase_complete; then
        echo -e "  ${GREEN}✓${NC} $phase ${GREEN}(complete)${NC}"
      else
        echo -e "  ${CYAN}○${NC} $phase ${CYAN}(upcoming)${NC}"
      fi
    fi
  done

  echo ""

  # Show next step
  local skill=$(get_phase_skill "$current_phase")
  echo -e "${BOLD}Next step:${NC}"
  echo "Run: ${CYAN}$skill \"$current_feature\"${NC}"
  echo ""
}

cmd_verify() {
  local current_feature=$(get_current_feature)

  if [ -z "$current_feature" ]; then
    print_warning "No active feature (running verification anyway)"
    echo ""
  fi

  print_header "Running Automated Verification"

  echo "This runs automated checks from the pre-ship-review skill"
  echo "For full verification, use: /pre-ship-review \"$current_feature\""
  echo ""

  # Run the verify-quality script
  if [ -f "scripts/verify-quality.sh" ]; then
    bash scripts/verify-quality.sh
  else
    print_error "scripts/verify-quality.sh not found"
    echo "Run: npm run feature next  # to continue setup"
    exit 1
  fi
}

cmd_finish() {
  local current_feature=$(get_current_feature)

  if [ -z "$current_feature" ]; then
    print_error "No active feature to finish"
    exit 1
  fi

  print_header "Finishing Feature"

  echo -e "${BOLD}Feature:${NC} $current_feature"
  echo ""

  # Check if in document phase
  local current_phase=$(get_current_phase)
  if [ "$current_phase" != "document" ]; then
    print_warning "Current phase is '$current_phase', not 'document'"
    echo ""
    read -p "Are you sure you want to finish? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_info "Continue workflow with: npm run feature next"
      exit 0
    fi
  fi

  echo "Before finishing, ensure you've:"
  echo "  ✓ Completed all verification (8 layers pass)"
  echo "  ✓ Created session summary (/session-summary)"
  echo "  ✓ Updated relevant documentation"
  echo ""

  read -p "Mark feature as complete? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Feature still active"
    exit 0
  fi

  # Archive workflow state
  local archive_dir="$WORKFLOW_DIR/archive"
  mkdir -p "$archive_dir"

  local finished_at=$(date "+%Y-%m-%d_%H-%M-%S")
  local archive_file="$archive_dir/${current_feature// /-}_${finished_at}.txt"

  {
    echo "Feature: $current_feature"
    echo "Started: $(get_started_at)"
    echo "Finished: $(date "+%Y-%m-%d %H:%M:%S")"
    echo "Duration: $(calculate_elapsed)"
    echo "Final phase: $(get_current_phase)"
  } > "$archive_file"

  # Clean up active state
  rm -f "$CURRENT_FEATURE_FILE" "$CURRENT_PHASE_FILE" "$STARTED_AT_FILE"

  print_success "Feature '$current_feature' marked as complete!"
  print_info "Workflow state archived to: $archive_file"
  echo ""

  echo -e "${BOLD}${GREEN}🎉 Great work!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Create pull request (if not done already)"
  echo "2. Start next feature: npm run feature start \"next feature\""
  echo ""
}

cmd_reset() {
  local current_feature=$(get_current_feature)

  if [ -z "$current_feature" ]; then
    print_warning "No active feature to reset"
    exit 0
  fi

  print_header "Reset Workflow"

  echo -e "${BOLD}Current feature:${NC} $current_feature"
  echo ""
  print_warning "This will discard workflow state (feature progress not lost)"
  echo ""

  read -p "Are you sure you want to reset? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Reset cancelled"
    exit 0
  fi

  rm -f "$CURRENT_FEATURE_FILE" "$CURRENT_PHASE_FILE" "$STARTED_AT_FILE"

  print_success "Workflow reset"
  echo ""
  echo "Start a new feature with:"
  echo -e "   ${CYAN}npm run feature start \"feature name\"${NC}"
  echo ""
}

cmd_help() {
  print_header "Workflow Automation Help"

  echo "Guides you through the complete development workflow:"
  echo "  Design → Decompose → Execute → Verify → Document"
  echo ""

  echo -e "${BOLD}Commands:${NC}"
  echo ""

  echo -e "${CYAN}npm run feature start \"feature name\"${NC}"
  echo "  Start a new feature workflow"
  echo "  Initializes state, prompts to run /structured-design-thinking"
  echo ""

  echo -e "${CYAN}npm run feature next${NC}"
  echo "  Move to next phase in workflow"
  echo "  Shows which skill to invoke next"
  echo ""

  echo -e "${CYAN}npm run feature status${NC}"
  echo "  Show current workflow status"
  echo "  Displays feature, phase, progress, and next step"
  echo ""

  echo -e "${CYAN}npm run feature verify${NC}"
  echo "  Run automated verification checks"
  echo "  Type check, lint, build, tests, and more"
  echo ""

  echo -e "${CYAN}npm run feature finish${NC}"
  echo "  Mark feature as complete"
  echo "  Archives workflow state, cleans up"
  echo ""

  echo -e "${CYAN}npm run feature reset${NC}"
  echo "  Reset workflow state (discards progress tracking)"
  echo "  Does not delete actual feature work"
  echo ""

  echo -e "${BOLD}Example workflow:${NC}"
  echo ""
  echo "  $ npm run feature start \"participant list\""
  echo "  $ /structured-design-thinking \"participant list\""
  echo "  $ npm run feature next"
  echo "  $ /task-decomposition \"participant list\""
  echo "  $ npm run feature next"
  echo "  $ /systematic-execution \"participant list\""
  echo "  $ npm run feature verify"
  echo "  $ npm run feature next"
  echo "  $ /session-summary \"participant list\""
  echo "  $ npm run feature finish"
  echo ""

  echo -e "${BOLD}Phases and Skills:${NC}"
  echo ""
  for phase in "${PHASES[@]}"; do
    local skill=$(get_phase_skill "$phase")
    local description=$(get_phase_description "$phase")
    echo -e "${MAGENTA}$phase${NC} → ${CYAN}$skill${NC}"
    echo "  $description"
    echo ""
  done
}

#######################################
# Main
#######################################

main() {
  local command=$1
  shift

  case $command in
    start)
      cmd_start "$@"
      ;;
    next)
      cmd_next
      ;;
    status)
      cmd_status
      ;;
    verify)
      cmd_verify
      ;;
    finish)
      cmd_finish
      ;;
    reset)
      cmd_reset
      ;;
    help|--help|-h|"")
      cmd_help
      ;;
    *)
      print_error "Unknown command: $command"
      echo ""
      echo "Run 'npm run feature help' for usage"
      exit 1
      ;;
  esac
}

main "$@"
