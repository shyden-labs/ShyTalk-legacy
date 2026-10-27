---
id: SHY-0714
status: Draft
owner: claude
created: 2026-10-27
priority: P0
effort: M
estimate: 5
type: bug
roadmap_ids: []
mvp: true
blocked_by: [SHY-0711]
---

# SHY-0714: The test accounts use addresses on a domain anybody can buy

## User Story

As the operator, I want every test and staff account to use an address on a
domain ShyTalk owns, so that nobody outside can reset their passwords.

## Why

Measured 2026-10-27 on `origin/develop`: **239 occurrences of 30 distinct
`@shytalk.dev` addresses in 71 files** (express-api tests 24, ticket files
8, express-api scripts 6, plans 5, web tests 3, `shared/src` 3, and
`DevPersonas.kt`, `provision-test-personas.js`, `local/start.sh` among
them). They include `admin@shytalk.dev` and `claude-test@shytalk.dev`, the
dev administrator.

**Nobody owns `shytalk.dev`** (RDAP 404 beside `google.dev` 200, same run).
Firebase sends password-reset links to the account's address, so whoever
registers the domain can take over every one of these accounts, the dev
administrator included. Shyden, 2026-10-27: *"i'm not buying shytalk.dev.
only shytalk.app."* So the addresses move to `shytalk.app`.

## Acceptance Criteria

### Happy path

- [ ] Every persona and staff test account uses an address on
      `shytalk.app`, in code and in Firebase Auth on dev.
- [ ] `provision-test-personas.js` creates them under the new addresses and
      the old accounts are removed from dev Auth (Shyden's consent for the
      Firebase step).

### Error paths

- [ ] A guard over the whole tree fails on any address at a domain not on an
      owned-domains list (`shytalk.app`, `shyden.co.uk`, plus reserved
      `example.*` and `*.test`), floored at the measured file count,
      planted red with `@shytalk.dev`.

### Edge cases

- [ ] Ticket files and plans quoting the old address as history keep it,
      listed by path in the guard's allowed set with the reason.
- [ ] Mail to the new test addresses never reaches a real inbox by accident:
      routing for test addresses decided and written in this story.

### Performance

- [ ] No change.

### Security

- [ ] Read Auth on dev (and prod, read-only, with consent) for any account
      on a domain we do not own; the count is 0 after the change.

### UX

- [ ] None: test accounts only.

### i18n

- [ ] None.

### Observability

- [ ] None: the guard is the lasting check.

### Runtime proof

- [ ] A journey signs in as a re-provisioned persona on dev with the new
      address.

## Announce

Not announced: test accounts only.

## BDD Scenarios

**Scenario: an unowned address comes back**

- **Given** a change adding `someone@shytalk.dev` anywhere outside the
  history set
- **When** CI runs
- **Then** the guard fails naming the file and the domain

## Test Plan

- Guard test (floor, planted red).
- Persona unit tests updated to the new addresses.
- Journey sign-in on dev.

## Out of Scope

- Web pages' support address: SHY-0711.

## Dependencies

- SHY-0711: `shytalk.app` bought and the mailbox set up first.
- Shyden's consent for the Firebase Auth changes on dev.

## Risks & Mitigations

- Somebody registers `shytalk.dev` before this lands: the persona passwords
  are already never in shipped builds (SHY-0662); this story is the fix,
  P0 for that reason.

## Definition of Done

- [ ] Every AC ticked with its proof; CI green by step name; merged.

## Notes

- 2026-10-27: estimate 5 against SHY-0662 (5, persona password out of every
  shared build: the same persona files plus a guard); this adds Auth
  re-provisioning on dev.
