---
id: SHY-0711
status: Draft
owner: claude
created: 2026-10-27
priority: P0
effort: S
estimate: 3
type: bug
roadmap_ids: []
mvp: true
blocked_by: []
---

# SHY-0711: The website sends people to addresses nobody reads, one on a domain anybody can buy

## User Story

As **somebody asking ShyTalk for my data, to delete my account, or to appeal
a ban**, I want the address the website gives me to reach ShyTalk, so that my
request is answered and never lands with a stranger.

## Why

Measured 2026-10-27 on `origin/main` and `origin/develop`:

- `public/portal/portal.js` names **`support@shytalk.dev` 6 times**: data
  export, account deletion, suspension appeal and ban appeal (two
  `mailto:` links among them).
- **Nobody owns `shytalk.dev`.** The registry (RDAP, `rdap.org`) returned 404
  for it while returning 200 for `google.dev` in the same run. Today those
  emails bounce. Anybody who registers the name (about $8) receives every
  one of them, with the account details the portal asks people to include.
- The legal pages name `shytalk.help@gmail.com`, a mailbox nobody reads
  (SHY-0395, SHY-0422): `privacy.html` 3, `do-not-sell.html` 2,
  `terms.html` 1, `community-guidelines.html` 1, `js/legal-translations.js`
  12. The privacy policy is where people go to exercise their data rights.

Shyden, 2026-10-27: *"this email address is obviously wrong. it needs to
change to a new email using our new domain."* The new domain is
`shytalk.app`; the address is `support@shytalk.app`, a Zoho Mail Forever
Free mailbox until ShyTalk's own help desk takes email in (rewrite).

## Acceptance Criteria

### Happy path

- [ ] Every web page that gives a contact address gives
      `support@shytalk.app`, and only that.
- [ ] A test mail sent to `support@shytalk.app` from an outside account
      arrives in the mailbox BEFORE this change ships (screenshot or
      message id in the PR).

### Error paths

- [ ] No page or script under `public/` names `support@shytalk.dev` or
      `shytalk.help@gmail.com`: a guard over the whole `public/` tree,
      floored at the measured file count, planted red with each address.

### Edge cases

- [ ] Every `mailto:` link opens the new address, asserted on the rendered
      link, not the source.
- [ ] Translated legal text keeps its wording apart from the address, and
      every changed line is read back by Google Cloud Translation before
      commit, with the writer/reader table in the PR.

### Performance

- [ ] No change.

### Security

- [ ] The guard runs in CI, so no dead or unowned address can come back.

### UX

- [ ] Somebody in trouble reaches a person who can answer.

### i18n

- [ ] Every locale of the legal pages carries the new address, asserted per
      locale (one test per locale).

### Observability

- [ ] None needed: the guard is the lasting check.

### Runtime proof

- [ ] On dev, the portal's data-export, deletion and appeal messages and the
      privacy page show `support@shytalk.app` (Playwright, CI).

## Announce

Not announced: a correction to contact details.

## BDD Scenarios

**Scenario: asking to delete an account**

- **Given** a signed-in member on the account portal
- **When** they ask to delete their account
- **Then** they are told to write to `support@shytalk.app`

**Scenario: an old address comes back**

- **Given** a change that adds `support@shytalk.dev` to any file in `public/`
- **When** CI runs
- **Then** the guard fails naming the file and the address

## Test Plan

- Guard test over `public/` (floor, planted red per address).
- Playwright on the portal messages and the privacy page, every locale.

## Out of Scope

- The app's strings naming `shytalk.help@gmail.com`: SHY-0422.
- The sending domain and inbound mail for tickets: SHY-0395.
- Dev persona addresses on `shytalk.dev`: SHY-0714 (Shyden 2026-10-27 is
  not buying `shytalk.dev`).

## Dependencies

- Shyden buys `shytalk.app` (only) in ShyTalk's own Cloudflare
  account and opens the Zoho Mail Free mailbox (his steps).

## Risks & Mitigations

- Pointing at a new address before it receives repeats the defect: the
  test mail AC comes first.

## Definition of Done

- [ ] Every AC ticked with its proof; CI green by step name; merged.

## Notes

- 2026-10-27: estimate 3 against SHY-0512 (3, support copy pointing at the
  wrong website): the same string change across `public/`, plus one guard.
