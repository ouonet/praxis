---
layout: home

hero:
  name: Praxis
  text: 目標を定め、介入しない。
  tagline: 構造化されたワークフローを通じて、高品質・高効率・極めて高いトークン節約でマルチモジュール・マルチリポジトリプロジェクトを構築する AI エージェントの規律フレームワーク。
  image:
    light: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo.svg
    dark: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo-dark.svg
    alt: Praxis
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/getting-started
    - theme: alt
      text: GitHubで見る
      link: https://github.com/ouonet/praxis

features:
  - title: マルチモジュール & マルチリポジトリ
    details: Coordinator 契約と change-set により、複雑なリポジトリ横断変更をシームレスに調整・管理。
  - title: 高品質保証 (High Quality)
    details: トリガー型仕様レビュアーゲート (Spec Review Gate) と3次元品質検証 (3D Quality Standard) で高品質なデリバリーを保証。
  - title: 高効率 & 極めて高いトークン節約
    details: トリアージ駆動で必要なスキルのみをロード。1スキルあたり約 ~150〜~1,180 トークン、標準機能サイクルでも約 ~3,600 トークン。
  - title: 意図駆動 & クロスハーネス対応
    details: 手順書ではなく宣言的契約で意図を伝達。Claude Code、Codex、OpenCode、Antigravity、pi CLI、Oh My Pi (omp)、Qoder CLI CN 等にネイティブ対応。
---

## 動作例

### 些細な修正

```bash
あなた: README の "teh" を "the" に直して

praxis: scope=trivial
# ファイルを直接修正して終了。仕様書も計画も不要。
```

### 標準機能

```bash
あなた: GitHub OAuthログインを追加して

praxis: scope=standard, loading=design,plan,tdd,review
```

`docs/staging/specs/2025-06-02-github-oauth.md` を生成:

```
contract:  GET /auth/github → リダイレクト; /callback → セッション確立
invariant: 既存セッションは影響なし; ログアウトでcookieを消去
test:      有効なGitHub Appの認証でログインフロー完了
deferred:  マルチプロバイダーOAuth対応
```

`docs/staging/plans/2025-06-02-github-oauth.md` を生成:

```
- [ ] T1: OAuthミドルウェアの実装
  goal:       passport-github2をExpressセッションに接続
  files:      src/auth/github.ts, src/middleware/session.ts
  acceptance: npm test -- --grep "OAuth"

- [ ] T2: コールバック処理とセッション永続化
  goal:       GitHubコールバックを解析してユーザーセッションを保存
  files:      src/auth/callback.ts, src/models/user.ts
  acceptance: ログイン後にGET /meがユーザー情報を返す
```

### 並列マイグレーション

```bash
あなた: API全体をRESTからtRPCに移行して

praxis: scope=complex, loading=design,plan,worktree,subagents,review,ship
```

`docs/staging/plans/2025-06-02-rest-to-trpc.md` を生成:

```
[parallel] T1, T2, T3

- [ ] T1: /usersルートを移行
  goal:       users CRUDをtRPC proceduresに置き換える
  files:      src/routers/users.ts
  acceptance: npm test -- users

- [ ] T2: /productsルートを移行
  goal:       製品クエリをtRPCに移行
  files:      src/routers/products.ts
  acceptance: npm test -- products

- [ ] T3: /ordersルートを移行
  goal:       注文フローをtRPCに移行、トランザクション境界を維持
  files:      src/routers/orders.ts
  acceptance: npm test -- orders
```

3つのエージェントが並列で進行。完了後にコーディネーターがレビューしてマージする。
