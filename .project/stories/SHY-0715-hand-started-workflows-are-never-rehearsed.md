---
id: SHY-0715
status: Draft
owner: claude
created: 2026-10-27
priority: P2
effort: XL
estimate: 13
type: chore
roadmap_ids: []
mvp: false
blocked_by: []
---

# SHY-0715: Workflows that never run on a pull request are never rehearsed

## User Story

As the operator, I want every workflow that never runs on a pull request to
be rehearsed inside the pull request's CI with fake keys and stand-in
services, so that a broken deploy, cron or clean-up is caught before it
runs for real.

## Why

Global rule, 2026-10-27 (every project; asked in yawelo-idle #762/#738):
non-PR workflows are rehearsed by a practice runner (nektos/act, MIT) that
runs the UNCHANGED workflow files in the PR's CI, never started for real.

Measured 2026-10-27 over `.github/workflows` (30 files): 25 have no
`pull_request`/`merge_group` trigger; 9 of those are reached from
`pr-checks.yml` through `workflow_call`. That leaves **16 workflows that
never run on a pull request, none rehearsed**: cron-account-deletion,
cron-support-retention, delete-orphaned-message-history, deploy-dev,
deploy-prod, force-cancel, manual-qa-matrix, playwright-nightly,
reap-stuck-runs, release-tag, release, retire-dev-persona-accounts,
rollback, seed-dev-personas (through deploy-dev), sync-roadmap-data,
sync-stories-to-issues.

Shyden, 2026-10-27, picked "Workflow now, act later" for SHY-0714's
`retire-dev-persona-accounts.yml`: it ships unrehearsed until this story
lands (decision 115).

## Acceptance Criteria

### Happy path

- [ ] A required PR check rehearses each of the 16 workflows with act,
      unchanged, with fake keys and network-level stand-ins (hosts file +
      per-run CA) for every outside service, GitHub's API included.
- [ ] The rehearsal writes the `ref` each job gates on, and fails when a
      rehearsed job left no trace (act runs nothing and exits 0 without
      one).

### Error paths

- [ ] A planted fault in each workflow (a broken `run:` line, a missing
      secret name) turns the rehearsal red, naming the workflow.
- [ ] Anything act cannot run faithfully is listed and put to Shyden.

### Edge cases

- [ ] The set of rehearsed workflows is derived from the filesystem
      (no PR trigger, not reached from a PR workflow), floored at 16, so a
      new hand-started workflow is rehearsed or the check fails.
- [ ] act's +1 line offset in `run:` scripts is accounted for in any
      line-based assertion.

### Performance

- [ ] The rehearsal's CI step carries one measured limit.

### Security

- [ ] The rehearsal job holds no real secret and names no environment
      (parsed-YAML test).

### UX

- [ ] None.

### i18n

- [ ] None.

### Observability

- [ ] The check's summary names each workflow rehearsed and its verdict.

### Runtime proof

- [ ] A PR that breaks one hand-started workflow is red on the rehearsal
      before merge.

## Announce

Not announced: CI only.

## BDD Scenarios

**Scenario: a hand-started workflow breaks**

- **Given** a change that breaks a `run:` line in `rollback.yml`
- **When** the pull request's CI runs
- **Then** the rehearsal fails naming `rollback.yml`

## Test Plan

- Spike act 0.2.89 on two workflows first (one with a key, one without).
- One rehearsal case per workflow, each planted red.
- Floor on the derived workflow set.

## Out of Scope

- The rewrite's new repo carries the rule from day one (plan 2).

## Dependencies

- None.

## Risks & Mitigations

- Decision 88 closes open tickets when this repo is archived; until then
  the deploy and cron workflows still run here.

## Definition of Done

- [ ] Every AC ticked with its proof; CI green by step name; merged.

## Notes

- 2026-10-27: estimate 13 against SHY-0657 (the red-first rules CI check,
  one new required check over every rules change); this covers 16
  workflows, several holding production keys, plus a stand-in for every
  outside service. May split once the spike measures act's fit.
