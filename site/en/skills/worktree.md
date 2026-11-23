# worktree

The `worktree` skill isolates non-trivial or parallel work in separate Git worktrees without disrupting the primary checkout.

For `topology=multi-module`, treat each repository as an independent Git and worktree boundary — never run workspace-wide Git mutations from a common parent. Resolve each registered repository, inspect dirty state and baseline tests first, and include the `change-set` ID in branch/worktree names. Missing repositories, unrelated dirty changes, or red baselines block worktree creation.

## Usage & Tool Scope

```bash
git worktree add ../<repo>-<topic> -b <type>/<topic>
cd ../<repo>-<topic> && <setup> && <run tests>
```

Keep worktree baselines green before coding, and note for dispatched subagents that semantic/index tools often index the main repository rather than detached worktree directories while file read/grep tools work normally. Clean up worktrees at `ship`.
