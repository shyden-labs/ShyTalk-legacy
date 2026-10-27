---
id: SHY-0712
status: Draft
owner: claude
created: 2026-10-27
priority: P3
effort: XS
estimate: 1
type: chore
roadmap_ids: []
mvp: false
blocked_by: []
---

# SHY-0712: Check whether shytalk.co.uk is renewed, and tell Shyden if it is released

## User Story

As the operator, I want to know if `shytalk.co.uk` is let go, so that I can
decide whether to buy it.

## Why

`shytalk.co.uk` belongs to somebody else. Nominet's record, read 2026-10-27:
registered 2025-09-02 through Network Solutions, Bluehost name servers,
**expiry 2027-09-02**. Shyden, 2026-10-27: *"make a note of the expiry date
and check to see if the owner renews it or lets it expire. if it expires we
will consider buying it."*

Nominet's lifecycle (its 2020 consultation response and lifecycle
document): an unrenewed `.uk` name is suspended 30 days after expiry,
cancelled about 90 days after expiry at a random time within a 24-hour
window, and may take a few days to show as available.

## Acceptance Criteria

### Happy path

- [ ] On or after **2027-09-03**, the Nominet whois record is read and the
      new expiry date (renewed) or the unchanged one (not renewed) is
      written in Notes.
- [ ] If not renewed: read again after **2027-10-02** (suspension) and from
      **2027-12-01** (cancellation) until it shows as available, and Shyden
      is told in chat that turn, with the Cloudflare price read that day.

### Error paths

- [ ] A whois read that names no expiry date is not taken as "released":
      read `nominet.uk` for a known registered name in the same run.

### Edge cases

- [ ] Renewed before 2027-09-02: the new expiry is recorded and this ticket
      moves its dates to the new expiry.

### Performance

- [ ] No change.

### Security

- [ ] None.

### UX

- [ ] None.

### i18n

- [ ] None.

### Observability

- [ ] Each read is dated in Notes.

### Runtime proof

- [ ] The whois output for each read is quoted in Notes.

## Announce

Not announced: internal.

## BDD Scenarios

**Scenario: the owner lets it go**

- **Given** the expiry date has passed without renewal
- **When** the name is cancelled and shows as available
- **Then** Shyden is told that day with the price

## Test Plan

- None: a dated manual read, no clock and no quota (Shyden's rule against
  unasked schedules).

## Out of Scope

- Buying it: Shyden's call when told.

## Dependencies

- None.

## Risks & Mitigations

- Dropped names are often caught by back-order services at release: say so
  when telling Shyden.

## Definition of Done

- [ ] The outcome recorded and, if released, Shyden told.

## Notes

- 2026-10-27: estimate 1: two or three whois reads.
