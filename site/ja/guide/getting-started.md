# はじめる

## インストール方法

Praxis は統合インストーラー CLI `@ouonet/praxis` を提供しており、各 AI 実行環境のネイティブプラグイン機能とも完全に互換性があります。

### 方法 1: Praxis CLI（推奨）

グローバルに事前インストールすることなく、`npx` で各環境のインストール・更新・状態確認を行えます：

```bash
# インストール済みホストと Praxis 状態の確認
npx @ouonet/praxis status

# 検出されたすべてのホストに一括インストール
npx @ouonet/praxis install --host all

# 特定のホストにインストール
npx @ouonet/praxis install --host claude --scope user
npx @ouonet/praxis install --host opencode --scope project
npx @ouonet/praxis install --host codex --scope local
npx @ouonet/praxis install --host antigravity
npx @ouonet/praxis install --host pi
npx @ouonet/praxis install --host omp
npx @ouonet/praxis install --host qoder
```

#### 対応ホスト (Hosts)
- `claude`: Claude Code CLI
- `codex`: Codex CLI / App
- `opencode`: OpenCode
- `antigravity`（別名 `agy`）: Antigravity CLI / AGY
- `pi`: pi CLI
- `omp`（別名 `oh-my-pi`）: Oh My Pi
- `qoder`（別名 `qoderclicn`）: Qoder CLI CN
- `copilot`: GitHub Copilot CLI
- `agents`（別名 `generic`）: `.agents` 仕様に準拠した汎用 Agent
- `all`: サポートされているすべてのホストにインストール

#### スコープ (Scopes)
- `project`（プロジェクトディレクトリ内でのデフォルト）: Git 等で管理されるプロジェクト共有スコープ（`opencode.json`、`.agents/skills/`、`.claude/settings.json` など）。
- `local`: 現在のワークスペース限定のローカルスコープ。リポジトリ共有設定を汚さずに有効化。
- `user` / `global`（ホームディレクトリでのデフォルト）: ユーザーホームスコープ（`~/.claude`、`~/.codex`、`~/.gemini/config`、`~/.omp`、`~/.qoder-cn` など）。すべてのワークスペースで有効。

#### 管理コマンド
```bash
# Praxis の更新
npx @ouonet/praxis update --host all

# Praxis のアンインストール
npx @ouonet/praxis uninstall --host opencode --scope project
```

---

### 方法 2: 各ホストのネイティブインストール

各ツールのネイティブコマンドや設定ファイルを使用して直接インストールすることも可能です：

#### Claude Code
```bash
claude plugins marketplace add ouonet/praxis
claude plugins install praxis
```

#### Codex
`.codex/config.toml` に設定：
```toml
[plugins."praxis@git+https://github.com/ouonet/praxis.git"]
enabled = true
```

#### OpenCode
`opencode.json` に設定：
```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

#### Antigravity CLI (AGY)
```bash
agy plugin install https://github.com/ouonet/praxis
```

#### pi CLI
```bash
# グローバルインストール
pi install git:github.com/ouonet/praxis

# プロジェクトスコープ（.pi/settings.json に書き込み）
pi install -l git:github.com/ouonet/praxis
```

#### Oh My Pi (omp)
```bash
omp plugin add https://github.com/ouonet/praxis
```

#### Qoder CLI CN
プロジェクトルートの `.qoder-plugin` に `plugin.json` を配置するか、グローバルの `~/.qoder-cn/plugins/` に配置します。

---

## ブランチからのインストール

未リリースや検証中のブランチを試す場合：

```bash
# CLI 経由
npx @ouonet/praxis install --host claude --ref <branch>
npx @ouonet/praxis install --host opencode --ref <branch>
```

ネイティブ経由：
- **Claude Code**: `claude plugins marketplace add ouonet/praxis#<branch>` → `claude plugins install praxis`
- **pi CLI**: `pi install git:github.com/ouonet/praxis@<branch>`
- **OpenCode**: `"plugin": ["praxis@git+https://github.com/ouonet/praxis.git#<branch>"]`

---

## 動作確認

新しいセッションを開始し、以下を送信します：

```
fix the typo "teh" in README
```

期待される出力: `praxis: scope=trivial, loading=` —— 設計ドキュメントや計画を作成せず、直接ファイルを修正します。

続けて以下を送信します：

```
add OAuth login with GitHub
```

期待される出力: `praxis: scope=standard, loading=design,plan,tdd,review` —— コードに触れる前に要件の明確化と仕様策定を開始します。

---

## モデル階層の設定（任意）

並列サブエージェント（`subagents`）や仕様レビュー担当（`design` ゲート）を派遣する際、Praxis はタスクの能力階層（`fast`、`balanced`、`strongest`）を割り当てます。

プロジェクトルートまたはホームディレクトリに `.praxis/model-tiers.yaml` を作成することで、階層を特定のモデルにマッピングできます：

```yaml
fast: claude-3-5-haiku
balanced: claude-3-7-sonnet
strongest: claude-3-7-sonnet
```

設定ファイルがない場合、すべてのサブエージェントはホスト環境のデフォルトモデルを使用します。
