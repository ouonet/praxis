---
layout: home

hero:
  name: Praxis
  text: 목표를 정하고, 간섭하지 않는다.
  tagline: AI 코딩 에이전트를 위한 규율 프레임워크. 에이전트에게 목표와 완료의 모습을 알려라 — 방법이 아닌.
  image:
    light: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo.svg
    dark: https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo-dark.svg
    alt: Praxis
  actions:
    - theme: brand
      text: 시작하기
      link: /ko/guide/getting-started
    - theme: alt
      text: GitHub에서 보기
      link: https://github.com/ouonet/praxis

features:
  - title: 트리아지 기반
    details: 스킬이 로드되기 전에 모든 작업을 범위별로 분류한다. 사소한 작업은 전체 흐름을 건너뛴다 — 필요할 때만 규율을 적용한다.
  - title: 토큰 효율
    details: 스킬 평균은 약 230토큰. 설계→출시 전체 사이클은 약 1,300토큰. 다른 대안의 30~50k와 비교하여.
  - title: 지시가 아닌 의도
    details: 명세는 결정 목록이다. 계획은 마일스톤 프레임워크다. 에이전트는 도메인 지식을 가져온다 — Praxis는 중요한 것을 제공한다.
  - title: 멀티 도구 지원
    details: pi CLI, Claude Code, Codex, OpenCode, Antigravity CLI, Gemini CLI, GitHub Copilot CLI, 그리고 마크다운 파일을 읽을 수 있는 모든 도구에서 작동한다.
---

## 실제 동작

### 사소한 수정

```bash
당신: README에서 "teh"를 "the"로 고쳐줘

praxis: scope=trivial
# 파일을 직접 수정하고 종료. 명세도 계획도 없다.
```

### 표준 기능

```bash
당신: GitHub OAuth 로그인을 추가해줘

praxis: scope=standard, loading=design,plan,tdd,review
```

`docs/staging/specs/2025-06-02-github-oauth.md` 생성:

```
contract:  GET /auth/github → 리다이렉트; /callback → 세션 수립
invariant: 기존 세션 영향 없음; 로그아웃 시 cookie 삭제
test:      유효한 GitHub App 자격증명으로 로그인 플로우 완료
deferred:  멀티 프로바이더 OAuth 지원
```

`docs/staging/plans/2025-06-02-github-oauth.md` 생성:

```
- [ ] T1: OAuth 미들웨어 구현
  goal:       passport-github2를 Express 세션에 연결
  files:      src/auth/github.ts, src/middleware/session.ts
  acceptance: npm test -- --grep "OAuth"

- [ ] T2: 콜백 처리 및 세션 영속화
  goal:       GitHub 콜백 파싱 후 사용자 세션 저장
  files:      src/auth/callback.ts, src/models/user.ts
  acceptance: 로그인 후 GET /me가 사용자 정보 반환
```

### 병렬 마이그레이션

```bash
당신: 전체 API를 REST에서 tRPC로 마이그레이션해줘

praxis: scope=complex, loading=design,plan,worktree,subagents,review,ship
```

`docs/staging/plans/2025-06-02-rest-to-trpc.md` 생성:

```
[parallel] T1, T2, T3

- [ ] T1: /users 라우트 마이그레이션
  goal:       users CRUD를 tRPC procedures로 교체
  files:      src/routers/users.ts
  acceptance: npm test -- users

- [ ] T2: /products 라우트 마이그레이션
  goal:       제품 쿼리를 tRPC로 이전
  files:      src/routers/products.ts
  acceptance: npm test -- products

- [ ] T3: /orders 라우트 마이그레이션
  goal:       주문 플로우를 tRPC로 이전, 트랜잭션 경계 유지
  files:      src/routers/orders.ts
  acceptance: npm test -- orders
```

3개의 에이전트가 병렬로 진행하며, 완료 후 코디네이터가 리뷰 및 병합한다.
