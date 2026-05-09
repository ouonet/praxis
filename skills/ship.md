---
name: ship
when: all plan tasks done and green
---
# Ship

1. Tests green.
2. No `- [ ]` left in `docs/plans/<topic>.md`. Finish or drop them first.
3. `review` the whole diff.
4. `docs/specification.md` exists as living-spec index; create if missing. Update `docs/specification.md` or `docs/specification/*.md` for any behavior/contract change; keep the index linked.
5. Archive `docs/specs/<topic>.md`: drop `## Working notes`, TBDs, process narrative. Keep only decisions, contracts, invariants.
6. Delete or archive `docs/plans/<topic>.md` — plans don't belong on `main`.
7. If user-visible, add to CHANGELOG `Unreleased`. Releases move it to a version.
8. Ask: **merge / PR / keep / discard.**
9. On merge or PR: clean up worktree, delete local branch.

No push or PR without explicit user approval.

