# 시작하기

## 설치

### Claude Code

```bash
claude plugins marketplace add ouonet/praxis
claude plugins install praxis
```

### Codex

```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

### OpenCode

```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git"]
}
```

### Antigravity CLI

```bash
agy plugin install https://github.com/ouonet/praxis
```

### Gemini CLI

```bash
gemini extensions install https://github.com/ouonet/praxis
```

### pi CLI

```bash
pi install git:github.com/ouonet/praxis
```

**프로젝트 스코프에 설치** (`.pi/settings.json`에 저장, 팀과 공유)：

```bash
pi install -l git:github.com/ouonet/praxis
```

**업데이트**：

```bash
pi update git:github.com/ouonet/praxis      # 단일 패키지 업데이트
pi update --extensions                       # 모든 패키지 업데이트
pi update --all                              # pi + 패키지 업데이트
```

**제거**：

```bash
pi remove git:github.com/ouonet/praxis
```

## 브랜치에서 설치

미출시 버전을 사용하려면:

**Claude Code**
```bash
claude plugins marketplace add ouonet/praxis#<branch>
claude plugins install praxis
```

**Codex / OpenCode**
```json
{
  "plugin": ["praxis@git+https://github.com/ouonet/praxis.git#<branch>"]
}
```

**pi CLI**
```bash
pi install git:github.com/ouonet/praxis@<branch>
```

## 확인

새 세션을 시작하고 전송:

```
fix the typo "teh" in README
```

예상 출력: `praxis: scope=trivial, loading=` — 에이전트가 바로 수정한다. 설계 문서도, 계획도, 불필요한 절차도 없다.

다음을 전송:

```
add OAuth login with GitHub
```

예상: `praxis: scope=standard, loading=design,plan,tdd,review` — 에이전트가 코드를 건드리기 전에 명확화 질문을 한다.

## 모델 계층 설정 (선택 사항)

병렬 서브에이전트(`subagents`)나 명세 리뷰어(`design` 게이트)를 전출할 때 Praxis는 작업 능력 계층(`fast`, `balanced`, `strongest`)을 할당합니다.

프로젝트 루트 또는 홈 디렉토리에 `.praxis/model-tiers.yaml` 파일을 생성하여 계층을 구체적인 모델에 매핑할 수 있습니다:

```yaml
fast: claude-3-5-haiku
balanced: claude-3-7-sonnet
strongest: claude-3-7-sonnet
```

설정 파일이 존재하지 않는 경우 모든 서브에이전트는 하네스의 기본 모델을 사용합니다.

