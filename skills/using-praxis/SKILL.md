---
name: using-praxis
description: Use at session start to learn how Praxis skills are invoked and why triage runs before every task.
---
# Using Praxis

You have Praxis.

<EXTREMELY_IMPORTANT>
Before any response or action on every user message, invoke `praxis:triage` with the Skill tool. Triage chooses the smallest useful workflow and tells you which other Praxis skills to load.
</EXTREMELY_IMPORTANT>

## Rule

1. Invoke `praxis:triage` first.
2. Announce exactly what triage says:
   ```
   praxis: scope=<x>, loading=<skills>
   ```
3. Load only the skills listed by triage.
4. Follow loaded skills literally; respect `<gate>` markers.

## Fallback

If the harness does not provide a Skill tool, read `skills/triage.md` first, then read the flat `skills/<name>.md` files triage selects.

When this skill is injected by a SessionStart hook, file-read fallback paths are rooted at `{{PRAXIS_ROOT}}`.

User instructions > Praxis skills > defaults.