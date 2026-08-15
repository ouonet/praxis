# Changelog

## Unreleased

## 4.2.0 - 2026-08-15

- **Living Doc North Star & Axioms**:
  - Established the Living Doc North Star: *Zero history, maximum truth density, instant scannability*.
  - Enforced **The Living Doc Razor**: past rationale belongs in `docs/decisions/` or `CHANGELOG.md`; `docs/tech-spec.md` holds exclusively active, current ground truth.
  - Enforced **Atemporal Invariant**: zero temporal/versioned headers (`## M8...`, dates), migration narratives, or supersession diffs.
- **Strict Anti-Bloat & Modular Splitting**:
  - `docs/tech-spec.md` acts as the system backbone (≤300 lines); bulky subsystem details (>15 lines of schemas, state machines, or protocols) must split into modular `docs/specs/<topic>.md`.
  - Adopted STE100 principles: atomic declarations (≤25 words per sentence) and structured bullet points/tables for multi-parameter contracts; zero unbroken text walls.
- **Quality Standard Severity Upgrade**:
  - Upgraded Living Doc integrity violations (historical clutter, text walls, unsplit schemas) to **`BLOCK`** severity in `skills/references/quality.md`.
  - Added self-reflection verification `<gate>` in `skills/archive/SKILL.md`, `skills/review/SKILL.md`, and `skills/ship/SKILL.md`.
- **Self-Host Living Doc Realignment**:
  - Refactored Praxis's own `docs/tech-spec.md` to declare the full `bin/praxis.js` CLI contract, removed legacy milestone status text, and streamlined constraint declarations.


- **Scope Architecture Refinement**: Standardized scope definitions across all AI hosts: `project` (tracked in version control and shared with team), `local` (workspace-local directory without modifying shared repo manifests), and `user` / `global` (user home directory).
- **Expanded Host Support**:
  - **Oh My Pi (`omp`)**: Added native integration and detection via `omp` CLI and `~/.omp/plugins`.
  - **Qoder CLI CN (`qoderclicn`)**: Added support for Qoder China CLI binary `qoderclicn` and `.qoder-plugin`.
  - **Generic Agent (`.agents`)**: Added full support for the `.agents` open workspace specification.
- **Accurate Host & Skill Detection**: Fixed false-positive detection where parent folders existed without Praxis skills; deep inspection now strictly checks for Praxis markers (`using-praxis` / `praxis` plugins).
- **Terminal Display Visual Alignment**: Implemented visual width calculations for CJK and Emoji characters to ensure table columns and headers align across all terminal emulators.
- **Deprecated Host Cleanup**: Completely removed deprecated Gemini CLI from the host catalog and documentation.
- **Multilingual Documentation**: Updated full documentation site (`site/`) and `README.md` in English, Chinese, Japanese, and Korean.

## 4.1.0 - 2026-08-14

- **Praxis CLI tool**: Added `praxis` / `@ouonet/praxis` CLI (`praxis install`, `update`, `uninstall`, `status`) to simplify installation and management across AI agent platforms (Codex, Claude Code, OpenCode, Copilot CLI, Antigravity, Gemini CLI, Pi CLI, Qoder, and `.agents`).
- **GitHub Actions CI/CD**: Added automated publish workflow (`.github/workflows/publish.yml`) for publishing `@ouonet/praxis` to npmjs.

- **Tool scope + structural search practice**: `multi-module.md` Tool scope states tools run from the coordinator's cwd — cross-repo access requires an explicit path parameter; tools without one stay coordinator-only. `using-praxis` gains Rule 5 — prefer structural search for code shapes (no index needed, works in any repo), a general best practice rather than a multi-module concern.

## 4.0.4 - 2026-08-05

- **Multi-module doesn't change scope**: `multi-module.md` now states the skill chain follows scope alone — triage classifies cross-repo work exactly as single-repo work, with two fixed execution mechanics added (declaration block + commit protocol), not process weight. `debug` gains a multi-module branch (read-only investigation, registered-module fixes, commits deferred until integration passes). Adding a repo mid-change is now a declaration-block update plus user confirmation instead of a return to `design`. Triage guidance says start single-module when cross-repo scope is uncertain.

## 4.0.3 - 2026-08-04

- **SessionStart inject policy (docs-aligned):** full bootstrap on startup/resume/clear/fork; brief reminder on `compact`; Gemini skips hook body when `contextFileName` owns bootstrap; Codex matcher narrowed from `.*` to documented sources.
- **Dogfood:** add living `docs/tech-spec.md` and `docs/ROADMAP.md` for the Praxis repository itself.
- **Remove retired `discover` skill** from the publish surface (vague goals remain `design` only).
- **Harness-neutral wording:** skills and session-start no longer require Claude-only `Skill` / `TodoWrite` names.
- **TDD vs manual acceptance:** RED-GREEN only for automated acceptance; manual acceptance is first-class.
- **Session-start hardening:** control-char JSON escape; frontmatter strip; missing skill → empty valid JSON; drop dead `{{PRAXIS_ROOT}}` sed.
- **Version alignment:** marketplace plugin version matches `package.json`.
- **Multi-module docs:** README matches experimental coordination protocol wording.
- **Tests:** `npm test` / `npm run check` via Node built-in test runner.
- **ship/archive:** tracked-task gate and archive approval wording clarified.

## 4.0.2 - 2026-08-03

- **Documentation & Site Overhaul**: Complete update of `README.md` and VitePress site across 4 languages (English, Chinese, Japanese, Korean) to reflect v4.0+ capabilities, including Spec Review Gates, 3D Quality Standards, Model Tiers, and Multi-Module Topology.
- **Core Vision & Pillars**: Documented Praxis's core mission — building multi-module, multi-repository projects via structured workflows with high quality, high efficiency, and token savings.
- **Accurate Token Recount**: Updated token budget tables with precise BPE token metrics (~150 to ~1,180 tokens per skill; ~3,600 tokens for standard feature flow).
- **Standalone Framework Positioning**: Removed legacy Superpowers comparisons to present Praxis as a standalone, enterprise-grade engineering discipline framework.


- **Coordinator synthesis**: spec review gate coordinator now thinks critically about reviewer findings — evaluates, resolves conflicts, spots gaps, and judges severity — rather than passively merging output. Reviewers advise; coordinator decides. Judgment principles prevent deadlock: hierarchy with escalation to user, overrides recorded in working notes, synthesis runs once.
- **Tool scope documented**: `multi-module.md` now records that AI coding tools launch from a single working directory — semantic indexing only covers the coordinator repo, sibling modules need explicit project parameters or fall back to file-level search.

## 4.0.0 - 2026-07-29

- **Spec review gate**: `design` now dispatches focused reviewers before handing off to `plan`. Reviewers are selected by a trigger table — only the ones matching the spec's characteristics run. A simple spec gets one baseline reviewer (same cost as today); a complex spec gets additional reviewers for state-machine completeness, cross-rule consistency, cross-module boundaries, crash-recovery safety, and implementability. All run in parallel. Trigger table and reviewer charters in new `skills/references/reviewers.md`.
- **Model tier dispatch**: `subagents` dispatch format now includes `MODEL: fast | balanced | strongest` and `ROLE: implementer | spec-reviewer | quality-reviewer`. Model tiers are resolved via `.praxis/model-tiers.yaml` (template at `model-tiers.example.yaml`) — no config file means all subagents use the harness default. Each role has an explicit charter defining what it owns, what it does not own, and when to override the default tier. The coordinator decides the tier at dispatch time based on task complexity, not a hardcoded role mapping.

## 3.2.1 - 2026-07-28

- **Dependency-aware clarification**: `design` now investigates discoverable facts, asks only the current decision frontier in prerequisite order, and stops without mapping or exhausting the full dependency tree.

## 3.2.0 - 2026-07-27

- **Quality and doc-coverage gates**: new `skills/references/quality.md` defining the quality bar — mechanical checks (lint/format/typecheck), convention adherence, design assessment (coupling/cohesion/abstraction), and doc-coverage (full public surface, env/errors documented, README commands runnable). `tdd` refactor gate upgraded from generic "SOLID" to three-dimensional check; `review` adds Standards + Doc-coverage items; `ship`/`archive`/`onboard`/`design` updated to reference the quality standard.
- **Arrow unification**: all `->` normalized to `→` across skill files and README.
- **Skill wording trimmed**: `design`, `tdd`, `review`, `ship`, `archive`, `onboard`, and `quality.md` wording tightened without losing meaning.

## 3.1.0 - 2026-07-21

- **pi CLI support**: Praxis now distributes as a native pi package — pi auto-discovers skills from the `package.json` manifest. Install with `pi install git:github.com/ouonet/praxis` and pin branches with `@<branch>` syntax. Full install/update/uninstall docs added to README and all four language sites.
- **README**: Quick Start section now includes pi CLI alongside Claude Code; pi listed first in the cross-harness feature list (all language site homepages updated).
- **All plugin manifests**: version bumped for consistency.

## 3.0.0 - 2026-07-20

- **Multi-module workspace (experimental)**: coordinate a single change across multiple modules/repositories via a user-designated coordinator repo that owns the cross-module spec/plan and change manifest. Mode is declared, not remembered - `topology=multi-module` in the triage announcement and a declaration block (`topology` / `change-set` / `coordinator` / `repos`) at the top of the coordinator spec and workspace plan; every workflow skill re-anchors to it instead of relying on session memory.
- **README**: multi-module usage section (coordinator, mode marker, lifecycle, safety) and per-agent branch-install instructions for `feat/multi-module-workspaces`.

## 2.3.9 - 2026-06-24

- **Antigravity CLI install**: remove the root `plugin.json` manifest so `agy plugin install` uses the Gemini-compatible importer, which preserves the session-start hook.

## 2.3.8 - 2026-06-18

- **Qoder CLI CN support**: add `.qoder-plugin/plugin.json` manifest; Qoder CLI CN auto-discovers skills from the project's `skills/` directory — no hooks needed. Install docs added to README.

## 2.3.7 - 2026-06-11

- **flow diagrams convention**: complex flows (branching / async / multi-actor) keep a one-line `flow:` summary in the tech-spec; the diagram lives in `docs/specs/<flow>.md`. Codified in `archive` tech-spec format and README.

## 2.3.6 - 2026-06-11

- **onboard**: tech-spec template aligned with the canonical 11-field format defined in `archive` (was a 6-field subset); `milestone` explicitly omitted since onboard makes no plans.
- **README**: `docs/specs/*.md` listed as a first-class living-doc artifact; living-doc definition reworded ("current system state and direction. Always in sync with code") to remove the conflict with "facts only — no plans".

## 2.3.5 - 2026-06-09

- **SessionStart hook**: fix JSON output format detection order to resolve "invalid session start JSON output" errors. Prioritize Claude Code environment check first.

## 2.3.4 - 2026-06-08

- **CODEX CLI support**: fix hook command property from `windows` to `commandWindows`.

## 2.3.3 - 2026-06-08

- **CODEX CLI support**: use `${CLAUDE_PLUGIN_ROOT}` environment variable for hook path instead of relative path. Adds Windows-specific command syntax.

## 2.3.2 - 2026-06-03

- **Antigravity CLI support**: add `plugin.json` manifest at repo root (`agy plugin install https://github.com/ouonet/praxis`). Antigravity CLI is the evolution of Gemini CLI, renaming extensions to plugins; `contextFileName` field preserved so triage activates from the first turn.
- **Gemini CLI docs**: add install section to site getting-started pages (all four language sites) and update Cross-harness feature copy to list Antigravity CLI and Gemini CLI.
- **gemini-extension.json**: bump version to match current release.

## 2.3.1 - 2026-06-03

- **ship**: added `commit` as a disposition option in step 5, alongside merge / PR / keep / discard.

## 2.3.0 - 2026-06-01

- **Merge `discover` into `design`**: `discover` skill retired. `design` now handles vague goals — clarifying questions before proposing solutions, working notes for hypotheses/experiments, explicit Abandon path. `using-praxis` routes `vague` scope to `design`. `docs/discovery/` convention removed.
- **Living documentation restructured**: Two-tier model — living docs (`README.md`, `docs/tech-spec.md`, `docs/specs/*.md`, `docs/ROADMAP.md`) vs project artifacts (`CHANGELOG.md`, `docs/decisions/`). `ROADMAP.md` formally part of living doc definition.
- **tech-spec format extended**: New fields `purpose`, `user`, `use-case`, `architecture`, `flow` give agents full system context from a single structured file. `onboard` gate now requires `purpose` + `architecture` + `stack` + one `contract`.
- **`docs/decisions/` introduced**: Append-only architectural decision log (`context / choice / ruled-out`). `archive` saves knowledge artifacts here.
- **Project context prompt**: `using-praxis` Rule 0 — agent reads `docs/tech-spec.md` if unfamiliar with the project.
- **Hooks updated**: `session-start` detects Gemini via stdin JSON. Copilot plugin manifest fixed. `gemini-extension.json` corrects `contextFileName` to using-praxis skill path.
- **Site + README synced**: All four language sites (en/zh/ja/ko) updated. README skills table linked to skill files.

## 2.2.0 - 2026-05-30

- Remove stale `bootstrap.md`; manual/fallback harnesses now read `skills/using-praxis/SKILL.md` directly.
- Wire Gemini CLI extension: `gemini-extension.json` points `contextFileName` at the using-praxis skill so Praxis actually activates; document the install path in README.
- README: fix mislabeled "Codex" branch-install block (it is OpenCode), rename the "Scripts" walkthrough section to "Examples".
- **discover**: rename the knowledge-artifact exit (was mislabeled `→ archive`, which only handles staging specs) and save the spec directly.
- **onboard**: fix split-spec path `docs/tech-specs/` → `docs/specs/` to match the canonical layout.
- **plan**: fix grammar in the new-project task ("derivative an" → "derive an").
- **release**: wrap commit/tag/push/publish (steps 5-7) in an explicit `<gate>` requiring per-step approval.
- **plan / ship**: acceptance now has an escape hatch for non-testable deliverables (content, prompts, config, infra) — an explicit manual check instead of a required automated test.
- **worktree**: branch name now uses the `<type>/<topic>` convention (e.g. `feat/...`) to match the rest of the docs, while the worktree directory stays `<topic>`.

## 2.1.0 - 2026-05-26

- **Roadmap lifecycle fix**: Roadmap is now managed as long-term living documentation (`docs/ROADMAP.md`), decoupled from staging spec/archive cycles.
  - **Design**: checks if `docs/ROADMAP.md` already exists before deciding whether to create or append; staging spec only references current milestone.
  - **Plan**: reads milestone from `docs/ROADMAP.md` instead of staging spec markers.
  - **Ship**: updates `docs/ROADMAP.md` progress (`[x]`) as part of the ship step.
  - **Archive**: does not overwrite roadmap; merges only non-roadmap spec content into living documentation.

## 2.0.0 - 2026-05-26

* Add Japanese (ja) and Korean (ko) site translations
* add gemini-extensions.json

## 1.2.5 - 2026-05-21

- **TDD**: Narrow ad-hoc document prohibition — blocks unsolicited summary/notes files while allowing documents required by the workflow (staging spec, plan, CHANGELOG, tech-spec).

## 1.2.4 - 2026-05-21

- **Eliminate triage round-trip**: Inline triage routing table into `using-praxis` — agent classifies scope without a Skill tool call, saving one API round-trip per message.
- **Parallel skill loading**: `using-praxis` now instructs agent to load all required skills in a single parallel response, reducing standard task skill-loading from N round-trips to 1.
- **Remove `triage` as a standalone skill**: routing logic now lives solely in `using-praxis`; no duplicate source of truth.
- **TDD refactor gate**: Add mandatory gate requiring agent to evaluate implementation against SOLID principles, design patterns, and clean code before committing — and state what was assessed.

## 1.2.3 - 2026-05-19

- Refine `triage` scope boundaries so complex workflows trigger only for feature changes or source-code changes.
- Exclude docs, tests, examples, CI, and tooling from the `source code` definition used for triage.
- Simplify the tie-break guidance in `triage` to a single-line rule with compact term definitions.

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
