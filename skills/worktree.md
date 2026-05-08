---
name: worktree
when: non-trivial or parallel work
---
# Worktree

```bash
git worktree add ../<repo>-<topic> -b <topic>
cd ../<repo>-<topic> && <setup> && <run tests>
```

Baseline must be green. If red, STOP — don't build on broken ground. Done → `ship`.
