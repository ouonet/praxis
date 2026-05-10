# Praxis

Token-lean discipline skills for coding agents. Inspired by [Superpowers](https://github.com/obra/superpowers), rewritten to be ~10× cheaper while keeping the core capabilities.

## What it does

At session start, a hook injects the `praxis:using-praxis` startup skill telling your agent to:

1. Run `triage` first - in Claude Code via the native Skill tool as `praxis:triage`.
2. Load only the skills that scope needs. **Trivial tasks skip the waterfall entirely.**
3. Follow the loaded skill literally; don't freelance past `<gate>` markers.

## Skills

| Skill     | When                                        |
| --------- | ------------------------------------------- |
| triage    | every message — routes to the right skills |
| design    | scope ≥ standard, anything new             |
| plan      | after design                                |
| tdd       | implementing or fixing                      |
| debug     | something broken                            |
| review    | before merge / after subagent task          |
| worktree  | non-trivial or parallel work                |
| subagents | independent tasks, fan-out                  |
| ship      | merge / PR / cleanup                        |
| release   | version / tag / publish                     |

Each skill is 300–700 tokens. Compare to Superpowers' 2,500–3,500 per skill.

## Token budget

|                           | Superpowers | Praxis                  |
| ------------------------- | ----------- | ----------------------- |
| Bootstrap (every session) | ~2,200      | ~350                    |
| Per skill load            | ~3,000      | ~500                    |
| Trivial task              | ~11,000     | ~600 (startup + triage) |
| Standard task             | ~30–50k    | ~5–10k                 |

## Install

### Claude Code

```
claude plugins marketplace add ouonet/praxis
claude plugins install praxis
```

To update after new releases:

```
claude plugins update praxis
```

> Claude Code does not auto-update plugins. Run the update command manually after repo changes.

### Codex (CLI / app)

Point Codex at `.codex-plugin/plugin.json` per its plugin docs.

### OpenCode

See [`.opencode/INSTALL.md`](.opencode/INSTALL.md).

### GitHub Copilot CLI

```
copilot plugin install ouonet/praxis
```

(Or symlink `.copilot-plugin/plugin.json` per Copilot's plugin convention.)

### VsCode Copilot

```
open customization of copilot -> Plugins -> Install Plugin From Source -> input  "ouonet/praxis"
```

### Manual / fallback

For harnesses without plugin support, add an instruction that reads `bootstrap.md` first.

## Verify it's working

Start a fresh session. Send: `let's build a react todo list`.

Expected: Claude Code invokes `Skill(praxis:triage)`, then outputs `praxis: scope=standard, loading=design,plan,tdd,review` and starts asking clarifying questions before touching code.

Send: `fix the typo "teh" in README`.

Expected: agent outputs `praxis: scope=trivial, loading=` and just fixes it. **No design doc, no plan, no TDD ceremony.**

## Scripts

### Tiny fix

```
You: fix the typo "teh" in README
Agent: triage -> trivial -> edit -> done
```

### Standard feature

```
You: add OAuth login with GitHub
Agent: triage -> design -> plan -> tdd -> review -> ship
```

Design asks only needed questions, plan writes milestone tasks, ship updates living specs and CHANGELOG `Unreleased`.

### Parallel work

```
You: migrate the entire API from REST to tRPC
Agent: triage -> design -> plan -> worktree -> subagents -> review -> ship
```

Subagents expand milestones at dispatch time; the coordinator reviews and marks tasks complete.

### Release

```
You: release 1.2.0
Agent: triage -> release
```

Release confirms the version, moves CHANGELOG `Unreleased`, then asks before commit, tag, push, or publish.

## Common Signals

| You ask          | Praxis does                        |
| ---------------- | ---------------------------------- |
| fix typo         | trivial                            |
| add small field  | small -> tdd                       |
| add feature      | standard -> design/plan/tdd/review |
| migrate module   | complex -> worktree/subagents      |
| failing behavior | debug                              |
| release 1.2.0    | release                            |

## Philosophy

- **Pay for discipline only when it pays back.** Triage decides.
- **Skills are short.** If a rule needs 3,000 tokens to express, it's probably not a rule, it's a manual.
- **Cross-harness via env detection,** not per-harness skill copies.
- **No ceremony around the rules** — state each rule once, clearly.

## Layout

```
bootstrap.md          # manual / fallback entrypoint
skills/*.md           # flat fallback skills for file-read harnesses
skills/<name>/SKILL.md # Claude Code native skills
hooks/                # session-start.sh + .cmd + hooks.json
.claude-plugin/       # Claude Code manifest
.codex-plugin/        # Codex manifest
.copilot-plugin/      # Copilot CLI manifest
.opencode/            # OpenCode config + install doc
```

## License

MIT.
