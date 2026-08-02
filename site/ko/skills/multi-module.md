# 멀티 모듈 프로토콜 (Multi-Module Protocol)

멀티 모듈 프로토콜 (`skills/references/multi-module.md`)은 여러 모듈이나 리포지토리에 걸친 변경 사항을 조율합니다.

## 개요

기능 변경이 여러 리포지토리나 워크스페이스에 영향을 미칠 때 Praxis는 `multi-module` 토폴로지로 전환됩니다.

```
praxis: scope=complex, topology=multi-module, loading=design,plan,worktree,subagents,review,ship
```

## 프로토콜 핵심 요소

1. **Coordinator 리포지토리**: 사용자가 기존 리포지토리 중 하나를 Coordinator로 명시적으로 지정합니다. Coordinator가 모듈 교차 명세, 워크스페이스 계획 및 변경 매니페스트(change-set)를 소유합니다.
2. **디스크 상의 모드 마커**: 명세서 및 계획 파일 상단에 명시적인 선언 블록을 포함합니다:
   ```yaml
   topology: multi-module
   change-set: <topic-id>
   coordinator: <repo path>
   repos: <repo paths>
   ```
   후속 스킬은 이 선언을 읽어 세션 메모리에 의존하지 않고 모드를 재인식합니다.
3. **공유 명세 대 로컬 명세**: 공유 계약은 Coordinator 명세서에만 정의됩니다. 각 리포지토리는 로컬 명세를 유지하고 중복 없이 공유 계약을 참조합니다.
4. **통합 및 커밋 순서**: 각 모듈은 독립적으로 빌드 및 테스트를 수행하고 공유 수용 테스트로 검증합니다. 커밋은 의존성 순서에 따라 진행되며 Coordinator 리포지토리가 마지막에 커밋하고 커밋 메시지에서 change-set ID를 공유합니다.
