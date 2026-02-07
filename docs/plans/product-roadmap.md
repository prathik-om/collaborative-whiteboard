# Product Roadmap - Collaborative Whiteboard

**Last Updated:** 2026-02-07
**Current Phase:** Phase 1 Complete, Phase 2 Planning
**Vision:** Free, anonymous, real-time collaborative whiteboard for students and study groups

---

## Product Vision

### Core Value Proposition
Remove all barriers between idea and canvas. Students should be able to collaborate on homework, projects, and brainstorming without accounts, installations, or complexity.

### Target Users
- **Primary:** Students in study groups (middle school through university)
- **Secondary:** Remote teams, educators, hobbyists
- **Use Cases:** Homework collaboration, project planning, brainstorming, mind mapping, pair programming

### Success Metrics
- **Adoption:** 1,000 active sessions/week by end of Phase 3
- **Retention:** 40% of users create 2+ sessions
- **Performance:** <100ms sync latency, <2s page load
- **Quality:** 80%+ test coverage, 95%+ uptime

---

## Phase 1: MVP Foundation ✅ COMPLETE

**Status:** Complete (2026-02-07)
**Duration:** Initial development sprint
**Goal:** Prove core concept with minimal viable features

### Features Delivered
- ✅ Real-time collaborative canvas (tldraw + Supabase Realtime)
- ✅ Anonymous session creation (memorable codes: happy-tiger)
- ✅ Late-joiner recovery (canvas snapshot sync)
- ✅ Connection status indicator
- ✅ Basic participant tracking
- ✅ TypeScript strict mode (0 errors)
- ✅ Comprehensive documentation (4 setup guides)

### Technical Achievements
- Next.js 15 App Router with Server Components
- tldraw CRDT-based conflict resolution
- Supabase Realtime broadcast (50-100ms latency)
- 528 unique session codes (adjective-animal format)
- Row-Level Security for anonymous access
- ~442KB bundle size (lean)

### Known Gaps (Blockers for Production)
- ⚠️ No automated tests (need 80%+ coverage)
- ⚠️ No error boundaries
- ⚠️ No rate limiting
- ⚠️ Limited mobile testing
- ⚠️ No monitoring/analytics

---

## Phase 2: Production Readiness 🚧 IN PLANNING

**Status:** Planning
**Target Start:** 2026-02-08
**Target Completion:** 2026-02-22 (2 weeks)
**Goal:** Make the app production-ready and feature-complete for basic use

### Critical Path (Must-Haves)

#### 2.1 Testing Infrastructure ⚠️ BLOCKER
**Priority:** P0 (blocks production deployment)
**Effort:** 3-5 days
**Owner:** TBD

- [ ] Write unit tests for hooks (useCreateSession, useBroadcastChannel)
- [ ] Write integration tests for real-time sync
- [ ] Write E2E tests for critical paths (session creation, canvas sync, late-joiner)
- [ ] Achieve 80%+ test coverage
- [ ] Set up CI/CD with test gates

**Success Criteria:**
- All tests passing
- Coverage: Business logic ≥80%, UI ≥60%, Utils 100%
- Tests run on every PR automatically

**See:** [`docs/plans/testing-strategy.md`](testing-strategy.md)

#### 2.2 Error Handling & Resilience
**Priority:** P0
**Effort:** 2-3 days

- [ ] Add error boundaries to canvas and main app
- [ ] Implement fallback UI for errors
- [ ] Add retry logic for failed Supabase operations
- [ ] Handle network disconnections gracefully
- [ ] Improve error messages (user-friendly, actionable)

**Success Criteria:**
- App never shows blank screen on error
- Users can recover from all error states
- Errors logged with context (session code, device ID)

#### 2.3 Rate Limiting & Abuse Prevention
**Priority:** P0
**Effort:** 1-2 days

- [ ] Rate limit session creation (5 per minute per device)
- [ ] Rate limit broadcast frequency (prevent spam)
- [ ] Add session expiration (auto-delete after 24 hours inactive)
- [ ] Implement device fingerprinting for abuse tracking

**Success Criteria:**
- Prevent spam/abuse
- No single user can create >5 sessions/minute
- Old sessions cleaned up automatically

#### 2.4 Mobile Optimization
**Priority:** P1
**Effort:** 2-3 days

- [ ] Test on real iOS and Android devices
- [ ] Fix touch interactions (44px minimum targets)
- [ ] Optimize canvas for mobile viewport
- [ ] Test with slow 3G connection
- [ ] Add mobile-specific UX improvements

**Success Criteria:**
- Works smoothly on iPhone and Android
- Canvas tools accessible on mobile
- <3s load time on 3G

### Enhanced Features (Nice-to-Haves)

#### 2.5 Templates System
**Priority:** P2
**Effort:** 3-4 days

**See:** [`docs/plans/phase-2-templates.md`](phase-2-templates.md)

- [ ] Template gallery on landing page
- [ ] Pre-built templates:
  - Brainstorm (sticky notes layout)
  - Mind Map (central node + branches)
  - Project Plan (timeline/Gantt chart)
  - Wireframe (UI mockup grid)
- [ ] "Start from template" workflow

**Success Criteria:**
- Users can select template before creating session
- Templates load with pre-filled shapes/guides
- 30%+ of sessions use templates

#### 2.6 Session Management Improvements
**Priority:** P2
**Effort:** 1-2 days

- [ ] "End Session" button (delete canvas snapshot)
- [ ] Session history (localStorage: recently joined sessions)
- [ ] "Copy invite link" button
- [ ] QR code for easy mobile joining

**Success Criteria:**
- Users can easily rejoin recent sessions
- Sharing sessions is frictionless

#### 2.7 Participant Presence
**Priority:** P2
**Effort:** 2 days

- [ ] Show real participant count (not placeholder)
- [ ] Show participant cursors on canvas
- [ ] "Who's here" panel with nicknames
- [ ] "Typing..." indicator for text tool

**Success Criteria:**
- Users know who else is in the session
- Cursor positions visible in real-time

### Deployment & Operations

#### 2.8 Production Deployment
**Priority:** P0
**Effort:** 1 day

- [ ] Deploy to Vercel staging environment
- [ ] Load test with 30 concurrent users
- [ ] Configure monitoring (Vercel analytics)
- [ ] Set up error tracking (Sentry or Vercel monitoring)
- [ ] Deploy to production with rollback plan

**Success Criteria:**
- App handles 30 concurrent users per session
- Monitoring dashboards set up
- Rollback procedure tested

---

## Phase 3: Growth & Discoverability

**Status:** Planned
**Target Start:** 2026-03-01
**Target Completion:** 2026-03-31 (1 month)
**Goal:** Drive adoption and make the app discoverable

### Features

#### 3.1 Landing Page Improvements
- [ ] Add demo video/GIF showing real-time collaboration
- [ ] Testimonials from beta users
- [ ] Feature comparison vs competitors
- [ ] SEO optimization (meta tags, sitemap)

#### 3.2 Public Session Gallery (Optional)
- [ ] Users can optionally mark sessions as "public"
- [ ] Browse public whiteboards for inspiration
- [ ] Upvote/favorite system
- [ ] Privacy controls (default: private)

#### 3.3 Export & Sharing
- [ ] Export canvas as PNG/PDF
- [ ] Export to Notion, Google Docs, Figma
- [ ] Share session as image on social media
- [ ] Embed canvas in websites (iframe)

#### 3.4 Premium Features (Monetization Exploration)
- [ ] Session passwords for private study groups
- [ ] Extended session history (7 days vs 24 hours)
- [ ] Custom session codes (branded: "cs101-final")
- [ ] Higher participant limits (100 vs 30)

**Pricing Model (If Implemented):**
- Free tier: Current features
- Premium: $5/month or $50/year

---

## Phase 4: Advanced Collaboration

**Status:** Concept
**Target:** Q2 2026
**Goal:** Features that make collaboration more productive

### Features

#### 4.1 Voice Chat Integration
- [ ] Optional voice/video chat (WebRTC)
- [ ] Mute/unmute controls
- [ ] "Raise hand" indicator
- [ ] Record session (audio + canvas replay)

#### 4.2 Advanced Drawing Tools
- [ ] Laser pointer (ephemeral cursor trail)
- [ ] Annotations (comments on shapes)
- [ ] Shape library (math symbols, flowchart shapes)
- [ ] Layers panel (organize complex drawings)

#### 4.3 AI-Powered Features
- [ ] Auto-organize messy drawings
- [ ] Suggest layout improvements
- [ ] OCR for handwritten text
- [ ] Smart shape recognition (hand-drawn → perfect shapes)

#### 4.4 Integrations
- [ ] Google Classroom integration
- [ ] Slack/Discord webhooks (notify when session starts)
- [ ] GitHub integration (link sessions to issues)
- [ ] Calendar integration (schedule sessions)

---

## Phase 5: Platform & Ecosystem

**Status:** Vision
**Target:** 2027
**Goal:** Build a platform for collaborative learning

### Features

#### 5.1 Mobile Apps
- [ ] Native iOS app (Swift/SwiftUI)
- [ ] Native Android app (Kotlin/Jetpack Compose)
- [ ] Better mobile UX than web
- [ ] Offline mode (sync when reconnected)

#### 5.2 Education Features
- [ ] Teacher accounts (manage multiple sessions)
- [ ] Student roster import
- [ ] Session analytics (who participated, how long)
- [ ] Assignment integration (link sessions to homework)

#### 5.3 API & Developer Platform
- [ ] Public API for session management
- [ ] Webhooks for session events
- [ ] Custom integrations (LMS, note-taking apps)
- [ ] Plugin system for custom tools

#### 5.4 Community & Content
- [ ] Template marketplace (users share templates)
- [ ] Tutorial library (how to use for different subjects)
- [ ] Community forum (feature requests, support)
- [ ] Ambassador program (power users help others)

---

## Success Metrics by Phase

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|--------|---------|---------|---------|---------|---------|
| **Weekly Active Sessions** | 10 | 100 | 1,000 | 5,000 | 20,000 |
| **Test Coverage** | 0% | 80% | 85% | 90% | 95% |
| **Avg Session Duration** | N/A | 15 min | 20 min | 30 min | 45 min |
| **User Retention (7-day)** | N/A | 20% | 40% | 50% | 60% |
| **Page Load Time (3G)** | ~3s | <2s | <1.5s | <1s | <1s |
| **Canvas Sync Latency** | 100ms | <100ms | <75ms | <50ms | <50ms |
| **Mobile Users** | 20% | 30% | 50% | 60% | 70% |

---

## Risk Assessment

### High-Risk Items

**1. Real-Time Performance at Scale**
- **Risk:** Supabase Realtime may not handle 100+ concurrent sessions
- **Mitigation:** Load test early, plan Socket.io migration if needed
- **Impact:** High (core feature)

**2. Abuse & Spam**
- **Risk:** Anonymous access makes abuse easy
- **Mitigation:** Rate limiting, device fingerprinting, session expiration
- **Impact:** Medium (manageable with tooling)

**3. Mobile Experience**
- **Risk:** Touch interactions with tldraw may not be smooth
- **Mitigation:** Test early, consider native apps if web UX poor
- **Impact:** High (50% of users on mobile)

**4. Monetization Viability**
- **Risk:** Users may not pay for premium features
- **Mitigation:** Keep free tier generous, explore grants/sponsorships
- **Impact:** Low (can remain free forever)

### Medium-Risk Items

**5. Data Privacy Concerns**
- **Risk:** Schools may block anonymous tools
- **Mitigation:** Clear privacy policy, COPPA/FERPA compliance messaging
- **Impact:** Medium (affects some schools)

**6. Browser Compatibility**
- **Risk:** Older browsers may not support modern APIs
- **Mitigation:** Target modern browsers only (Chrome, Safari, Firefox)
- **Impact:** Low (most students use modern browsers)

---

## Dependencies & Assumptions

### Technical Dependencies
- Next.js remains stable (App Router is production-ready)
- tldraw SDK remains free for non-commercial use
- Supabase free tier supports our scale (can upgrade if needed)
- Vercel free tier supports our traffic (can upgrade if needed)

### Business Assumptions
- Students want collaborative tools without accounts
- Study groups will naturally adopt this for homework
- Word-of-mouth will drive initial growth
- Mobile usage will increase over time

### Team Assumptions
- Solo developer (you) for Phase 1-2
- Potential contributors for Phase 3+
- No funding needed for Phase 1-2 (free tier services)
- Grant/sponsorship funding for Phase 3+ (optional)

---

## Open Questions

1. **Should we add accounts in Phase 3?** (Optional, for session history)
2. **Should we pursue education market actively?** (Or stay consumer-focused)
3. **What's the right monetization model?** (Premium, donations, grants, free forever)
4. **Should we build native mobile apps or stay web-only?** (Phase 5 decision)
5. **Should we allow file uploads (images)?** (Security risk, storage cost)

---

## Review Schedule

- **Weekly:** Review Phase 2 progress, adjust timeline
- **Monthly:** Review roadmap, re-prioritize based on learnings
- **Quarterly:** Major roadmap refresh based on user feedback

**Next Review:** 2026-02-15 (after Phase 2 testing complete)

---

## Related Documents

- [Testing Strategy](testing-strategy.md) - How to achieve 80% coverage
- [Phase 2 Templates](phase-2-templates.md) - Templates feature design
- [Architecture Decisions](architecture-decisions.md) - Key technical decisions
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
