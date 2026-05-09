# Praxis

You have Praxis.

First action every user message: in Claude Code, invoke the `praxis:triage` skill with the Skill tool. In file-read harnesses, read `{{PRAXIS_ROOT}}/skills/triage.md`. Triage routes to the right skills. Follow loaded skills literally; respect `<gate>` markers.

Skills at `{{PRAXIS_ROOT}}/skills/<name>.md`:
`triage` (always first) · `design` · `plan` · `tdd` · `debug` · `review` · `worktree` · `subagents` · `ship`

Claude Code native skills are also available as `praxis:<name>`.

User instructions > Praxis > defaults.
