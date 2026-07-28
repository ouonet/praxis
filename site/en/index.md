---
layout: home

hero:
  name: Praxis
  text: What, not how.
  tagline: A discipline framework for AI coding agents. Tell your agent what you need and what done looks like — not how to do it.
  image:
    light: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo.svg
    dark: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo-dark.svg
    alt: Praxis
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/ouonet/praxis

features:
  - title: Triage-driven
    details: Every task is classified by scope before any skill loads. Trivial tasks skip the waterfall entirely — no ceremony unless it pays back.
  - title: Token-lean
    details: Skills average ~230 tokens each. A full design→ship cycle costs ~1,300 tokens. Compare to alternatives at 30–50k.
  - title: Intent, not instruction
    details: Specs are lists of decisions. Plans are milestone stubs. The agent brings domain knowledge — Praxis provides what matters.
  - title: Cross-harness
    details: Works with pi CLI, Claude Code, Codex, OpenCode, Antigravity CLI, Gemini CLI, GitHub Copilot CLI, and any harness that can read a markdown file.
---

## See It In Action

### Tiny fix

```bash
You: fix the typo "teh" in README

praxis: scope=trivial
# edits the file and stops. No spec, no plan.
```

### Standard feature

```bash
You: add OAuth login with GitHub

praxis: scope=standard, loading=design,plan,tdd,review
```

Generates `docs/staging/specs/2025-06-02-github-oauth.md`:

```
contract:  GET /auth/github → redirect; /callback → session
invariant: existing sessions unaffected; logout clears cookie
test:      login flow completes with valid GitHub app creds
deferred:  multi-provider OAuth
```

Generates `docs/staging/plans/2025-06-02-github-oauth.md`:

```
- [ ] T1: scaffold OAuth middleware
  goal:       wire passport-github2 into Express session
  files:      src/auth/github.ts, src/middleware/session.ts
  acceptance: npm test -- --grep "OAuth"

- [ ] T2: callback handler + session persistence
  goal:       parse GitHub callback, persist user session
  files:      src/auth/callback.ts, src/models/user.ts
  acceptance: GET /me returns user info after login
```

### Parallel migration

```bash
You: migrate the entire API from REST to tRPC

praxis: scope=complex, loading=design,plan,worktree,subagents,review,ship
```

Generates `docs/staging/plans/2025-06-02-rest-to-trpc.md`:

```
[parallel] T1, T2, T3

- [ ] T1: migrate /users routes
  goal:       replace users CRUD with tRPC procedures
  files:      src/routers/users.ts
  acceptance: npm test -- users

- [ ] T2: migrate /products routes
  goal:       migrate product queries to tRPC
  files:      src/routers/products.ts
  acceptance: npm test -- products

- [ ] T3: migrate /orders routes
  goal:       migrate order flow to tRPC, preserve transaction boundaries
  files:      src/routers/orders.ts
  acceptance: npm test -- orders
```

Three agents run in parallel; coordinator reviews and merges on completion.
