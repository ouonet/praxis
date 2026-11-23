# ship

The `ship` skill finalizes completed plan work through final review, roadmap and living-doc archiving, changelog updates, and explicit disposition confirmation.

## Pre-Ship Gates

Stop immediately if any gate fails:

- Automated tests pass (or declared manual acceptance steps succeeded).
- Zero `- [ ]` tasks remain in any relevant plan.
- Staging spec matches actual implemented behavior.
- `README.md` commands work and living docs satisfy the Living Doc North Star ([Quality Standard](./quality)).
- Zero incomplete tracked tasks remain in the harness task tracker.
- For multi-module work, module acceptance and coordinator integration pass (or `partial-commit` recovery state is reported).

## Ship Sequence

1. Run `review` across the full diff.
2. Update `docs/ROADMAP.md` (`[x]` on completed milestone, adjust stubs if scope shifted).
3. Run `archive` (modules first, coordinator last in multi-module topology).
4. Add user-visible changes to `CHANGELOG.md` under `Unreleased`.
5. Ask the user for disposition (`commit / merge / PR / keep / discard`) — never push or open a PR without explicit approval.
6. Clean up worktree/branch on merge or PR, or continue to `plan` for the next roadmap milestone.
