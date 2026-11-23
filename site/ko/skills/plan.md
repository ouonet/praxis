# plan

`plan` 스킬은 승인된 명세를 `docs/staging/plans/YYYY-MM-DD-<topic>.md`의 실행 가능한 마일스톤 작업으로 분할합니다. 배경, 아키텍처, 근거를 반복하지 않고 명세서 경로만 참조합니다.

## 롤링 웨이브 및 멀티 모듈 토폴로지

- **롤링 웨이브(Rolling wave)**: 명세가 `docs/ROADMAP.md`의 `milestone: MN`을 참조하면 해당 마일스톤만 상세 전개하고 나머지는 한 줄 스텁으로 남깁니다. `ship` 완료 후 다음 마일스톤을 확인해 전개하며, 목표가 본질적으로 바뀐 경우에만 `design`으로 돌아갑니다.
- **멀티 모듈 토폴로지**: `topology=multi-module`이 선언되면 [멀티 모듈 프로토콜](./multi-module)을 읽고 Coordinator 워크스페이스 계획 상단에 모드 선언 블록(`topology: multi-module`, `change-set`, `coordinator`, `repos`, 모듈 계획 경로, 통합 작업)을 둡니다. 각 작업은 하나의 `repository:`와 하나의 `module:`만 소유하며, 「계약 → 소비자 → 로컬 수용 → 통합 → 의존성 순 커밋」 순으로 배치합니다.

## 마일스톤 작업 (각 30~60분)

모든 작업은 제목이 아닌 체크박스(`- [ ] T<n>: <이름>`)로 작성합니다:

```text
goal:       <한 줄 목표>
files:      <대상 경로>
acceptance: <실행 가능한 테스트, 명령어 또는 명시적 수동 검증 절차>
spec:       <docs/staging/specs/...#anchor>
```

공유 계약·상태·수용 기준이 닫혀 있고 쓰기 범위가 겹치지 않는 독립 작업에만 `[parallel] T3, T4, T5`를 표시합니다. 원자적 단계 전개는 `subagents` 배포 시점까지 지연합니다.

## 인계 게이트

`<gate>`
`tdd` 또는 `subagents`에 인계하기 전에 `docs/staging/plans/YYYY-MM-DD-<topic>.md`(멀티 모듈 작업 시 모든 모듈 계획 파일 포함)가 디스크에 존재하고 사용자 확인을 받아야 합니다.
`</gate>`
