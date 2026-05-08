---
name: ship
when: all plan tasks done and green
---
# Ship

1. All tests green.
2. `review` the whole diff.
3. **Archive the spec.** In `docs/specs/<topic>.md`: delete `## Working notes`, TBDs, process narrative. Only decisions/contracts/invariants remain.
4. Delete or archive `docs/plans/<topic>.md`. Plans don't belong on `main`.
5. Update CHANGELOG if user-visible.
6. Ask: **merge / PR / keep / discard.**
7. On merge or PR: clean up worktree, delete local branch.

No push or PR without explicit user approval.

