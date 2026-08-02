# 작동 방식

세션 시작 시 프롬프트/훅(Hook)이 `praxis:using-praxis` 스킬을 주입합니다. 각 사용자 메시지 처리 시 에이전트는:

1. **스코프 및 토폴로지 분류**: 진단 표를 바탕으로 인라인 분류합니다 (추가 스킬 호출 없음).
2. **선언**: 스코프(다중 리포지토리의 경우 `topology=multi-module` 포함)를 선언하고 필요한 스킬을 병렬로 로드합니다.
3. **실행**: 로드된 스킬의 지시를 엄격히 따르며 `<gate>` 마커를 준수합니다.

## 진단 선언 포맷

모든 응답은 스코프 분류 줄로 시작합니다:

```
praxis: scope=<x>, loading=<skills>                         # 단일 모듈 (기본값)
praxis: scope=<x>, topology=multi-module, loading=<skills>  # 멀티 모듈
```

| 스코프 (Scope) | 신호 | 로드되는 스킬 |
|---|---|---|
| vague | 문제 공간 미정의 — 무엇을 만들지 결정 불가능 | `design` |
| trivial | 오타 수정, 이름 변경, 문서만 수정, ≤1줄, 순수 질문 | none |
| small | 단일 함수, 단일 파일, ≤50 LOC | `tdd` |
| standard | 기능 변경 또는 소스 코드 수정 | `design`, `plan`, `tdd`, `review` |
| complex | 새 시스템, ≥5개 작업, 병렬 수정 | `design`, `plan`, `worktree`, `subagents`, `review`, `ship` |
| debug | 기능 고장, 회귀 문제, 실패 테스트 | `debug` |
| onboard | 기존 프로젝트, tech-spec.md 없음 | `onboard` |

## 핵심 라이프사이클 게이트

1. **명세 리뷰어 게이트 (`design`)**: 명세서 초안 작성 후 조건별 리뷰어(`spec-compliance`, `state-machine`, `cross-rule`, `cross-module`, `safety`, `implementability`)를 병렬로 전출. Coordinator가 계획 전달 전 비판적 통합 수행.
2. **3차원 품질 게이트 (`tdd` / `review`)**: 구현 사이클을 기계적 검사, 관례 준수, 설계 응집도/결합도, 문서 커버리지 관점에서 평가.
3. **모델 계층별 전출 (`subagents`)**: 팬아웃 작업에 ROLE 계약(`implementer`, `spec-reviewer`, `quality-reviewer`)과 능력 계층(`fast`, `balanced`, `strongest`) 지정.
4. **라이빙 문서 동기화 (`ship` / `archive`)**: 스테이징 명세를 라이빙 문서(`docs/tech-spec.md` 또는 `docs/specs/*.md`)로 병합하고 CHANGELOG 업데이트 후 정리.

## 예시 흐름

### 사소한 수정
```
You:   fix the typo "teh" in README
Agent: scope=trivial → 수정 → 완료
```

### 표준 기능
```
You:   add OAuth login with GitHub
Agent: scope=standard → design (명세 + 명세 리뷰어 게이트) → plan → tdd (품질 검증) → review → ship
```

### 멀티 모듈 변경
```
You:   add a shared checkout flow across api and web repos
Agent: scope=complex, topology=multi-module → design (Coordinator 명세) → plan → 리포지토리별 subagents → ship
```
