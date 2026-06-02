---
layout: home

hero:
  name: Praxis
  text: 目標を定め、介入しない。
  tagline: AIコーディングエージェントのための規律フレームワーク。エージェントに目標と完了の形を伝える — やり方ではなく。
  image:
    src: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo.svg
    alt: Praxis
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/getting-started
    - theme: alt
      text: GitHubで見る
      link: https://github.com/ouonet/praxis

features:
  - title: トリアージ駆動
    details: スキルが読み込まれる前に、すべてのタスクがスコープ別に分類される。些細なタスクはフロー全体をスキップ — 必要なときだけ規律を適用する。
  - title: トークン効率
    details: スキルの平均は約230トークン。設計→出荷の完全サイクルは約1,300トークン。他の代替案の30〜50kと比較して。
  - title: 意図で動かす、指示ではなく
    details: 仕様は決定事項のリスト。計画はマイルストーンのフレームワーク。エージェントはドメイン知識をもたらす — Praxisは重要なことを提供する。
  - title: マルチツール対応
    details: Claude Code、Codex、OpenCode、GitHub Copilot CLI、そしてmarkdownファイルを読めるあらゆるツールで動作する。
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
