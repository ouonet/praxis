# worktree

`worktree` 技能通过创建独立的 Git worktree 隔离非平凡修改或并行开发，避免阻塞或污染主工作区。

在 `topology=multi-module` 场景下，须将每个注册仓库视为独立的 Git 与 worktree 边界，绝不能从公共父目录发起跨仓库统一 Git 变更；建立 worktree 前应核查各仓库工作区干净且基线全绿，并在分支名/目录名中携带 `change-set` ID。存在缺失仓库、无关脏改动或红灯基线时必须阻断。

## 用法与工具边界

```bash
git worktree add ../<repo>-<topic> -b <type>/<topic>
cd ../<repo>-<topic> && <setup> && <run tests>
```

进入新 worktree 后务必先验证基准测试为绿再开展修改。派发 Subagent 时需注意：部分语义/符号索引工具可能仅索引主仓库而不包含新建 worktree 目录，常规文件读写与 grep 工具可正常使用。交付 `ship` 时统一清理临时 worktree。
