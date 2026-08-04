# Installing Praxis for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

Add praxis to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and registers all praxis skills.

Verify by asking: `fix the typo "teh" in README` — the agent should output `praxis: scope=trivial, loading=` and just fix it.

## Usage

Praxis runs automatically. On every message, the agent invokes `praxis:using-praxis` first to route to the right skills.

To load a skill manually:

```
/skill design
```

## Updating

To pin a specific version:

```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git#v3.0.0"]
}
```

## Troubleshooting

### Plugin not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i praxis`
2. Verify the plugin line in your `opencode.json`
3. Make sure you're running a recent version of OpenCode

### Windows install issues

If OpenCode cannot install the plugin via git, try installing with system npm:

```powershell
npm install praxis@git+https://github.com/ouonet/praxis.git --prefix "$HOME\.config\opencode"
```

Then use the installed package path in `opencode.json`:

```json
{
  "plugin": ["~/.config/opencode/node_modules/praxis"]
}
```

### Skills not found

1. Use OpenCode's `skill` tool to list available skills
2. Check that the plugin is loading (see above)

### Tool mapping

Skills are harness-neutral. On OpenCode:
- task tracker → `todowrite`
- subagents → `@mention` syntax
- skill loader → OpenCode's native `skill` tool (or read `skills/<name>/SKILL.md`)
- File operations → your native tools
