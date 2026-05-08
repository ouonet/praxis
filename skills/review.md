---
name: review
when: before merge, or after a subagent task
---
# Review

Check in order:
1. **Spec match** — diff does what the spec/plan said? List drift.
2. **Tests** — new behavior covered, all green?
3. **Edges** — null, empty, large, concurrent, malformed, unicode, timezone.
4. **Security** — input validation, secrets, authz, injection, path traversal.
5. **Scope** — unrelated changes? Revert.

Report:
```
BLOCK: <must fix>
FIX:   <should fix>
NIT:   <optional>
```
BLOCKs resolved before merge. FIX resolved or explicitly deferred with reason.
