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

### Antigravity CLI

```bash
agy plugin install https://github.com/ouonet/praxis
```

### Gemini CLI

```bash
gemini extensions install https://github.com/ouonet/praxis
```

### pi CLI

```bash
pi install git:github.com/ouonet/praxis
```

**プロジェクトスコープにインストール**（`.pi/settings.json` に書き込み、チームで共有）：

```bash
pi install -l git:github.com/ouonet/praxis
```

**更新**：

```bash
pi update git:github.com/ouonet/praxis      # 1つのパッケージを更新
pi update --extensions                      # すべてのパッケージを更新
pi update                                   # pi + パッケージを更新
```

**アンインストール**：

```bash
pi remove git:github.com/ouonet/praxis
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

**pi CLI**

```bash
pi install git:github.com/ouonet/praxis@<branch>
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
