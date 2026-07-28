---
name: review
description: Use before merge, after subagents, or for spec/plan review.
---
# Review

Check in order:
1. **Spec match** (if spec exists) - diff does what the spec/plan said? List drift.
2. **Standards** — lint/format/typecheck green? Code matches `convention`, idiomatic for the stack? (see `../references/quality.md`)
3. **Tests** - new behavior covered, all green?
4. **Doc-coverage** — `contract` covers full public surface, including stability obligations? Env vars/config/error modes documented? README commands runnable? tech-spec `contract`/`convention` match code? (see `../references/quality.md`)
5. **Edges** - null, empty, large, concurrent, malformed, unicode, timezone.
6. **Security** - input validation, secrets, authz, injection, path traversal.
7. **Scope** - unrelated changes? Revert. Implementation >2x necessary? Flag as FIX.

For spec/plan reviews, also block unresolved implementation notes, plan assumptions absent from spec, vague acceptance, or premature `[parallel]`.

Report:
```
BLOCK: <must fix>
FIX:   <should fix>
NIT:   <optional>
```
BLOCKs resolved before merge. FIX resolved or explicitly deferred with reason.
