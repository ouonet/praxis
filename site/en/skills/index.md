# Skills

Skills are short markdown files that inject structured discipline into an agent session. Each skill is loaded only when its scope is needed.

| Skill | When | Tokens |
|---|---|---|
| [design](./design) | scope ≥ standard, anything new; handles vague goals & spec reviewers | ~1,180 |
| [plan](./plan) | after design approval; milestone tasks | ~740 |
| [tdd](./tdd) | implementing or fixing; 3D quality refactor gate | ~590 |
| [debug](./debug) | something broken; root cause isolation | ~160 |
| [review](./review) | before merge / after subagent task; standards & doc-coverage | ~420 |
| [worktree](./worktree) | non-trivial or parallel work in Git worktrees | ~320 |
| [subagents](./subagents) | independent tasks, fan-out; ROLE charters & MODEL tiers | ~1,020 |
| [ship](./ship) | merge / PR / cleanup | ~430 |
| [archive](./archive) | merge spec into living docs, delete staging files | ~730 |
| [release](./release) | version / tag / publish | ~220 |
| [onboard](./onboard) | existing project, no tech-spec | ~450 |

## Shared Protocols & References

- [Quality Standard](./quality) (~430 tokens): Mechanical checks, convention adherence, design assessment, and doc-coverage rules.
- [Spec Reviewers](./reviewers) (~1,640 tokens): Trigger table and charters for parallel spec review subagents.
- [Multi-Module Protocol](./multi-module) (~870 tokens): Topology specification for cross-repository/module changes.

