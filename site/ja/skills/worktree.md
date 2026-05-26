# Worktree（ワークツリー）

非trivialまたは並行作業に使う。分離されたgit worktreeを作成し、CI、テスト、他の作業を並行して実行してもメインディレクトリをブロックしない。

## 新しいworktree

```bash
git worktree add -b <branch-name>
```

手動でgit checkoutしない。Worktreeはクリーンなディレクトリとブランチを提供する。

## 作業中

Worktreeには独自のファイル、node_modules、環境変数がある。変更は互いに影響しない。

## 完了

Worktreeから出た後：

```bash
git worktree remove <worktree-path>
```

または後で使用するために保持する。
