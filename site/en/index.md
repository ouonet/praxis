---
layout: home

hero:
  name: Praxis
  text: What, not how.
  tagline: A discipline framework for AI coding agents to build complex multi-module, multi-repo projects through structured workflows — delivering high quality, high efficiency, and extreme token savings.
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
  - title: Multi-Module & Multi-Repo
    details: Coordinate complex cross-repository changes seamlessly via designated coordinator specs, module plans, and stable change-sets.
  - title: High Quality Assurance
    details: Trigger-based Spec Review Gates and 3-dimensional quality standards (mechanical checks, convention adherence, design, doc-coverage).
  - title: High Efficiency & Token-Lean
    details: Inline triage loads only required skills. Skills range from ~150 to ~1,180 tokens each (~3,600 tokens for a standard feature cycle).
  - title: Intent-Driven & Cross-Harness
    details: Declarations of intent over verbose instructions. Native support for Claude Code, Codex, OpenCode, Antigravity, pi CLI, Oh My Pi (omp), Qoder CLI CN, and more.
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
