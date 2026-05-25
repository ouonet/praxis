# Worktree（工作树）

用于非平凡或并行工作。创建隔离的 git worktree，使 CI、测试、其他工作并行不阻塞主目录。

## 新 worktree

```bash
git worktree add -b <branch-name>
```

不要手工 git checkout。Worktree 给你一个干净的目录和分支。

## 在其中工作

Worktree 有自己的文件、node_modules、环境变量。改动互不影响。

## 完成

从 worktree 退出后：

```bash
git worktree remove <worktree-path>
```

或保留它以供后来使用。
