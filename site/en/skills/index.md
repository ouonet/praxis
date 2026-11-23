# Skills

Skills are short markdown files that inject structured discipline into an agent session. Each skill is loaded only when its scope is needed.

| Skill | When | Tokens |
|---|---|---|
| [design](./design) | scope ≥ standard, anything new; handles vague goals & spec reviewers | ~1,320 |
| [plan](./plan) | after design approval; milestone tasks | ~800 |
| [tdd](./tdd) | implementing or fixing; 3D quality refactor gate | ~780 |
| [debug](./debug) | something broken; root cause isolation | ~210 |
| [review](./review) | before merge / after subagent task; standards & doc-coverage | ~450 |
| [worktree](./worktree) | non-trivial or parallel work in Git worktrees | ~340 |
| [subagents](./subagents) | independent tasks, fan-out; ROLE charters & MODEL tiers | ~1,160 |
| [ship](./ship) | merge / PR / cleanup | ~530 |
| [archive](./archive) | merge spec into living docs, delete staging files | ~1,000 |
| [release](./release) | version / tag / publish | ~250 |
| [onboard](./onboard) | existing project, no tech-spec | ~490 |

## Shared Protocols & References

- [Quality Standard](./quality) (~640 tokens): Mechanical checks, convention adherence, design assessment, and doc-coverage rules.
- [Spec Reviewers](./reviewers) (~1,960 tokens): Trigger table and charters for parallel spec review subagents.
- [Multi-Module Protocol](./multi-module) (~1,140 tokens): Topology specification for cross-repository/module changes.
