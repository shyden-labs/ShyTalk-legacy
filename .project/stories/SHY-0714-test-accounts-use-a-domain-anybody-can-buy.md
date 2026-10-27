---
id: SHY-0714
status: Draft
owner: claude
created: 2026-10-27
priority: P0
effort: XL
estimate: 13
type: bug
roadmap_ids: []
mvp: true
blocked_by: []
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

The same risk sits under every other made-up address at a real domain.
Measured 2026-10-27 over all 2,957 tracked files: **703 addresses at
domains ShyTalk does not own, in 123 files, over 33 domains** (shytalk.dev
235, gmail.com 230, test.com 81, work.com 59, b.com 15, mailinator.com 13,
x.com 12, x.dev 12, the rest under 5 each). Shyden, 2026-10-27, picked
"Full rule, this story": every one moves or is listed with its reason.

## Acceptance Criteria

### Happy path

- [ ] Every persona and staff test account uses an address on
      `shytalk.app`, in code and in Firebase Auth on dev.
- [ ] `provision-test-personas.js` creates them under the new addresses and
      the old accounts are removed from dev Auth (Shyden's consent for the
      Firebase step).

### Error paths

- [ ] A guard over the whole tree fails on any address at a domain not on an
      owned-domains list (`shytalk.app`, `shyden.co.uk`, plus the reserved
      `example.com`/`.net`/`.org`, `*.test`, `*.invalid`, `*.example`),
      floored at the measured file count, planted red with `@shytalk.dev`
      and with a templated address (`${stamp}@shytalk.dev`).
- [ ] Every made-up address at a domain we do not own (gmail.com, test.com,
      work.com, x.com, b.com and the rest) moves to a reserved name; the
      guard's allowed list is empty of made-up addresses.

### Edge cases

- [ ] Ticket files and plans quoting the old address as history keep it,
      listed by path in the guard's allowed set with the reason.
- [ ] Addresses that must name a real domain (the disposable-email
      blocklist and its tests, provider behaviour, service-account formats,
      `shytalk.help@gmail.com` until SHY-0711 replaces it) are listed by
      path and domain, each with its reason.
- [ ] `com.shyden.shytalk.dev` (the dev app's package id) and other
      non-address `shytalk.dev` text are untouched; the guard judges `@`
      addresses only.
- [ ] Mail to the new test addresses never reaches a real inbox by accident:
      routing for test addresses decided and written in this story.

### Performance

- [ ] No change.

### Security

- [ ] Read Auth on dev (and prod, read-only, with consent) for any account
      at `shytalk.dev` or another domain our own code or data invented; the
      count is 0 after the change. Accounts at real domains (13 on dev,
      2026-10-28) go with SHY-0716's dev reset, production's with SHY-0717
      (decisions 117-118).
- [ ] The dev smoke account, made by hand and not by
      `provision-test-personas.js`, moves to `shytalk.app` before the old
      accounts are disabled, and Dev Smoke Tests pass on it (decision 116).

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

- Shyden's consent for the Firebase Auth changes on dev.
- Not SHY-0711: Shyden lifted that block 2026-10-27 ("Start now"). The
  domain is owned since 2026-10-27T04:00Z; until the mailbox exists, mail
  to the new addresses bounces.

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
- 2026-10-27: re-estimated 5 -> 13 when the scope grew to every unowned
  domain (decision 114): 123 files instead of 70, plus an allowed list
  with a reason per entry. Against SHY-0545 (the retired-org guard, a
  whole-tree walk with a files-read floor), whose walker this guard shares.
- 2026-10-27: `retire-dev-persona-accounts.yml` ships without a practice-
  runner rehearsal (Shyden: "Workflow now, act later", decision 115);
  SHY-0715 brings act to it and the 15 other hand-started workflows.
