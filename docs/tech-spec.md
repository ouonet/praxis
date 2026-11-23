purpose:      Give AI coding agents a token-lean, triage-driven discipline workflow for design → plan → implement → review → ship across single- and multi-module work.

user:         Developers and teams running AI coding agents (Claude Code, pi, Codex, Copilot, OpenCode, Gemini/Antigravity, Qoder, Grok) who want structured delivery without hand-holding every step.

use-case:     Install as a harness plugin/package; session-start injects triage; agent loads only the skills required by scope; produce staging specs/plans, implement with TDD/review gates, archive into living docs, optionally release.

architecture: Skill-pack + thin harness adapters. Core behavior lives in Markdown skills under `skills/`; executable entrypoints are session-start hooks, modular Node.js CLI (`bin/praxis.js`, `src/cli/{hosts,shared,doctor,installer,index}.js`, `src/cli/adapters/*.js`), and small JS plugins that inject `using-praxis` and register skill paths. No central runtime server.

stack:        Markdown skills; Bash session-start hooks; Node.js `>=20.11.0` CLI & ESM plugins (`bin/praxis.js`, `src/cli/`, `extensions/praxis.js`, `.opencode/plugins/praxis.js`); GitHub Actions CI across `ubuntu-latest`, `macos-latest`, `windows-latest`; JSON plugin manifests per harness; optional VitePress docs site under `site/`; MIT license; explicit `package.json` `files` allowlist excluding dev paths and nested `node_modules`.

entry:        Session bootstrap and installation entrypoints:
  - CLI: `bin/praxis.js` (`npx @ouonet/praxis <command>`) for multi-host installation, inspection, and updates
  - Claude Code: marketplace/plugin; auto-loads `hooks/hooks.json` → `hooks/run-hook.cmd session-start`
  - Codex: `.codex-plugin/plugin.json` → `hooks/codex-hooks.json` → session-start
  - Copilot: `.copilot-plugin/plugin.json` SessionStart command → session-start
  - Gemini/Antigravity: `rules/AGENTS.md` (and `plugins/praxis/rules/AGENTS.md`) auto-injects triage rules into active session rules
  - pi: `package.json` `pi.extensions` + `pi.skills`; `extensions/praxis.js` on `before_agent_start`
  - OpenCode: `package.json` `main` = `.opencode/plugins/praxis.js` (config skill paths + message transform bootstrap)
  - Qoder: `.qoder-plugin/plugin.json` skills path / project `skills/` discovery
  - Grok: file install copies plugin to `.grok/plugins/praxis` (or `~/.grok/plugins/praxis`), skills to `.grok/skills` / `~/.grok/skills`, and `rules/praxis.md` to `.grok/rules` / `~/.grok/rules` (session auto-load; Grok ignores SessionStart stdout)
  - Manual: read `skills/using-praxis/SKILL.md` first

contract:     Public install surfaces and stability set:
  - Package & CI contract: `package.json` declares `engines.node >=20.11.0`, explicit `scripts.test` file list (no `**` glob), and `files` allowlist covering runtime assets (`bin/`, `src/`, `skills/`, `rules/`, `hooks/`, `extensions/`, `assets/`, `.opencode/plugins/`, `.opencode/INSTALL.md`, plugin manifests, `model-tiers.example.yaml`) with `!**/node_modules` exclusions; `.github/workflows/{ci,publish}.yml` gate on `npm run check && npm test`
  - Modular CLI architecture: acyclic module graph `hosts.js` → `shared.js` → `adapters/<host>.js` → `adapters/index.js` (`HOST_ADAPTERS`, `getHostAdapter`) → `doctor.js` → `installer.js` → `index.js`; `HOST_ADAPTERS` frozen plain object matching `HOSTS`; adapters implement `{ id, alwaysRunFileUninstall?, installFiles, uninstallFiles, getStatus }`; uncaught adapter FS errors return `false`
  - CLI commands & probes: `install` (`i`), `status` (`list`, `ls`), `doctor` (`validate`, `check`), `update` (`upgrade`), `uninstall` (`rm`), `version` (`v`), `help` with flags `--host` (`-H`), `--scope` (`-s`), `--ref` (`-r`), `--method` (`-m`), `--force` (`-f`), `--dry-run`, `--help` (`-h`), `--version` (`-v`); `resolveBinaryAvailable` short-circuits `cliBinary === null`, skips probes on `copy`/`link`, and honors `binaryAvailable`/`checkBinary`; `runCli` accepts `{ rootDir, homeDir, checkBinary }`; `diagnoseHost`/`diagnoseHosts`/`validateTomlBasic`/`isDanglingSymlink` provide read-only health diagnostics (`EACCES`/`EPERM`/`EISDIR` → `unreadable-path`, dangling symlinks, invalid configs, incomplete skills, rule conflicts/duplicates, OpenCode dual-source) exiting `1` on failures and `0` on clean/warnings-only runs
  - CLI builders: structured `CommandStep[]` (`{ bin, args, allowFailure }`), formatted with `formatCommandStep`; upfront multi-host `--ref` preflight validation; `--method native` failure never falls back to file operations
  - File atomicity & safety: `writeFileAtomic` (tmp write + rename), `copyOrLink` (temp staging on new writes, atomic backup-swap on overwrite, `node_modules` copy filter), `pathExistsLstat` (used across all removal helpers and adapter uninstalls to clean dangling symlinks), `--dry-run` guards on directory cleanup
  - Plugin file copy: `copyPluginFiles` iterates `PLUGIN_ITEMS_TO_COPY` (`assets`, `skills`, ..., `.opencode/plugins`, `.opencode/INSTALL.md`, excluding untracked dev files) and supports prefix matching in `exclude`
  - Host lifecycle semantics: `codex` respects `--dry-run`, isolates `user` vs `project`/`local`, runs `stripPraxisCodexToml`, and enables `alwaysRunFileUninstall` under `auto`; `opencode` `project` manages `opencode.json`, `local` manages `.opencode/` without touching `opencode.json` (on install or uninstall), and `readValidatedOpencodeJson` aborts on invalid JSON; `pi`/`omp` `project`/`local` install skills directly via `copyPraxisSkillsToDir`; generic `user` uninstalls respect `homeDir` in `resolveTargetPath`
  - Rule ownership & deduplication: `rules/AGENTS.md` and `rules/praxis.md` start with `<!-- praxis:managed-rule -->`; `isPraxisManagedRuleFile` checks marker + legacy fingerprint; `copyManagedRuleFile` preserves user-owned rule files even under `--force`; Antigravity installs only `rules/AGENTS.md`, Grok installs only `rules/praxis.md`; Agents skips `rules/praxis.md` when Praxis-managed `rules/AGENTS.md` exists; sibling-safe `.agents/` uninstallation
  - Dynamic SSOT skill list: `PRAXIS_SKILL_NAMES` derived and frozen via `derivePraxisSkillNames()` anchored to package root `skills/` (`DEFAULT_PRAXIS_SKILL_NAMES` fallback if unreadable); all non-`references` skills declare `name` and `description` frontmatter
  - Accurate host status: pure text parsers `hasPraxisCodexToml`, `hasPraxisOpencodeConfigText`, `hasPraxisPiSettingsText`; `getHostStatus` parameterized by `{ homeDir, binaryAvailable, checkBinary }`; zero directory-existence false positives
  - JS Adapters: `.opencode/plugins/praxis.js` dual-layout (`../skills` then `../../skills`), CRLF frontmatter stripping, no null-cache poisoning, session injection deduplication via `<!-- praxis:using-praxis:v1 -->`
  - Session hook: `hooks/session-start` `json_escape` falls back to `node` and pure-Bash on missing/failing python; Windows drive path resolution (`/<drive>/...`, `/mnt/<drive>/...`, and script-relative fallback)
  - Supported hosts: `claude`, `codex`, `opencode`, `copilot`, `antigravity` (`agy`), `pi`, `omp`, `qoder`, `grok`, `agents`, `all`
  - Supported scopes: `user` (global home, default), `project` (Git-tracked), `local` (workspace)
  - Skill names and paths: `skills/<name>/SKILL.md` for onboard, design, plan, tdd, debug, review, worktree, subagents, ship, archive, release, using-praxis
  - Shared protocols: `skills/references/{quality,reviewers,multi-module}.md`
  - Triage announcement line: `praxis: scope=<x>, loading=<skills>` and optional `topology=multi-module`
  - Scope set: vague | trivial | small | standard | complex | debug | onboard | ship | release
  - Staging layout: `docs/staging/specs/YYYY-MM-DD-<topic>.md`, `docs/staging/plans/YYYY-MM-DD-<topic>.md`
  - Living docs: `README.md`, `docs/tech-spec.md`, `docs/specs/*.md`, optional `docs/ROADMAP.md`, `docs/decisions/`
  - Model tier ids: `fast` | `balanced` | `strongest` via `.praxis/model-tiers.yaml` (`tiers.<tier>.{provider, model}`; resolution: project root → user home → harness default; template `model-tiers.example.yaml`)
  - Multi-module declaration block fields: `topology`, `change-set`, `coordinator`, `repos`
  - Harness manifests: `package.json` (npm + pi; `license` MIT, `homepage`, `repository`, `bugs`, `engines`, `files`), `gemini-extension.json`, `.claude-plugin/*`, `.grok-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `.copilot-plugin/plugin.json`, `.qoder-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `.opencode/plugins/praxis.js`, `extensions/praxis.js`
  - Session-start hook must emit valid JSON context for the detected harness

flow:
  - session-bootstrap: install/load plugin → inject using-praxis → every user turn triages scope → load skill chain → respect gates → optional ship/archive/release
  - standard-change: design (spec + optional parallel spec reviewers) → user confirm → plan → user confirm → tdd/subagents → review → ship → archive
  - multi-module-change: declare topology → coordinator + per-module specs/plans (scope decides the skill chain; cross-repo adds declaration + commit protocol) → per-module implement → integration acceptance → dependency-ordered commits + revision set → archive
  - onboard-flow: explore repo → write living docs only → user confirm → later design/plan/tdd

invariant:
  - CLI argument parsing or runtime command failures exit with non-zero status code 1.
  - `--dry-run` performs zero filesystem mutations across all hosts and scopes.
  - Installing, updating (`--force`), or uninstalling Praxis NEVER overwrites or deletes a user-authored or dangling-symlink `AGENTS.md` or `praxis.md`.
  - Every `rules/` directory receives at most ONE Praxis-managed rule file even when `install --host all` co-installs multiple hosts.
  - Triage chooses the smaller matching scope; trivial loads no workflow skills.
  - `<gate>` markers are mandatory stop points in skill text (enforcement is prompt-level today).
  - Multi-module mode is re-established from on-disk declaration or triage line, not session memory alone.
  - Scope decides the skill chain; topology only adds cross-repo execution mechanics (declaration + commit protocol).
  - Living documentation is atemporal, truth-dense declarations (zero history/dates/supersessions); past rationale belongs in `docs/decisions/` or `CHANGELOG.md`; bulky details live in `docs/specs/*.md`.
  - Cross-repo commits are non-atomic; revision set is the reproducibility boundary.
  - Semantic indexing may cover only the launch/coordinator repo; file tools still work across paths (documented harness limit).

constraint:
  - Quality/lint/format tools are not declared for skill Markdown; adapter checks use `npm test` / `npm run check` (Node built-in test runner).
  - `hooks/gemini-hooks.json` is not wired (Antigravity uses `rules/AGENTS.md` bootstrap).
  - Windows hook wrapper exits 0 if bash is missing (bootstrap injection skipped silently).
  - Model tiers without config silently use harness default.
  - Multi-module is an experimental coordination protocol (non-atomic cross-repo commits).
  - Site (`site/`) is documentation publishing only; not required for agent runtime.
  - Prompt-level `<gate>` markers are not enforced by a separate runtime state machine.
  - SessionStart inject policy:
    - Startup/resume/clear/fork/new: inject full `using-praxis` bootstrap.
    - Compact: inject brief reminder only.
    - Gemini/Antigravity: skip hook injection when `rules/AGENTS.md` already loads `using-praxis`.
    - Grok: do not rely on SessionStart stdout; copy `rules/praxis.md` into Grok rules dirs (auto-loaded into session context).

convention:
  - Skills: one directory per skill; `SKILL.md` with YAML frontmatter `name` + `description`. Public set excludes retired `discover` (folded into `design`).
  - References live under `skills/references/`, linked from workflow skills — not duplicated.
  - Version source of truth: root `package.json` (`version`, `description`, `license`, `author`); all 9 versioned manifests must match plus `.agents/plugins/marketplace.json` index integrity.
  - Hook scripts are extensionless (`session-start`) plus polyglot `run-hook.cmd`; JSON string escape must cover control characters (python3 `json.dumps` slice when available).
  - JS plugins: ESM, strip skill frontmatter, inject bootstrap once per session when harness allows.
  - Skill text is harness-neutral: skill loader or `skills/<name>/SKILL.md`; task tracker / subagent APIs named by role not single-vendor tool id.
  - Docs: tech-spec declaration fields per archive skill; staging specs/plans date-prefixed; CHANGELOG keeps `Unreleased`.
  - Quality baseline for this repo: `npm test` + `npm run check`; no ESLint/Prettier required for Markdown skills.
  - Error-handling (adapters): missing skill file → empty context JSON; Windows without bash → silent no-op inject.
  - Security baseline: no secrets in repo; hooks read local skill files only; do not auto clone/reset/discard user git state (multi-module safety rules).
  - Naming: skill ids lowercase kebab; triage scopes lowercase; change-set ids appear in branch/commit subjects as `[praxis:<id>]` when multi-module.
  - TDD: RED-GREEN when acceptance is automated; manual acceptance is first-class when the plan says so.

milestone:    see docs/ROADMAP.md
