# Worktree（워크트리）

비사소하거나 병렬 작업에 사용한다. 격리된 git worktree를 생성하여 CI, 테스트, 다른 작업이 병렬로 실행돼도 메인 디렉토리를 차단하지 않는다.

## 새 worktree

```bash
git worktree add -b <branch-name>
```

수동으로 git checkout하지 않는다. Worktree가 깨끗한 디렉토리와 브랜치를 제공한다.

## 작업 중

Worktree에는 자체 파일, node_modules, 환경 변수가 있다. 변경 사항은 서로 영향을 미치지 않는다.

## 완료

Worktree에서 나온 후:

```bash
git worktree remove <worktree-path>
```

또는 나중에 사용하기 위해 유지한다.
