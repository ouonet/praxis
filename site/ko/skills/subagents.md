# subagents

`subagents` 스킬은 계획의 `[parallel]` 마일스톤 작업을 독립된 컨텍스트 창, 명시적 역할 계약(ROLE) 및 선택적 기능 티어 모델 라우팅(MODEL)을 갖춘 서브에이전트에 배포합니다.

## 배포 및 쓰기 격리

마일스톤의 원자적 단계 전개는 배포 시점에만 수행하며, 본문을 붙여넣지 않고 명세/계획 파일 경로를 전달합니다:

```text
TASK: <한 문장 작업>
ROLE: <implementer | spec-reviewer | quality-reviewer>
MODEL: <fast | balanced | strongest>
REPOSITORY / MODULE / FILES / SPEC / ACCEPTANCE / EXTRA
```

한 작업은 하나의 리포지토리/모듈 쓰기 범위만 가지며, 겹치는 모듈 루트에 동시에 여러 쓰기 에이전트를 배포하지 않습니다. 필요한 모듈의 로컬 수용 검증이 모두 통과한 뒤에만 통합 작업을 배포하며, `- [x]` 표시는 Coordinator만 수행합니다.

## 역할 루프 및 상태 처리

작업당 실행 루프: `implementer`(기본 `balanced`) → `spec-reviewer`(기본 `fast`) → `quality-reviewer`(기본 `strongest`) → Coordinator 완료 표시. 반환 상태를 명시적으로 처리합니다:

- `DONE_WITH_CONCERNS`: 정확성 문제면 해결하고, 단순 관찰 사항이면 기록합니다.
- `NEEDS_CONTEXT`: 누락된 사실을 보완해 재배포합니다.
- `BLOCKED`: 무작정 재시도하지 말고 차단 원인(컨텍스트 부족 / 모델 능력 부족 / 과도한 작업 크기 / 계획 오류)을 진단합니다.

## 모델 티어

`MODEL`(`fast | balanced | strongest`)을 생략하면 하네스 기본 모델을 사용합니다. `.praxis/model-tiers.yaml`로 매핑 가능하며(해결 순서: 프로젝트 `.praxis/model-tiers.yaml` → 사용자 `~/.praxis/model-tiers.yaml` → 하네스 기본 모델), 저장소 루트 `model-tiers.example.yaml`의 `tiers.<tier>.{provider, model}` 스키마를 따릅니다.
