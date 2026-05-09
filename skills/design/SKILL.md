---
name: design
description: Use for scope standard or complex, or when building anything new, before writing code.
---
# Design

<gate>No code until user approves the spec.</gate>

Ask one question per turn until you know what to build. Propose 2-3 approaches with trade-offs; recommend one. Then write the spec.

## Spec = list of decisions

A spec answers the open questions for THIS change. Typical:
- contract / interface?
- data shape?
- failure modes?
- out of scope?
- what test proves it?

**No question -> no section.** Don't fill "Risks" / "Non-goals" if empty.

Use declarations, not narrative:
```
contract:  <interface>
invariant: <what must hold>
test:      <how we'll know>
deferred:  <not deciding now>
```

Reference code by path; never paste it.

## Two layers, one file: `docs/specs/YYYY-MM-DD-<topic>.md`
- Top: decisions, contracts, invariants (permanent).
- `## Working notes`: scratch, open questions (stripped at `ship`).

Confirm each section with the user. Hand off to `plan`.