# archive

`archive` 스킬은 ship(배포) 시점에 활성 스테이징 명세서를 라이빙 문서로 병합하고 프로젝트 기록을 정리/보관하기 위해 실행됩니다.

## 주요 역할

1. **라이빙 문서 동기화**: `docs/staging/specs/YYYY-MM-DD-<topic>.md`를 `docs/tech-spec.md`(또는 `docs/specs/` 하위 명세)로 병합합니다.
2. **스테이징 정리**: 변경 사항이 검증 및 병합되면 스테이징 명세서 및 계획 파일을 삭제합니다.
3. **의사결정 기록 보관**: 탐색 과정에서 생성된 지식 아티팩트나 아키텍처 의사결정을 `docs/decisions/`에 저장합니다.
4. **로드맵 및 변경 이력**: `docs/ROADMAP.md` 마일스톤 상태(`[x]`)를 업데이트하고 `CHANGELOG.md`에 버전 이력을 기록합니다.

## 워크플로우 게이트

`<gate>`
아카이브를 수행하기 전, 스테이징 명세서가 실제 코드 동작을 정확히 반영해야 합니다. 라이빙 문서 업데이트는 표준 필드 형식을 따라야 합니다 (`purpose`, `user`, `use-case`, `architecture`, `stack`, `entry`, `contract`, `flow`, `invariant`, `constraint`, `convention`).
`</gate>`
