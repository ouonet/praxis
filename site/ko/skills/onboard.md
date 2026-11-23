# onboard

`onboard` 스킬은 기술 명세가 없는 기존 리포지토리를 인계받을 때 코드 수정, 계획 수립 또는 추측성 갭 분석 없이 사실 기반의 라이빙 문서(`docs/tech-spec.md` 및 필요 시 `docs/specs/*.md`)만 생성합니다.

## 절차

1. **탐색**: 코드와 설정에서 진입점, 공개 인터페이스, 주요 의존성, 테스트 패턴, 파일 구조를 직접 읽습니다 (추측 금지).
2. **명확화**: 코드만으로 아키텍처나 의도가 모호한 경우 사용자에게 질문합니다.
3. **`docs/tech-spec.md` 작성**: 표준 선언 필드(`purpose`, `user`, `use-case`, `architecture`, `stack`, `entry`, `contract`, `flow`, `invariant`, `constraint`, `convention`)만 사용하여 비시계열 현재 사실을 기록합니다 (`milestone` 생략). 15줄을 넘는 하위 시스템 상세 내용은 `docs/specs/<topic>.md`로 분리하고 간결하게 유지합니다.
4. **확인**: 작성된 라이빙 문서가 실제 상태와 일치하는지 사용자와 확인합니다.

## 완료 게이트

`<gate>`
`onboard`를 완료하려면 `docs/tech-spec.md`에 `stack`, 최소 1개 이상의 `contract`, 그리고 코드에서 검증된 품질 기준선 `convention`([품질 표준](./quality))이 반드시 포함되어야 합니다.
`</gate>`
