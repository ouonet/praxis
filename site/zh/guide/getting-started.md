# 开始使用

## 安装

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

**安装到项目范围**（写入 `.pi/settings.json`，与团队共享）：

```bash
pi install -l git:github.com/ouonet/praxis
```

**更新**：

```bash
pi update git:github.com/ouonet/praxis      # 更新单个包
pi update --extensions                       # 更新所有包
pi update --all                              # 更新 pi + 所有包
```

**卸载**：

```bash
pi remove git:github.com/ouonet/praxis
```

## 从分支安装

尝试未发布的版本：

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

## 验证

开启一个新 session，发送：

```
fix the typo "teh" in README
```

预期输出：`praxis: scope=trivial, loading=` —— 智能体直接修复，没有设计文档、计划或其他仪式。

再发送：

```
add OAuth login with GitHub
```

预期：`praxis: scope=standard, loading=design,plan,tdd,review` —— 智能体在接触代码前先问澄清问题。

## 模型分级配置（可选）

当派发并行子智能体（`subagents`）或规范评审员（`design` 关卡）时，Praxis 会分配任务能力分级（`fast`、`balanced`、`strongest`）。

可在项目根目录或用户主目录下创建 `.praxis/model-tiers.yaml` 将分级映射到具体模型：

```yaml
fast: claude-3-5-haiku
balanced: claude-3-7-sonnet
strongest: claude-3-7-sonnet
```

若未配置文件，所有子智能体默认使用宿主环境的默认模型。

