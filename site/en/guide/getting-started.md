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

### pi CLI

```bash
pi install git:github.com/ouonet/praxis
```

**Install to project scope** (writes to `.pi/settings.json`, shared with team):

```bash
pi install -l git:github.com/ouonet/praxis
```

**Update**:

```bash
pi update git:github.com/ouonet/praxis      # update one package
pi update --extensions                      # update all packages
pi update --all                             # update pi + packages
```

**Uninstall**:

```bash
pi remove git:github.com/ouonet/praxis
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

**pi CLI**

```bash
pi install git:github.com/ouonet/praxis@<branch>
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
