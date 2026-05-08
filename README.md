# Praxis

Token-lean discipline skills for coding agents. Inspired by [Superpowers](https://github.com/obra/superpowers), rewritten to be ~10× cheaper while keeping the core capabilities.

## What it does

At session start, a hook injects a tiny bootstrap (~120 tokens) telling your agent to:

1. Run `triage` first — classify the task as trivial / small / standard / complex / debug.
2. Load only the skills that scope needs. **Trivial tasks skip the waterfall entirely.**
3. Follow the loaded skill literally; don't freelance past `<gate>` markers.

## Skills

| Skill | When |
|---|---|
| triage | every message — routes to the right skills |
| design | scope ≥ standard, anything new |
| plan | after design |
| tdd | implementing or fixing |
| debug | something broken |
| review | before merge / after subagent task |
| worktree | non-trivial or parallel work |
| subagents | independent tasks, fan-out |
| ship | merge / PR / cleanup |

Each skill is 300–700 tokens. Compare to Superpowers' 2,500–3,500 per skill.

## Token budget

| | Superpowers | Praxis |
|---|---|---|
| Bootstrap (every session) | ~2,200 | ~120 |
| Per skill load | ~3,000 | ~500 |
| Trivial task | ~11,000 | ~120 (just triage) |
| Standard task | ~30–50k | ~5–10k |

## Install

### Claude Code
```
/plugin marketplace add <this repo>
/plugin install praxis
```

### Codex (CLI / app)
Point Codex at `.codex-plugin/plugin.json` per its plugin docs.

### OpenCode
See [`.opencode/INSTALL.md`](.opencode/INSTALL.md).

### GitHub Copilot CLI
```
copilot plugin install <this repo>
```
(Or symlink `.copilot-plugin/plugin.json` per Copilot's plugin convention.)

### Manual / fallback
Any harness that reads `CLAUDE.md` or `AGENTS.md` will pick up Praxis automatically — both files instruct the agent to load `bootstrap.md`.

## Verify it's working

Start a fresh session. Send: `let's build a react todo list`.

Expected: agent outputs `praxis: scope=standard, loading=design,plan,tdd,review` and starts asking clarifying questions before touching code.

Send: `fix the typo "teh" in README`.

Expected: agent outputs `praxis: scope=trivial, loading=` and just fixes it. **No design doc, no plan, no TDD ceremony.**

## Philosophy

- **Pay for discipline only when it pays back.** Triage decides.
- **Skills are short.** If a rule needs 3,000 tokens to express, it's probably not a rule, it's a manual.
- **Cross-harness via env detection,** not per-harness skill copies.
- **No ceremony around the rules** — state each rule once, clearly.

## Layout

```
bootstrap.md          # what the hook injects
skills/*.md           # the 9 skills
hooks/                # session-start.sh + .cmd + hooks.json
.claude-plugin/       # Claude Code manifest
.codex-plugin/        # Codex manifest
.copilot-plugin/      # Copilot CLI manifest
.opencode/            # OpenCode config + install doc
CLAUDE.md, AGENTS.md  # manual entrypoints (fallback)
```

## License

MIT.
