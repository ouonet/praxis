---
name: review
description: Use before merge, after subagents, or for spec/plan review.
---
# Review

Check in order:
1. **Spec match** - diff does what the spec/plan said? List drift.
2. **Tests** - new behavior covered, all green?
3. **Edges** - null, empty, large, concurrent, malformed, unicode, timezone.
4. **Security** - input validation, secrets, authz, injection, path traversal.
5. **Scope** - unrelated changes? Revert.

For spec/plan reviews, also block unresolved implementation notes, plan assumptions absent from spec, vague acceptance, or premature `[parallel]`.

Report:
```
BLOCK: <must fix>
FIX:   <should fix>
NIT:   <optional>
```
BLOCKs resolved before merge. FIX resolved or explicitly deferred with reason.