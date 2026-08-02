---
layout: home

hero:
  name: Praxis
  text: 定目标，不干预。
  tagline: 通过结构化工作流，以高质量、高效、极省 Token 的方式构建多模块多仓库项目的 AI 智能体工程规范框架。
  image:
    light: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo.svg
    dark: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo-dark.svg
    alt: Praxis
  actions:
    - theme: brand
      text: 开始使用
      link: /zh/guide/getting-started
    - theme: alt
      text: 在 GitHub 查看
      link: https://github.com/ouonet/praxis

features:
  - title: 多模块与多仓库 (Multi-Module)
    details: 支持 Coordinator 契约与 change-set 跨仓库协同，透明掌控复杂多模块项目的演进。
  - title: 高质量保证 (High Quality)
    details: 触发式规范评审关卡 (Spec Review Gate) 与三维质量校验 (3D Quality Standard)，保障高标准交付。
  - title: 高效且极省 Token (Token-Lean)
    details: 诊断驱动仅按需加载技能。单个技能约 ~150 至 ~1,180 token，标准迭代流程仅需 ~3,600 token。
  - title: 目标驱动与跨工具 (Intent-driven)
    details: 用声明式契约传递意图。原生支持 pi CLI、Claude Code、Codex、Antigravity、Gemini、Copilot 等。
---

## 效果展示

### 微小修复

```bash
你: 把 README 里的 "teh" 改成 "the"

praxis: scope=trivial
# 直接修改文件，完成。无需规范或计划。
```

### 标准功能

```bash
你: 添加 GitHub OAuth 登录

praxis: scope=standard, loading=design,plan,tdd,review
```

生成 `docs/staging/specs/2025-06-02-github-oauth.md`：

```
contract:  GET /auth/github → 跳转授权; /callback → 建立会话
invariant: 已有会话不受影响; 登出清除 cookie
test:      使用有效 GitHub App 凭证完成完整登录流程
deferred:  多平台 OAuth 支持
```

生成 `docs/staging/plans/2025-06-02-github-oauth.md`：

```
- [ ] T1: 接入 OAuth 中间件
  goal:       将 passport-github2 接入 Express 会话
  files:      src/auth/github.ts, src/middleware/session.ts
  acceptance: npm test -- --grep "OAuth"

- [ ] T2: 回调处理与会话持久化
  goal:       解析 GitHub 回调，写入并持久化用户会话
  files:      src/auth/callback.ts, src/models/user.ts
  acceptance: 登录后 GET /me 返回正确用户信息
```

### 并行迁移

```bash
你: 将整个 API 从 REST 迁移到 tRPC

praxis: scope=complex, loading=design,plan,worktree,subagents,review,ship
```

生成 `docs/staging/plans/2025-06-02-rest-to-trpc.md`：

```
[parallel] T1, T2, T3

- [ ] T1: 迁移 /users 路由
  goal:       将 users CRUD 替换为 tRPC procedures
  files:      src/routers/users.ts
  acceptance: npm test -- users

- [ ] T2: 迁移 /products 路由
  goal:       将产品查询迁移至 tRPC
  files:      src/routers/products.ts
  acceptance: npm test -- products

- [ ] T3: 迁移 /orders 路由
  goal:       将订单流程迁移至 tRPC，保留事务边界
  files:      src/routers/orders.ts
  acceptance: npm test -- orders
```

3 个子智能体并行推进，协调者负责最终审查与合并。
