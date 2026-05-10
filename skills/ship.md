---
name: ship
when: all plan tasks done and green
---
# Ship

**Gates — if any fail, stop here:**
- Tests pass.
- No `- [ ]` in `docs/plans/YYYY-MM-DD-<topic>.md`.
- No incomplete TodoWrite tasks.

1. `review` the whole diff.
2. `archive` — merge spec into living specification, delete spec and plan.
3. If user-visible, add to CHANGELOG `Unreleased`. Releases move it to a version.
4. Ask: **merge / PR / keep / discard.**
5. On merge or PR: clean up worktree, delete local branch.

No push or PR without explicit user approval.

