---
name: ship
when: all plan tasks done and green
---
# Ship

**Gates — if any fail, stop here:**
- Tests pass.
- No `- [ ]` in `docs/plans/<topic>.md`.
- No incomplete TodoWrite tasks.

1. `review` the whole diff.
2. `docs/specification.md` is the curated living spec — organized behaviors, contracts, and invariants. Update it for any behavior/contract change. Move detail (models, interfaces) into `docs/specification/*.md`. Archived specs (`docs/specs/<topic>.md`) are reference only: link them, never copy content.
3. Archive `docs/specs/<topic>.md`: drop `## Working notes`, TBDs, process narrative. Keep only decisions, contracts, invariants.
4. Delete or archive `docs/plans/<topic>.md` — plans don't belong on `main`.
5. If user-visible, add to CHANGELOG `Unreleased`. Releases move it to a version.
6. Ask: **merge / PR / keep / discard.**
7. On merge or PR: clean up worktree, delete local branch.

No push or PR without explicit user approval.

