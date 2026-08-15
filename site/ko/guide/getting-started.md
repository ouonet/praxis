# 시작하기

## 설치 방법

Praxis는 통합 설치 CLI인 `@ouonet/praxis`를 제공하며, 각 AI 하네스의 네이티브 플러그인 생태계와도 완벽히 호환됩니다.

### 방법 1: Praxis CLI (권장)

사전에 글로벌 의존성을 설치할 필요 없이 `npx`를 통해 각 환경의 설치, 업데이트, 상태 확인을 통합 관리할 수 있습니다:

```bash
# 설치된 호스트 및 Praxis 상태 확인
npx @ouonet/praxis status

# 감지된 모든 호스트에 일괄 설치
npx @ouonet/praxis install --host all

# 특정 호스트에 설치
npx @ouonet/praxis install --host claude --scope user
npx @ouonet/praxis install --host opencode --scope project
npx @ouonet/praxis install --host codex --scope local
npx @ouonet/praxis install --host antigravity
npx @ouonet/praxis install --host pi
npx @ouonet/praxis install --host omp
npx @ouonet/praxis install --host qoder
```

#### 지원 호스트 (Hosts)
- `claude`: Claude Code CLI
- `codex`: Codex CLI / App
- `opencode`: OpenCode
- `antigravity` (별칭 `agy`): Antigravity CLI / AGY
- `pi`: pi CLI
- `omp` (별칭 `oh-my-pi`): Oh My Pi
- `qoder` (별칭 `qoderclicn`): Qoder CLI CN
- `copilot`: GitHub Copilot CLI
- `agents` (별칭 `generic`): `.agents` 표준 사양을 따르는 범용 Agent
- `all`: 지원되는 모든 호스트에 설치

#### 설치 범위 (Scopes)
- `project` (프로젝트 디렉토리 기본값): Git 등으로 추적되는 프로젝트 범위 (`opencode.json`, `.agents/skills/`, `.claude/settings.json` 등), 팀과 공유.
- `local`: 현재 작업 디렉토리 전용 로컬 범위. 공유 설정 파일을 수정하지 않고 활성화.
- `user` / `global` (홈 디렉토리 기본값): 전역 사용자 홈 범위 (`~/.claude`, `~/.codex`, `~/.gemini/config`, `~/.omp`, `~/.qoder-cn` 등), 모든 작업 공간에서 사용 가능.

#### 관리 명령어
```bash
# Praxis 업데이트
npx @ouonet/praxis update --host all

# Praxis 제거
npx @ouonet/praxis uninstall --host opencode --scope project
```

---

### 방법 2: 각 호스트 네이티브 설치

각 도구의 기본 명령어나 설정 파일을 사용하여 직접 설치할 수도 있습니다:

#### Claude Code
```bash
claude plugins marketplace add ouonet/praxis
claude plugins install praxis
```

#### Codex
`.codex/config.toml`에 설정:
```toml
[plugins."praxis@git+https://github.com/ouonet/praxis.git"]
enabled = true
```

#### OpenCode
`opencode.json`에 설정:
```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

#### Antigravity CLI (AGY)
```bash
agy plugin install https://github.com/ouonet/praxis
```

#### pi CLI
```bash
# 전역 설치
pi install git:github.com/ouonet/praxis

# 프로젝트 범위 설치 (.pi/settings.json에 기록)
pi install -l git:github.com/ouonet/praxis
```

#### Oh My Pi (omp)
```bash
omp plugin add https://github.com/ouonet/praxis
```

#### Qoder CLI CN
프로젝트 루트의 `.qoder-plugin` 디렉토리에 `plugin.json`을 추가하거나, 전역 `~/.qoder-cn/plugins/`에 설정합니다.

---

## 브랜치에서 설치

미출시 버전이나 개발 브랜치를 테스트하려면:

```bash
# CLI를 통한 브랜치 설치
npx @ouonet/praxis install --host claude --ref <branch>
npx @ouonet/praxis install --host opencode --ref <branch>
```

네이티브 방식:
- **Claude Code**: `claude plugins marketplace add ouonet/praxis#<branch>` 및 `claude plugins install praxis`
- **pi CLI**: `pi install git:github.com/ouonet/praxis@<branch>`
- **OpenCode**: `"plugin": ["praxis@git+https://github.com/ouonet/praxis.git#<branch>"]`

---

## 검증

새 세션을 시작하고 다음을 전송합니다:

```
fix the typo "teh" in README
```

예상 출력: `praxis: scope=trivial, loading=` —— 설계 문서나 계획 없이 파일을 바로 수정합니다.

이어서 다음을 전송합니다:

```
add OAuth login with GitHub
```

예상 출력: `praxis: scope=standard, loading=design,plan,tdd,review` —— 코드를 수정하기 전에 명확화 질문을 하고 명세 계약을 수립합니다.

---

## 모델 티어 설정 (선택 사항)

병렬 서브에이전트(`subagents`)나 명세 리뷰어(`design` 게이트)를 디스패치할 때, Praxis는 작업 기능 티어(`fast`, `balanced`, `strongest`)를 할당합니다.

프로젝트 루트 또는 홈 디렉토리에 `.praxis/model-tiers.yaml` 파일을 생성하여 티어를 특정 모델에 매핑할 수 있습니다:

```yaml
fast: claude-3-5-haiku
balanced: claude-3-7-sonnet
strongest: claude-3-7-sonnet
```

설정 파일이 없는 경우 모든 서브에이전트는 하네스의 기본 모델을 사용합니다.
