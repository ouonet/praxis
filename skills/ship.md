---
name: ship
when: all plan tasks done and green
---
# Ship

1. All tests green.
2. `review` the whole diff.
3. Ensure `docs/specification.md` exists as the living-spec index; create it if missing. If behavior/contracts changed, update `docs/specification.md` or `docs/specification/*.md` and keep the index linked.
4. **Archive the change spec.** In `docs/specs/<topic>.md`: delete `## Working notes`, TBDs, process narrative. Only decisions/contracts/invariants remain.
5. Delete or archive `docs/plans/<topic>.md`. Plans don't belong on `main`.
6. Update CHANGELOG `Unreleased` if user-visible. Release moves it to a version.
7. Ask: **merge / PR / keep / discard.**
8. On merge or PR: clean up worktree, delete local branch.

No push or PR without explicit user approval.

