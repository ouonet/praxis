# Getting Started

## Installation

Praxis provides a unified installer CLI `@ouonet/praxis`, while remaining fully compatible with native plugin ecosystems of all supported AI harnesses.

### Method 1: Praxis CLI (Recommended)

Without pre-installing anything globally, use `npx` to check status, install, or update Praxis across any host environment:

```bash
# Check installed AI hosts and Praxis status
npx @ouonet/praxis status

# Install Praxis to all detected hosts at once
npx @ouonet/praxis install --host all

# Install for a specific host
npx @ouonet/praxis install --host claude --scope user
npx @ouonet/praxis install --host opencode --scope project
npx @ouonet/praxis install --host codex --scope local
npx @ouonet/praxis install --host antigravity
npx @ouonet/praxis install --host pi
npx @ouonet/praxis install --host omp
npx @ouonet/praxis install --host qoder
```

#### Supported Hosts
- `claude`: Claude Code CLI
- `codex`: Codex CLI / App
- `opencode`: OpenCode
- `antigravity` (alias `agy`): Antigravity CLI / AGY
- `pi`: pi CLI
- `omp` (alias `oh-my-pi`): Oh My Pi
- `qoder` (alias `qoderclicn`): Qoder CLI CN
- `copilot`: GitHub Copilot CLI
- `agents` (alias `generic`): Generic Agent workspace following the `.agents` specification
- `all`: Install to all supported AI hosts

#### Installation Scopes
- `project` (default in project directories): Project-level scope tracked in git (e.g. `opencode.json`, `.agents/skills/`, `.claude/settings.json`), shared with the team.
- `local`: Workspace-local scope, active in the current directory without modifying shared repo manifests.
- `user` / `global` (default in home directory): Global user home scope (e.g. `~/.claude`, `~/.codex`, `~/.gemini/config`, `~/.omp`, `~/.qoder-cn`), available across all workspaces.

#### Management Commands
```bash
# Update Praxis across hosts
npx @ouonet/praxis update --host all

# Uninstall Praxis
npx @ouonet/praxis uninstall --host opencode --scope project
```

---

### Method 2: Native Host Installation

You can also install Praxis directly via each host's native commands or configuration files:

#### Claude Code
```bash
claude plugins marketplace add ouonet/praxis
claude plugins install praxis
```

#### Codex
Configure in `.codex/config.toml`:
```toml
[plugins."praxis@git+https://github.com/ouonet/praxis.git"]
enabled = true
```

#### OpenCode
Configure in `opencode.json`:
```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

#### Antigravity CLI (AGY)
```bash
agy plugin install https://github.com/ouonet/praxis
```

#### pi CLI
```bash
# Global install
pi install git:github.com/ouonet/praxis

# Project scope (writes to .pi/settings.json)
pi install -l git:github.com/ouonet/praxis
```

#### Oh My Pi (omp)
```bash
omp plugin add https://github.com/ouonet/praxis
```

#### Qoder CLI CN
Add `plugin.json` under `.qoder-plugin` in the project root, or configure globally under `~/.qoder-cn/plugins/`.

---

## Install from a branch

To try an unreleased or experimental branch:

```bash
# Via CLI
npx @ouonet/praxis install --host claude --ref <branch>
npx @ouonet/praxis install --host opencode --ref <branch>
```

Or natively:
- **Claude Code**: `claude plugins marketplace add ouonet/praxis#<branch>` then `claude plugins install praxis`
- **pi CLI**: `pi install git:github.com/ouonet/praxis@<branch>`
- **OpenCode**: `"plugin": ["praxis@git+https://github.com/ouonet/praxis.git#<branch>"]`

---

## Verify

Start a fresh session and send:

```
fix the typo "teh" in README
```

Expected output: `praxis: scope=trivial, loading=` — and the agent just fixes it. No design doc, no plan, no ceremony.

Then send:

```
add OAuth login with GitHub
```

Expected: `praxis: scope=standard, loading=design,plan,tdd,review` — the agent starts asking clarifying questions before touching code.

---

## Model Tiers Configuration (Optional)

When dispatching parallel subagents (`subagents`) or spec reviewers (`design` gate), Praxis assigns task capability tiers (`fast`, `balanced`, `strongest`).

Create `.praxis/model-tiers.yaml` in your project root or home directory to map tiers to concrete models:

```yaml
fast: claude-3-5-haiku
balanced: claude-3-7-sonnet
strongest: claude-3-7-sonnet
```

If no configuration file exists, all subagents default to the harness default model.
