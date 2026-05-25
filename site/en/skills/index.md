# Skills

Skills are short markdown files that inject structured discipline into an agent session. Each skill is loaded only when its scope is needed.

| Skill | When | Tokens |
|---|---|---|
| [discover](./discover) | problem space undefined | ~200 |
| [design](./design) | scope ≥ standard, anything new | ~200 |
| [plan](./plan) | after design approval | ~200 |
| [tdd](./tdd) | implementing or fixing | ~400 |
| [debug](./debug) | something broken | ~150 |
| [review](./review) | before merge / after subagent task | ~150 |
| [worktree](./worktree) | non-trivial or parallel work | ~150 |
| [subagents](./subagents) | independent tasks, fan-out | ~150 |
| [ship](./ship) | merge / PR / cleanup | ~100 |
| [release](./release) | version / tag / publish | ~150 |
| [onboard](./onboard) | existing project, no tech-spec | ~200 |
