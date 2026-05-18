# Changelog

## Unreleased

## 1.2.2 - 2026-05-18

- **Karpathy behavioral guidelines integrated**: Add simplicity and surgical-change constraints directly into existing skills.
  - `tdd`: Add two Don't items — "Add abstractions not required by the current test" and "Edit files outside the failing test's scope".
  - `triage`: `small` scope now prompts to clarify intent before loading `tdd`, preventing silent assumption in tasks that skip `design`.
  - `review`: Scope check expanded — also flags over-engineered implementations (>2x necessary) as FIX.

## 1.2.1 - 2026-05-14

- **Core philosophy clarification**: Update README and Philosophy section to emphasize "Intent, not instruction" as the guiding principle.
  - Add SLOGAN: "What, not how." — the core directive.
  - Replace "Praxis is token-lean skills" with definition centered on intent-driven approach.
  - Emphasize that users declare *what* to achieve and *what done looks like*, not *how to do it*.
  - Clarify Philosophy: "Intent, not instruction" guides all skill design.

## 1.2.0 - 2026-05-13

- **Code-docs sync enforcement**: Add mandatory documentation synchronization across TDD, review, and ship workflows.
  - `tdd` skill: add "sync docs" step in RED-GREEN-refactor cycle (update staging spec if exists, or living docs directly for small tasks).
  - `ship` skill: add gate requiring staging spec reflects actual code behavior.
  - `review` skill: add documentation check (always required); make spec match conditional on spec existence.
- **Documentation structure formalization**: Add "Documentation Structure" section to README explaining living docs (`README.md`, `docs/tech-spec.md`, `docs/specs/*.md`), staging area (`docs/staging/specs/`, `docs/staging/plans/`), and sync checkpoints.

## 1.1.2 - 2026-05-12

- Fix Codex marketplace plugin source: change `local` path `./` to `url` source pointing to GitHub repo (Codex rejects empty path after stripping `./`).
- README: update Codex install section to reflect UI-only install and `codex plugin marketplace upgrade` for updates.

## 1.1.1 - 2026-05-12

- Add Codex marketplace support: `.agents/plugins/marketplace.json`, `.codex-plugin/plugin.json` rewritten with `skills`, `hooks`, and `interface` fields.
- Add `hooks/codex-hooks.json` for Codex SessionStart hook using relative paths.
- Fix `hooks/session-start`: restore three-way harness dispatch (Claude Code / Copilot CLI / Codex+generic).
- README: update Codex install section to reflect marketplace flow.

## 1.1.0 - 2026-05-12

- Add `onboard` skill: explores an existing codebase and produces `docs/tech-spec.md` as a factual record of stack, contracts, conventions, and invariants.
- `triage`: add `onboard` scope — routes "take over"/"add Praxis" signals to `onboard`.
- `README`: add `onboard` to skills table, scripts, and common signals; add "Compared to Superpowers" section with skill mapping; fix token budget with measured values; fix Layout section to match actual repo structure.

## 1.0.14 - 2026-05-12

- Rename staging directory from `docs/onway/` to `docs/staging/` across all skills (`archive`, `design`, `plan`, `ship`, `subagents`, `tdd`).
- `archive`: add gate requiring `docs/tech-spec.md` to exist on disk before merging; clarify README links to multiple living specifications.
- `plan`: move gate block above the user-confirm step.

## 1.0.13 - 2026-05-12

- Delete top-level `skills/*.md` files (no AI tool consumption).
- Modify `archive` skill living specification convention.

## 1.0.12 - 2026-05-11

* Remove requirement of decomposition in `archive` skill because of complexity.

## 1.0.11 - 2026-05-11

- Remove `.opencode/config.json` to avoid stale hook-path config conflicts during OpenCode plugin loading.
- Update `.opencode/plugins/praxis.js` to align OpenCode behavior more closely with Superpowers plugin flow.

## 1.0.10 - 2026-05-09

- Add `package.json` with correct `main` entry for OpenCode plugin resolution.

## 1.0.9 - 2026-05-09

- Add OpenCode plugin (`opencode/plugins/praxis.js`): auto-registers skills directory and injects using-praxis bootstrap via message transform.
- Update `.opencode/INSTALL.md` to use OpenCode plugin array install method.

## 1.0.8 - 2026-05-09

- `archive`: decompose specification into independently referenceable units instead of inferring a single domain.
- `archive`: add "idiomatic domain specification" signal for better spec quality.
- `plan`: T1 baseline now explicitly requires README.md, .gitignore, and all standard tooling configs at minimum.

## 1.0.7 - 2026-05-09

- Add `archive` skill: merges cleaned spec into idiomatic domain specification, deletes spec and plan, updates specification index.
- `ship`: replace archive steps with `archive` skill call.
- `design`: add gate — spec file must exist on disk before handing off to `plan`.
- `plan`: add gate — plan file must exist on disk before handing off to `tdd`/`subagents`.
- `tdd`: make plan checkbox flip a mandatory explicit file edit before starting the next task.
- Fix file naming consistency — use `YYYY-MM-DD-<topic>.md` throughout all skills.

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
