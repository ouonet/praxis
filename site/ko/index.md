---
layout: home

hero:
  name: Praxis
  text: 목표를 정하고, 간섭하지 않는다.
  tagline: 구조화된 워크플로우를 통해 고품질, 고효율, 극도의 토큰 절약으로 멀티 모듈 및 멀티 리포지토리 프로젝트를 구축하는 AI 에이전트 규율 프레임워크.
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
  - title: 멀티 모듈 & 멀티 리포지토리
    details: Coordinator 계약과 change-set을 통해 복잡한 리포지토리 교차 변경 사항을 매끄럽게 조율 및 관리.
  - title: 고품질 보증 (High Quality)
    details: 트리거 기반 명세 리뷰어 게이트 (Spec Review Gate)와 3차원 품질 검증 (3D Quality Standard)으로 고표준 배포 보장.
  - title: 고효율 & 극도의 토큰 절약
    details: 진단 기반으로 필요한 스킬만 로드. 스킬당 약 ~150~~1,180 토큰, 표준 기능 사이클은 약 ~3,600 토큰.
  - title: 의도 기반 & 크로스 하네스 지원
    details: 절차서가 아닌 선언적 계약으로 의도를 전달. Claude Code, Codex, OpenCode, Antigravity, pi CLI, Oh My Pi (omp), Qoder CLI CN 등 지원.
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
