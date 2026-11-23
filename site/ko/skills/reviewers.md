# 명세 리뷰어 게이트 (Spec Reviewers)

명세 리뷰어 프로토콜(`skills/references/reviewers.md`)은 `design` 단계에서 스테이징 명세서를 디스크에 작성한 후 `plan`으로 전달하기 전에 실행되는 병렬 리뷰 게이트를 규정합니다.

## 트리거 기반 동적 선택

명세서 조건에 일치하는 모든 리뷰어를 실행합니다. 조건은 누적되며, 기준선 트리거 1만 일치하면 `spec-compliance`만 실행됩니다.

| # | 트리거 조건 | 실행되는 리뷰어 | 모델 티어 | 검토 역할 |
|---|---|---|---|---|
| 1 | **항상** (기준선) | `spec-compliance` | `balanced` | 모든 `contract:`/`invariant:`에 대응하는 수용 `test:`가 있고, 실패 모드·범위 경계·데이터 형태가 구체적인지 검증. |
| 2 | **≥3개의 상태 열거 또는 상태 머신** 정의 | `state-machine` | `strongest` | 합법적인 모든 상태 전이를 나열하고, 누락된 간선, 데드/도달 불가 상태, 미선언 초기/종료 상태 지적. |
| 3 | **동일 동작을 상호 참조하는 ≥2개 규칙** 포함 | `consistency` | `strongest` | 모순, 우선순위 미정의, 불완전한 예외 목록, 본문과 표의 불일치 탐지. |
| 4 | **`topology=multi-module` 또는 공유 계약 선언** | `boundary` | `balanced` | 공유 계약의 단일 소유자, 명시적 버전 규칙, 직렬화 호환성, 모듈 간 가정 검증. |
| 5 | **영구 쓰기, 외부 부수 효과, 커밋 의미론** 포함 | `safety` | `strongest` | 모든 쓰기 경로를 추적해 크래시 복구 누락, 중복 쓰기, 부분 커밋, 원자성 경계 검증. |
| 6 | **`scope=complex` 또는 서브에이전트 병렬 구현 예정** | `implementability` | `balanced` | 처음 보는 구현자 관점에서 미정의 자료구조, 모호한 순서, 오류 처리·기본값 누락 지적. |

모델 티어 해결 순서: 프로젝트 `.praxis/model-tiers.yaml` → 사용자 `~/.praxis/model-tiers.yaml` → 하네스 기본 모델 (`tiers.<tier>.model` 참조).

## 병렬 실행 및 Coordinator 통합 평가

1. **병렬 실행**: 트리거된 모든 리뷰어는 독립적인 서브에이전트로 명세서 경로(`docs/staging/specs/YYYY-MM-DD-<topic>.md`)만 전달받아 한 줄에 하나씩(`BLOCK | GAP | CONFLICT`) 반환합니다.
2. **Coordinator 통합 평가**: 한 번만 실행됩니다. 주 에이전트가 지적 사항을 비판적으로 평가하고 충돌 해결, 누락 보완, 심각도 판정(`BLOCK` 또는 사유를 포함한 `DEFER`)을 수행해 한 번의 패스로 명세서를 수정하고 사용자에게 보고합니다. 리뷰어는 조언하고 Coordinator가 최종 결정을 내립니다.
