# Getting Started

## Install

### Claude Code

```bash
claude plugins marketplace add ouonet/praxis
claude plugins install praxis
```

### Codex

```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

### OpenCode

```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

### Antigravity CLI

```bash
agy plugin install https://github.com/ouonet/praxis
```

### Gemini CLI

```bash
gemini extensions install https://github.com/ouonet/praxis
```

## Install from a branch

To try an unreleased version:

**Claude Code**
```bash
claude plugins marketplace add ouonet/praxis#<branch>
claude plugins install praxis
```

**Codex / OpenCode**
```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git#<branch>"]
}
```

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
