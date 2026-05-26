# 작동 방식

세션 시작 시 훅이 `praxis:using-praxis` 스킬을 주입한다. 매 메시지마다 에이전트는:

1. **범위를 분류** — 트리아지 테이블을 인라인으로 사용. 추가 스킬 호출 불필요.
2. **선언** — 범위를 알리고 필요한 스킬을 병렬로 로드.
3. **준수** — 로드된 스킬을 그대로 따르며 `<gate>` 마커를 존중.

## 트리아지

| 범위 | 신호 | 로드되는 스킬 |
|---|---|---|
| vague | 문제 공간 미정의 | `discover` |
| trivial | 오타, 이름 변경, 문서만, ≤1줄 | 없음 |
| small | 단일 함수, 단일 파일, ≤50 LOC | `tdd` |
| standard | 기능 또는 소스 코드 변경 | `design`, `plan`, `tdd`, `review` |
| complex | 새 시스템, ≥5개 작업, 병렬 편집 | `design`, `plan`, `worktree`, `subagents`, `review`, `ship` |
| debug | 오류, 회귀, 테스트 실패 | `debug` |
| onboard | 기존 프로젝트, 기술 명세 없음 | `onboard` |

## 흐름 예시

### 작은 수정
```
당신:    fix the typo "teh" in README
에이전트: scope=trivial → edit → done
```

### 표준 기능
```
당신:    add OAuth login with GitHub
에이전트: scope=standard → design → plan → tdd → review → ship
```

### 모호한 목표
```
당신:    I want to build something that helps developers manage their workflow
에이전트: scope=vague → discover (가설, 실험, 스파이크 코드)
                     → 방향 확정 → design → ...
```

### 대규모 프로젝트 (롤링 웨이브)
```
당신:    build a new auth system from scratch
에이전트: scope=complex → design (명세 + 로드맵 M1/M2/M3)
                       → plan M1 → tdd → ship M1
                       → plan M2 → tdd → ship M2 → ...
```
