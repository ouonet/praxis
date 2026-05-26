# はじめる

## インストール

### Claude Code

```bash
claude plugins marketplace add ouonet/praxis
claude plugins install praxis
```

### Codex

```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

### OpenCode

```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

## ブランチからインストール

未リリースバージョンを試すには：

**Claude Code**
```bash
claude plugins marketplace add ouonet/praxis#<branch>
claude plugins install praxis
```

**Codex / OpenCode**
```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git#<branch>"]
}
```

## 確認

新しいセッションを開始して送信：

```
fix the typo "teh" in README
```

期待される出力：`praxis: scope=trivial, loading=` — エージェントがそのまま修正する。設計ドキュメントも、計画も、余計な手順もなし。

次に送信：

```
add OAuth login with GitHub
```

期待される出力：`praxis: scope=standard, loading=design,plan,tdd,review` — エージェントはコードに触れる前に確認の質問をする。
