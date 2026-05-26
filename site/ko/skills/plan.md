# Plan（계획）

`docs/staging/plans/YYYY-MM-DD-<topic>.md`. 명세를 참조하고, 반복하지 않는다.

미해결된 명세 노트가 구현이나 작업 순서에 영향을 미치면 `design`으로 돌아간다.

## 마일스톤 작업 (각 30~60분)

각 작업은 `- [ ] T<n>: <이름>` — 항상 체크박스, 제목이 아님. `tdd`/`subagents`가 완료 시 `- [x]`로 변경. `ship`은 모든 `- [ ]`가 완료될 때까지 실행을 거부한다.

```
goal:       <한 줄>
files:      <경로>
acceptance: <테스트 또는 명령어>
spec:       <docs/staging/specs/...#anchor>
```

정확한 코드 없음. 단계 없음. Acceptance는 실행 가능: 테스트 이름, 명령어, 또는 스크립트 확인. 각 작업은 저장소를 그린 상태로 유지한다.

독립적인 작업 표시: `[parallel] T3, T4, T5`.

공유 계약, 상태, 오류, acceptance가 닫혀있을 때만 `[parallel]` 표시.

**원자적 전개는 배포 시 지연** — `subagents`가 배포 시 마일스톤을 2~5분 단계로 전개한다. 여기서 하지 않는다.

**신규 프로젝트**: 초기화 작업을 파생시킨다 — 스캐폴드 코드, 테스트, CI. 항상 포함: `README.md`, `CHANGELOG.md`, `.gitignore`, `Makefile` (또는 동등한 태스크 러너 구성).

## 계획에 포함하지 않을 것

배경, 아키텍처, 이유 (명세), CI 명령어, 복붙된 acceptance.

## 롤링 웨이브

명세에 `## Roadmap`이 있는가? `← 지금 상세 계획`으로 표시된 마일스톤만 전개한다. 나머지는 스텁으로 둔다.

`ship` 후: `← 지금 상세 계획` 마커를 다음 마일스톤으로 이동하고 (해당 `← stub`을 `← 지금 상세 계획`으로 변경), 배운 것을 기반으로 업데이트한 후 전개한다. 마일스톤 목표가 본질적으로 바뀐 경우에만 `design`으로 돌아간다.

## Gate

`tdd`/`subagents`에 인계하기 전에 `docs/staging/plans/YYYY-MM-DD-<topic>.md`가 디스크에 존재해야 한다.

사용자와 계획을 확인한다.

`[parallel]`이 많음 → `subagents`. 그렇지 않으면 → `tdd`.
