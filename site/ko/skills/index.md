# 스킬

스킬은 에이전트 세션에 구조화된 규율을 주입하는 짧은 마크다운 파일입니다. 각 스킬은 해당 범위가 필요할 때만 로드됩니다.

| 스킬 | 시기 | 토큰 |
|---|---|---|
| [discover](./discover) | 문제 공간 미정의 | ~200 |
| [design](./design) | 범위 ≥ standard, 새로운 것 | ~200 |
| [plan](./plan) | 설계 승인 후 | ~200 |
| [tdd](./tdd) | 구현 또는 수정 중 | ~400 |
| [debug](./debug) | 문제 발생 시 | ~150 |
| [review](./review) | 병합 전 / subagent 작업 후 | ~150 |
| [worktree](./worktree) | 비사소하거나 병렬 작업 | ~150 |
| [subagents](./subagents) | 독립 작업, 팬아웃 | ~150 |
| [ship](./ship) | 병합 / PR / 정리 | ~100 |
| [release](./release) | 버전 / 태그 / 게시 | ~150 |
| [onboard](./onboard) | 기존 프로젝트, 기술 명세 없음 | ~200 |
