# Launch Readiness Checklist

Last updated: 2026-03-20
Status owner: Codex

## Goal

Turn launch risk into a tracked execution checklist with clear pass/fail criteria, beginning with the highest-risk user journeys:

1. Auth and session integrity
2. Portal/course access integrity
3. Progress persistence and cross-device consistency
4. Quiz/certificate gating
5. Enrollment/payment/tier gating
6. Mission Control and autoresearch reliability

## Release Blockers

### 0. Geoblock and Security Perimeter

- [ ] Brazil-only geoblock remains active as default production rule
- [ ] No broad exception accidentally reopens high-bandwidth attack surface
- [ ] Auth callbacks required for Brazil users still work under geoblock policy
- [ ] Essential provider webhooks are explicitly reviewed, not implicitly opened
- [ ] High-cost or heavy-content routes remain blocked outside Brazil unless strictly required

Pass criteria:
- The app remains usable for intended Brazil traffic without weakening the bandwidth-protection perimeter.

### 1. Auth and Session Integrity

- [ ] Email login works on production
- [ ] Google login works on production
- [ ] Logout works cleanly
- [ ] Refresh preserves session
- [ ] Cookie-session users are treated as authenticated across all critical portal surfaces
- [ ] No redirect loops
- [ ] No spinner hang on portal entry

Pass criteria:
- User can log in, refresh, navigate, and log out without partial-auth behavior.

### 2. Portal and Course Access Integrity

- [ ] Dashboard loads for email-login users
- [ ] Dashboard loads for Google-login users
- [ ] Enrolled course opens from dashboard
- [ ] Learn reader loads content for entitled users
- [ ] Access-denied behavior is correct for non-entitled users
- [ ] Continue/resume links open the correct course and location

Pass criteria:
- Entitled users never see false denial, and non-entitled users are blocked consistently.

### 3. Progress Persistence Integrity

- [ ] Reader progress matches dashboard progress
- [ ] Progress survives reload
- [ ] Progress survives login method differences
- [ ] Progress survives cross-device usage
- [ ] Legacy saved chapter ids still restore correctly
- [ ] Local cache does not override newer server truth

Pass criteria:
- One user/course has one truth across DB, dashboard, and reader.

### 4. Quiz and Certificate Integrity

- [ ] Quiz unlocks only when eligibility conditions are met
- [ ] Quiz submission succeeds for authenticated users
- [ ] Certificate issuance succeeds
- [ ] Certificate download succeeds
- [ ] Certificate verification page works publicly

Pass criteria:
- Users can complete the full certification journey without auth mismatches.

### 5. Enrollment, Pricing, Tier, and Payments

- [ ] `/api/courses/access` behaves correctly
- [ ] `/api/courses/enroll` behaves correctly
- [ ] Tier entitlements match UI promises
- [ ] Certificate upsell logic matches business rules
- [ ] Checkout path works for core plans
- [ ] User state updates after successful checkout/enrollment

Pass criteria:
- Product promise, access logic, and checkout outcomes all match.

### 6. Mission Control and Autoresearch

- [ ] OpenRouter loop starts and completes with visible status
- [ ] LMStudio loop starts and completes with visible status
- [ ] Failed loops can be inspected and restarted
- [ ] Loop detail pages expose artifacts and outcomes
- [ ] Polling stops when loops are idle/completed
- [ ] Status/cost/keep-discard metrics remain consistent

Pass criteria:
- No silent loop failures and no fake-running states.

## Execution Plan

### Phase A. Highest Risk, Immediate

- [ ] Validate geoblock-sensitive auth and callback routes without relaxing global perimeter
- [ ] Regress email login
- [ ] Regress Google login
- [ ] Regress portal load after login
- [ ] Regress one enrolled course from dashboard to reader
- [ ] Regress progress save and reload
- [ ] Regress logout

### Phase B. Learning Integrity

- [ ] Regress quiz open
- [ ] Regress quiz submit
- [ ] Regress certificate issue/download/verify
- [ ] Regress continue button and resume position

### Phase C. Commercial Integrity

- [ ] Regress enroll/access for eligible user
- [ ] Regress one checkout flow
- [ ] Validate tier gating and discounts against backend truth

### Phase D. Ops and Reliability

- [ ] Regress mission-control loop creation and detail management
- [ ] Regress auto-loop status visibility
- [ ] Review production warnings and operational debt

## Known Issues Already Addressed

- Google auth redirect loops
- Cookie-vs-localStorage split auth in critical portal flows
- Reader showing `0%` despite saved server progress
- Store/POD/Prodigi panels rejecting cookie-session users
- Reader local cache not being realigned with server truth

## Open Technical Debt To Resolve After Critical Journeys Are Green

- [ ] Duplicate Mongoose index warnings
- [ ] `baseline-browser-mapping` outdated dev dependency
- [ ] Add repeatable smoke harness for release validation
- [ ] Add production observability for auth/progress/certificate failures

## Current Working Rule

- Use one deploy path per round only.
- Prefer `git push origin main`.
- Do not trigger an extra manual deploy unless explicitly needed.
- Treat geoblocking as a permanent production control, not a temporary workaround.
