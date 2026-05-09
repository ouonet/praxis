# Praxis

Token-lean discipline skills for coding agents. Inspired by [Superpowers](https://github.com/obra/superpowers), rewritten to be ~10× cheaper while keeping the core capabilities.

## What it does

At session start, a hook injects the `praxis:using-praxis` startup skill telling your agent to:

1. Run `triage` first - in Claude Code via the native Skill tool as `praxis:triage`.
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
| Bootstrap (every session) | ~2,200 | ~350 |
| Per skill load | ~3,000 | ~500 |
| Trivial task | ~11,000 | ~600 (startup + triage) |
| Standard task | ~30–50k | ~5–10k |

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
copilot plugin install <this repo>
```
(Or symlink `.copilot-plugin/plugin.json` per Copilot's plugin convention.)

### Manual / fallback
Any harness that reads `CLAUDE.md` or `AGENTS.md` will pick up Praxis automatically — both files instruct the agent to load `bootstrap.md`.

## Verify it's working

Start a fresh session. Send: `let's build a react todo list`.

Expected: Claude Code invokes `Skill(praxis:triage)`, then outputs `praxis: scope=standard, loading=design,plan,tdd,review` and starts asking clarifying questions before touching code.

Send: `fix the typo "teh" in README`.

Expected: agent outputs `praxis: scope=trivial, loading=` and just fixes it. **No design doc, no plan, no TDD ceremony.**

## Examples

### Trivial — one-liner fix
```
You: rename the variable `usr` to `user` in auth.ts
Agent: praxis: scope=trivial, loading=
      [edits file, done]
```
No ceremony. Triage sees a rename and executes directly.

---

### Small — isolated change
```
You: add an `updatedAt` field to the User model
Agent: praxis: scope=small, loading=tdd
      [writes failing test, updates model, test passes]
```
Skips design and plan. Goes straight to TDD for a bounded change.

---

### Standard — new feature
```
You: add OAuth login with GitHub
Agent: praxis: scope=standard, loading=design,plan,tdd,review
      [asks: which framework? existing auth? session or JWT?]
      [produces design doc, task list, implements with tests, self-reviews]
```
Full waterfall kicks in. Agent clarifies before touching code.

---

### Debug — something broken
```
You: payments are failing in production with a 422 error
Agent: praxis: scope=debug, loading=debug
      [reads logs, traces call stack, proposes hypothesis, patches, verifies]
```
Skips design/plan entirely. Debug skill runs a structured reproduce→isolate→fix loop.

---

### Complex — cross-cutting refactor
```
You: migrate the entire API from REST to tRPC
Agent: praxis: scope=complex, loading=design,plan,worktree,subagents,tdd,review
      [creates worktrees per module, fans out subagents in parallel,
       each subagent runs its own tdd loop, review agent consolidates]
```
Worktree + subagents skills activate to parallelize large work safely.

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
CLAUDE.md, AGENTS.md  # manual entrypoints (fallback)
```

## License

MIT.
