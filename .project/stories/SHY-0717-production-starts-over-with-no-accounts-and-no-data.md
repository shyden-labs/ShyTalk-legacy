---
id: SHY-0717
status: Draft
owner: claude
created: 2026-10-28
priority: P2
effort: XL
estimate: 13
type: chore
roadmap_ids: []
mvp: false
blocked_by: [SHY-0716]
---

# SHY-0717: Production starts over with no accounts and no data

## User Story

As the operator, I want a workflow I approve each time that backs up and
then removes every account and every piece of data from production and
puts back only the fixtures production needs, so that the rewrite starts
on a clean production with nothing left from testing.

## Why

Shyden, 2026-10-28 (decision 118), picked "Production too" for the fresh
start of decision 117, then: *"please remember that this application was
never released to anyone, so production is safe to properly reset"*.
Production (`shytalk-7ba69`, the `.firebaserc` default) holds only our own
test data: no real users, no real purchases.

His ruling of 2026-10-18: a production wipe is only ever a workflow gated by
the `production` environment, never a laptop script.

## Acceptance Criteria

### Happy path

- [ ] A dispatch-only workflow, run from `main`, in the `production`
      environment (ShydenMcM required reviewer), first backs up production
      (Firestore export, RTDB export, Auth export, R2 copy) to a private
      location, reads each backup back, then runs SHY-0716's wipe steps
      against production: every Auth account, every collection
      `listCollections` finds, the RTDB root, every R2 object outside
      `system/`.
- [ ] It then seeds production's fixtures only (gifts, economy config,
      banner); no test persona is ever created in production.
- [ ] A read-back counts 0 Auth accounts, only the seeded collections, and
      an empty RTDB root apart from what seeding writes.

### Error paths

- [ ] No delete starts until every backup is read back; a failed backup or
      read-back fails the run naming it.
- [ ] It refuses any project but `shytalk-7ba69`, any ref but `main`, and a
      typed confirmation input that is not `shytalk-7ba69`.

### Edge cases

- [ ] The backup is kept 30 days and then expires by a lifecycle rule
      (global backup rule); dropping it earlier is Shyden's call.
- [ ] The Auth export holds password hashes: it is encrypted at rest,
      readable only by the production service account, and never printed.

### Performance

- [ ] The workflow step carries one measured limit.

### Security

- [ ] The production credential lives only in the `production`
      environment; a parsed-YAML test pins the environment, the `main`-only
      ref and the required reviewer.
- [ ] Logs print counts only (the repo is public).

### UX

- [ ] None: never released (Shyden, 2026-10-28).

### i18n

- [ ] None.

### Observability

- [ ] The run summary lists each store's count before and after, and the
      backup's location and expiry date.

### Runtime proof

- [ ] One approved real run, read back by count; the production app and API
      still start and serve their health checks afterwards.

## Announce

Not announced: never released.

## BDD Scenarios

**Scenario: production starts over**

- **Given** production holds test accounts and data
- **When** Shyden approves the dispatched reset with `shytalk-7ba69` typed
- **Then** a backup is written and read back, every account and document
  is removed, and only production's fixtures come back

## Test Plan

- Unit: backup-before-delete ordering, refusals, the confirmation input,
  with every service mocked.
- Reuses SHY-0716's tested wipe steps with the project as a parameter.
- Emulator integration: backup, wipe and seed against an emulator.

## Out of Scope

- Dev: SHY-0716.

## Dependencies

- SHY-0716 (the wipe steps).

## Risks & Mitigations

- A wipe of the wrong project: refused unless the project, the ref and the
  typed input all name production, and Shyden approves the run.
- When it runs is Shyden's call, asked before the first run (the rewrite's
  cut-over is the natural moment).

## Definition of Done

- [ ] Every AC ticked with its proof; CI green by step name; merged; one
      approved run read back.

## Notes

- 2026-10-28: estimate 13 against SHY-0716 (8): the same wipe plus a
  verified backup of four stores, the production gate and its tests.
