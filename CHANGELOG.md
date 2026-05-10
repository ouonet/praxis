# Changelog

## Unreleased

## 1.0.6 - 2026-05-09

- `plan`: T1 for new repos now scaffolds a complete, idiomatic baseline for the spec's stack instead of a fixed file list.

## 1.0.5 - 2026-05-09

- `design`: Add gate — spec file must exist on disk before handing off to `plan`.
- `plan`: Add gate — plan file must exist on disk before handing off to `tdd`/`subagents`.

## 1.0.4 - 2026-05-09

- `ship`: Replace loose steps with explicit gate block — tests, plan checkboxes, and TodoWrite tasks must all pass before proceeding.
- `ship`: Clarify `docs/specification.md` as curated living spec with organized content; archived specs are reference only.
- `tdd`: Make plan checkbox flip a mandatory explicit file edit step before starting the next task.

## 1.0.3 - 2026-05-10

- Fix hooks on Windows: add `windows` field to `hooks.json` for proper session-start hook execution.
- Improve README formatting: align markdown tables and add VS Code Copilot installation instructions.

## 1.0.2 - 2026-05-10

- Require plan tasks to use completion checkboxes and make TDD/subagent flows flip them before ship.
- Add repo baseline files to new-repo T1 plans.
- Tighten ship checks and release-ready wording.

## 1.0.1 - 2026-05-09

- Make `ship` create the living specification index when `docs/specification.md` is missing.

## 1.0.0 - 2026-05-09

- Add a release skill for versioning, changelog promotion, tags, and publish approval.
- Clarify ship as merge/PR cleanup, living specification updates, and CHANGELOG `Unreleased` maintenance.
- Tighten design, plan, review, and subagent rules for implementation-ready specs, executable acceptance, milestone checkboxes, and coordinator-owned completion.
- Replace README examples with concise end-to-end scripts and common signals.
