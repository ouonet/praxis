# worktree

`worktree` 스킬은 기본 체크아웃을 방해하지 않고 비사소하거나 병렬적인 작업을 독립된 Git worktree에서 수행합니다.

`topology=multi-module`에서는 각 리포지토리를 독립적인 Git 및 worktree 경계로 취급하며 공통 상위 디렉토리에서 전체 Git 변경을 실행하지 않습니다. worktree 생성 전 각 등록 리포지토리 상태와 기준 테스트를 확인하고 브랜치/디렉토리 이름에 `change-set` ID를 포함합니다. 누락된 리포지토리, 무관한 dirty 변경 또는 실패 상태 기준선은 생성을 차단합니다.

## 사용법 및 도구 범위

```bash
git worktree add ../<repo>-<topic> -b <type>/<topic>
cd ../<repo>-<topic> && <setup> && <run tests>
```

구현 전 워크트리 기준 테스트가 그린인지 먼저 확인합니다. 또한 시맨틱/코드 그래프 인덱싱 도구는 보통 원본 메인 리포지토리만 인덱싱하고 분리된 worktree에서는 파일 읽기/grep 도구만 정상 동작하므로 서브에이전트 배치 시 이를 안내하세요. `ship` 시 worktree를 정리합니다.
