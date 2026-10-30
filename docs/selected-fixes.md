# Selected audit fixes — implementation notes

Branch: `audit/selected-fixes-2026-10`

## Implemented in application code
- Breaks: the same pause interval is used by the calendar staffing calculation; a 30-minute break is deducted from paid/work minutes. The planner's work-duration threshold remains six net hours.
- Working-time checks: manual assignment and weekly diagnostics check breaks, a ten-hour net daily limit, and eleven-hour rest between adjacent shifts. These are conservative checks, not a substitute for the employer's complete working-time agreement or legal review.
- Leader: office hours remain outside the group-planning target; only the explicitly configured group hours are assignable. Existing leader recurring blocks remain hard blocks.
- Coverage: coverage strips now use pause-aware presence, so a person on break is not counted as present.
- NRW holidays: the leave-day counter excludes statutory NRW public holidays (including movable Easter-related holidays).
- Absences: an absence is rejected when it would overlap existing shifts, rather than leaving contradictory data behind.
- Events: weekly recurrence can be recorded; the calendar expands recurring events; event attendees are checked against existing shifts, and new shifts are checked against event times. The event sub-pages are now linked in navigation.
- Concurrency: state writes use optimistic locking against the last observed `updated_at`. A stale client is warned instead of silently overwriting another session.
- Input safety: rendered application and modal HTML passes through a sanitizer that strips scripts, embedded active content, event-handler attributes and unsafe URL attributes. Employee option and form values are also escaped.
- Tests: Node regression tests and Playwright mobile/desktop smoke tests are configured in GitHub Actions.

## Manual / external steps still required
1. Review and run `supabase/security.sql` in the Supabase SQL Editor. It is intentionally not applied remotely by this repository change. Confirm actual column types and existing policies first.
2. Validate working-time policy with the Kita's actual breaks, shift patterns, tariff/collective agreement, and legal counsel. The current checks are guardrails, not legal certification.
3. Office time is excluded from the leader's group-hours target. The leader profile now provides a recurring-block editor; enter the actual office days and times there for time-of-day blocking.
4. The Playwright tests only cover initial login-screen rendering at mobile and desktop sizes. They do not sign into the real Supabase project or validate authenticated app flows / generated PDF on a physical iPhone.
5. Vacation balances now count approved/recorded vacation separately by calendar year and exclude weekends plus NRW public holidays. The per-person annual entitlement remains manually entered; carry-over, individual work patterns, and part-time accrual rules still require confirmed employment rules.
6. Browser tests run in CI. Local execution requires `npm install`, `npx playwright install chromium`, and `npm run test:browser`.

## Test commands
- `npm test`
- `npm run test:browser`

## Data safety
The code changes are on a separate branch and do not alter the production `main` branch or live Supabase data. Do not merge until the SQL policy review and CI results are complete.
