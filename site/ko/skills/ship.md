# Ship（출시）

모든 계획 작업이 완료되고 그린 상태가 됐을 때.

## Gate — 하나라도 실패하면 멈춰라:

- 테스트가 통과한다.
- `docs/staging/plans/YYYY-MM-DD-<topic>.md`에 `- [ ]`가 없다.
- Staging 명세가 실제 코드 동작을 반영한다.
- 미완료 TodoWrite 작업이 없다.

## 절차

1. 전체 diff를 `review`한다.
2. `archive` — 명세를 living doc에 병합하고, staging 명세와 계획을 삭제한다.
3. 사용자에게 보이면 CHANGELOG의 `Unreleased`에 추가한다.
4. 확인: **merge / PR / keep / discard.**
5. merge 또는 PR 시: worktree를 정리하고, 로컬 브랜치를 삭제한다.
6. 로드맵에 미체크 마일스톤이 있는가? → 다음을 `plan`한다.

사용자의 명시적 승인 없이 push 또는 PR하지 않는다.
