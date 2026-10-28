---
id: SHY-0718
status: Draft
owner: claude
created: 2026-10-28
priority: P0
effort: S
estimate: 3
type: bug
roadmap_ids: []
mvp: false
blocked_by: []
---

# SHY-0718: A new account's first unfollow is refused as "Not found"

## User Story

As a new member, I want my first follow or unfollow to work the first time,
so that the app never tells me a person does not exist when they do.

## Why

Measured 2026-10-28, deploy-dev run 40604498394, job "Dev Smoke Tests", the
first smoke run with the new smoke account `dev-smoke-d3e4b9@shytalk.app`
(uniqueId 10000014, made about 15 minutes earlier through `POST /api/users`,
date of birth 2000-01-01):

- `tests/web/dev-smoke.spec.ts:309` "POST follow → GET target shows smoke
  as a follower → POST unfollow leaves no trace" failed at 23:51:19Z in
  186 ms: `pre-clean unfollow expected 200 (idempotent), got 404:
  {"error":"Not found"}` (spec line 334).
- Playwright's `retries: 1` (`playwright.config.ts:42`, SHY-0598) re-ran it
  at 23:51:22Z and it passed (938 ms); the job reported 22 passed, 1 flaky,
  and went green.
- The next run (40605273872, 23:56Z) passed all 23 on the first attempt.
- The run uploaded no artifacts, so no trace exists.

In `POST /api/users/:uniqueId/unfollow` (`express-api/src/routes/users.js`)
the only 404 with that body is `requireSameCohort`
(`express-api/src/middleware/sameCohort.js`): the target's user doc missing,
or the caller's token cohort (`cohortFromClaim`, `'minor'` when absent)
differing from the target's `effectiveCohort`. Signup mints
`cohort: 'adult'` for this date of birth, so why the first attempt was
judged cross-cohort and the retry three seconds later was not is NOT yet
known. Not fixed by guessing: measured first.

## Acceptance Criteria

### Happy path

- [ ] The cause is measured: the `segregationEvents` row for source
      10000014, target 10000008, near 23:51:19Z (its `sourceCohort` and
      `targetCohort`), read on dev with consent; the cause is written here
      before any fix.
- [ ] A brand-new account's first follow and unfollow of a same-cohort
      member succeed on the first attempt (a failing test first, at the
      level the cause lives).

### Error paths

- [ ] A truly cross-cohort follow or unfollow still returns 404 and writes
      its segregation event (existing tests stay green).

### Edge cases

- [ ] The smoke suite's first run after its account is re-created (SHY-0716
      re-creates it on every dev reset) passes with no retry.

### Performance

- [ ] No change.

### Security

- [ ] Cohort segregation is not loosened: the fix never treats a missing
      claim as adult.

### UX

- [ ] None beyond the happy path.

### i18n

- [ ] None.

### Observability

- [ ] None: the segregation event already records each refusal.

### Runtime proof

- [ ] With a fresh smoke account, Dev Smoke Tests pass on the first attempt
      (read the test list: no `retry #1` line).

## Announce

Not announced: never released.

## BDD Scenarios

**Scenario: a new member unfollows**

- **Given** an adult who signed up minutes ago
- **When** they unfollow another adult they do not follow
- **Then** the server answers 200, not 404

## Test Plan

- Read the segregation event; reproduce with a fresh dev account and the
  same call sequence; then a failing integration test against the emulator.

## Out of Scope

- Removing Playwright retries: SHY-0598.

## Dependencies

- None.

## Risks & Mitigations

- The cause may sit in token timing rather than the route: measure before
  choosing where the test goes.

## Definition of Done

- [ ] Every AC ticked with its proof; CI green by step name; merged.

## Notes

- 2026-10-28: estimate 3 against SHY-0716 (8, four stores and a re-seed):
  one route and one cause, with the cause still to measure first.
