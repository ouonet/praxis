# Skills

Skills are short markdown files that inject structured discipline into an agent session. Each skill is loaded only when its scope is needed.

| Skill | When | Tokens |
|---|---|---|
| [design](./design) | scope ≥ standard, anything new; vague goals — clarifies before designing | ~250 |
| [plan](./plan) | after design approval | ~200 |
| [tdd](./tdd) | implementing or fixing | ~400 |
| [debug](./debug) | something broken | ~150 |
| [review](./review) | before merge / after subagent task | ~150 |
| [worktree](./worktree) | non-trivial or parallel work | ~150 |
| [subagents](./subagents) | independent tasks, fan-out | ~150 |
| [ship](./ship) | merge / PR / cleanup | ~100 |
| [archive](./archive) | merge spec into living docs, delete staging files | ~150 |
| [release](./release) | version / tag / publish | ~150 |
| [onboard](./onboard) | existing project, no tech-spec | ~200 |

## Shared Protocols & References

- [Quality Standard](./quality): Mechanical checks, convention adherence, design assessment, and doc-coverage rules.
- [Spec Reviewers](./reviewers): Trigger table and charters for parallel spec review subagents.
- [Multi-Module Protocol](./multi-module): Topology specification for cross-repository/module changes.

