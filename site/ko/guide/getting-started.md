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
