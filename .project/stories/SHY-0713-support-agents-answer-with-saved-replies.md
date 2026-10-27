---
id: SHY-0713
status: Draft
owner: unassigned
created: 2026-10-27
priority: P2
effort: L
estimate: 8
type: feature
roadmap_ids: []
epic: EPIC-0012
mvp: false
blocked_by: []
---

# SHY-0713: Support agents answer common requests with saved replies

## User Story

As **a support agent working tickets**, I want to answer the common kinds
of request from a saved reply that I can adjust before sending, so that
regular requests are answered quickly and consistently.

## Why

Shyden, 2026-10-27: *"I'd also like one where we can set up template
responses. making replies much easier and faster for regular kinds of
support requests."* He chose ShyTalk's own help desk over a third-party one
the same day: users raise, update and track tickets in their ShyTalk
account, email stays an option, and *"multiple people [can] log in to
'claim' support tickets and handle them. at first it'll just be me."*
Claiming is already in EPIC-0012's lifecycle; saved replies are not.

The help desk is rebuilt in the app rewrite (*"the way this ticket support
system is currently is likely to change into something even better"*), so
this story states the behaviour, not today's screens.

## Acceptance Criteria

### Happy path

- [ ] An agent creates, edits, renames and deletes a saved reply with a
      title, a body and a ticket category.
- [ ] While answering a ticket, the agent picks a saved reply, edits the
      text, and sends it; the ticket records the text sent, not the
      template.
- [ ] Saved replies are shared by every agent; each records who last
      changed it and when.

### Error paths

- [ ] A saved reply naming a placeholder the ticket cannot fill (e.g. the
      member's display name) is refused before sending, naming it.
- [ ] Only agents and admins can read or change saved replies: refused for
      members, server-side.

### Edge cases

- [ ] A saved reply exists per language; the agent sees the one matching
      the member's app language first, and every translation is read back
      by Google Cloud Translation before it is saved.
- [ ] Deleting a saved reply never changes replies already sent.

### Performance

- [ ] The list of saved replies opens in under 1 s with 200 saved.

### Security

- [ ] Every change to a saved reply is an audit record written by the
      server.

### UX

- [ ] Picking a saved reply takes at most two taps or clicks from the
      reply box, by search or by category.

### i18n

- [ ] The agent screens are translated like the rest of the portal.

### Observability

- [ ] Count of replies sent from each saved reply, for pruning unused ones.

### Runtime proof

- [ ] On dev, an agent answers a seeded ticket from a saved reply and the
      member sees the edited text in their ticket.

## Announce

Announced with the help desk: staff tooling, not member-facing.

## BDD Scenarios

**Scenario: answering a data-export request**

- **Given** a saved reply "Data export: how to download"
- **And** a claimed ticket in the Privacy category
- **When** the agent inserts it, edits one line and sends
- **Then** the member sees the edited text on their ticket

**Scenario: a member tries to read saved replies**

- **Given** a signed-in member
- **When** they call the saved-replies read
- **Then** the server refuses it

## Test Plan

- Unit: placeholder filling and refusal; rules for who can read and write.
- Integration: create, use, edit and delete through the API.
- Journey: agent answers a seeded ticket on dev.

## Out of Scope

- Claiming and the agent role: EPIC-0012's other stories.
- Email into tickets: SHY-0398.

## Dependencies

- EPIC-0012's agent role and ticket lifecycle in the rewrite.

## Risks & Mitigations

- A template sent unedited to the wrong case: the reply box always opens
  the text for editing, never sends from a click.

## Definition of Done

- [ ] Every AC ticked with its proof; CI green by step name; merged.

## Notes

- 2026-10-27: estimate 8 against SHY-0399 (8: a member's ticket list with
  add, reopen and close); this adds an agent screen, a shared store, rules
  and per-language text.
- Until the help desk exists, `support@shytalk.app` is a Zoho Mail Forever
  Free mailbox (Shyden 2026-10-27); Zoho documents reply templates, not
  confirmed on the free plan until sign-up.
