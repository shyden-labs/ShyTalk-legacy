---
id: SHY-0716
status: Draft
owner: claude
created: 2026-10-28
priority: P1
effort: L
estimate: 8
type: chore
roadmap_ids: []
mvp: false
blocked_by: [SHY-0714]
---

# SHY-0716: Dev starts over with no accounts and no data

## User Story

As the operator, I want one hand-started workflow that removes every
account and every piece of data from dev and then puts back only what our
own seed scripts create, so that dev holds nothing anybody could take over
and nothing left from before.

## Why

Shyden, 2026-10-28 (decision 117), asked whether the 13 dev accounts at real
domains count towards SHY-0714's "0 accounts at domains we do not own":
*"remove them all. we start over fresh. this includes any accounts and
data."*

Measured 2026-10-28:

- Dev Auth holds 36 accounts (retire list run 40602507182): 22 at
  `shytalk.dev`, 13 at real domains (gmail.com 7, privaterelay.appleid.com
  3, hotmail.co.uk 1, icloud.com 1, airelogic.com 1), 1 without an email.
- `scripts/reset-data.mjs` wipes Firestore, R2 and RTDB but **no Auth
  account**, and no workflow runs it.
- It wipes a hand-written list of 25 collections. `express-api/src` names
  at least 42 collections by literal name (whole-text scan of 153 files);
  **21 are not on the list** (ageVerificationSubmissions, alerts,
  appleNotifications, auditLog, biometricKeys, blockedTopics, comments,
  edits, giftRankings, identityGraphs, logs, moderationLog, notifications,
  orphanRefunds, pendingRefundReversals, recall, segregationEvents,
  suggestion_disputes, suggestions, supportTickets, votes; some are
  subcollections).
- RTDB: the code writes three roots (rooms, conversations, ownerLeft); the
  script clears two.

## Acceptance Criteria

### Happy path

- [ ] A dispatch-only workflow deletes every dev Auth account, every
      Firestore document in every collection that `listCollections` finds
      (recursively, never a list), the whole RTDB root, and every R2 object
      in `shytalk-media-dev` outside `system/`.
- [ ] It then re-seeds the dev fixtures, the test personas at `shytalk.app`
      (SHY-0714) and the two smoke accounts, the smoke sign-in from the
      existing `SMOKE_TEST_EMAIL`/`SMOKE_TEST_PASSWORD` secrets and the smoke
      target at the `SMOKE_TARGET_UNIQUE_ID` secret's uniqueId, so no secret
      changes.
- [ ] A read-back after the wipe counts 0 Auth accounts, 0 collections and
      an empty RTDB root before anything is seeded; after seeding, every
      Auth account is at `shytalk.app`.

### Error paths

- [ ] It refuses any project but `shytalk-dev`, any bucket but
      `shytalk-media-dev`, and any credential that is not the dev service
      account (a test per refusal).
- [ ] A failed delete or seed fails the run naming the step; it never
      prints a completion line after a failure.

### Edge cases

- [ ] More than 1,000 Auth accounts (the `deleteUsers` batch size) and more
      than 500 documents in one collection are both deleted in full (a unit
      test each with the dependency mocked).
- [ ] A collection the code never names is still found and deleted (a unit
      test plants one).
- [ ] The run's typed confirmation input must equal `shytalk-dev`.

### Performance

- [ ] The workflow step carries one measured limit.

### Security

- [ ] The job uses the dev service account only and names no environment
      holding a production key (parsed-YAML test).
- [ ] The logs print counts only, never an address (the repo is public).

### UX

- [ ] Testers are told before the first run that their dev accounts go and
      that they sign up again (Shyden sends it, or picks who does).

### i18n

- [ ] None.

### Observability

- [ ] The run summary lists each store's count before and after.

### Runtime proof

- [ ] After a real run: the retire workflow's list mode reads 0 accounts at
      any domain but `shytalk.app`; the next deploy-dev's Dev Smoke Tests
      pass; a journey signs in as a re-seeded persona.

## Announce

Not announced: dev only.

## BDD Scenarios

**Scenario: dev starts over**

- **Given** dev holds accounts at shytalk.dev and at real domains
- **When** the operator dispatches the reset with `shytalk-dev` typed
- **Then** every account and document is gone, and only the seeded
  accounts at shytalk.app come back

## Test Plan

- Unit: each wipe step with Firebase, RTDB and S3 mocked; refusals; batch
  edges; the planted unknown collection.
- Emulator integration: a seeded emulator wiped to zero and re-seeded.
- Replaces `scripts/reset-data.mjs` or reuses its tested steps.

## Out of Scope

- Production: SHY-0717.

## Dependencies

- SHY-0714 PR 2 (personas provisioned at shytalk.app).

## Risks & Mitigations

- A tester loses dev work: dev data is test data; testers are told first.

## Definition of Done

- [ ] Every AC ticked with its proof; CI green by step name; merged; run
      once for real and read back.

## Notes

- 2026-10-28: estimate 8 against SHY-0714 PR 1 (one dev-only dispatch
  workflow plus a script with 59 unit tests, about 5 of SHY-0714's 13); this
  covers four stores and the re-seed.
