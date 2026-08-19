# 开始使用

## 安装方式

Praxis 提供了统一的命令行安装工具 `@ouonet/praxis`，同时兼容各大 AI 宿主的原生插件生态。

### 方式一：Praxis CLI（推荐）

无需预先安装任何依赖，通过 `npx` 即可统一管理各宿主环境下的 Praxis 安装、更新与状态检测：

```bash
# 快速检测当前各宿主环境及安装状态
npx @ouonet/praxis status

# 一键为所有检测到的已安装环境配置 Praxis
npx @ouonet/praxis install --host all

# 为指定宿主安装
npx @ouonet/praxis install --host claude --scope user
npx @ouonet/praxis install --host opencode --scope project
npx @ouonet/praxis install --host codex --scope local
npx @ouonet/praxis install --host antigravity
npx @ouonet/praxis install --host pi
npx @ouonet/praxis install --host omp
npx @ouonet/praxis install --host qoder
npx @ouonet/praxis install --host grok
```

#### 支持的宿主（Hosts）
- `claude`：Claude Code CLI
- `codex`：Codex CLI / App
- `opencode`：OpenCode
- `antigravity`（别名 `agy`）：Antigravity CLI / AGY
- `pi`：pi CLI
- `omp`（别名 `oh-my-pi`）：Oh My Pi
- `qoder`（别名 `qoderclicn`）：Qoder CLI CN
- `copilot`：GitHub Copilot CLI
- `grok`（别名 `grok-cli`、`xai-grok`）：Grok CLI — 通过拷贝 `rules/praxis.md` 自动引入 using-praxis（Grok 不注入 SessionStart stdout）
- `agents`（别名 `generic`）：遵循 `.agents` 标准工作区协议的通用 Agent
- `all`：一键安装至所有支持的主机

#### 作用域（Scopes）
- `project`（默认在项目目录）：项目范围，配置会落入版本控制（如 `opencode.json`、`.agents/skills/`、`.claude/settings.json`），与团队共享。
- `local`：当前工作区本地范围，仅在当前目录生效但尽量不污染团队提交的共享配置文件。
- `user` / `global`（默认在用户主目录）：全局/用户范围（如 `~/.claude`、`~/.codex`、`~/.gemini/config`、`~/.omp`、`~/.qoder-cn`），所有工作区均可加载。

#### 常用命令
```bash
# 更新 Praxis
npx @ouonet/praxis update --host all

# 卸载 Praxis
npx @ouonet/praxis uninstall --host opencode --scope project
```

---

### 方式二：各宿主原生安装

你也可以直接使用各宿主的原生命令或配置文件安装：

#### Claude Code
```bash
claude plugins marketplace add ouonet/praxis
claude plugins install praxis
```

#### Codex
在 `.codex/config.toml` 中配置：
```toml
[plugins."praxis@git+https://github.com/ouonet/praxis.git"]
enabled = true
```

#### OpenCode
在 `opencode.json` 中配置：
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
# 全局安装
pi install git:github.com/ouonet/praxis

# 项目范围安装（写入 .pi/settings.json）
pi install -l git:github.com/ouonet/praxis
```

#### Oh My Pi (omp)
```bash
omp plugin add https://github.com/ouonet/praxis
```

#### Qoder CLI CN
在项目根目录创建 `.qoder-plugin` 目录并添加 `plugin.json`，或在全局 `~/.qoder-cn/plugins/` 下配置。

#### Grok CLI
原生插件安装不会注入 using-praxis（Grok 丢弃 SessionStart stdout）。请用 Praxis CLI 拷贝 `rules/praxis.md`。

```bash
grok plugin marketplace add ouonet/praxis
grok plugin install praxis --trust
```

---

## 从分支安装

尝试未发布或测试中的分支版本：

```bash
# 通过 CLI 从分支安装
npx @ouonet/praxis install --host claude --ref <branch>
npx @ouonet/praxis install --host opencode --ref <branch>
```

原生方式：
- **Claude Code**：`claude plugins marketplace add ouonet/praxis#<branch>` 并 `claude plugins install praxis`
- **pi CLI**：`pi install git:github.com/ouonet/praxis@<branch>`
- **OpenCode**：`"plugin": ["praxis@git+https://github.com/ouonet/praxis.git#<branch>"]`

---

## 验证

开启一个新 session，发送：

```
fix the typo "teh" in README
```

预期输出：`praxis: scope=trivial, loading=` —— 智能体直接修复，没有多余的仪式。

再发送：

```
add OAuth login with GitHub
```

预期：`praxis: scope=standard, loading=design,plan,tdd,review` —— 智能体在接触代码前先问澄清问题并建立契约规范。

---

## 模型分级配置（可选）

当派发并行子智能体（`subagents`）或规范评审员（`design` 关卡）时，Praxis 会分配任务能力分级（`fast`、`balanced`、`strongest`）。

可在项目根目录或用户主目录下创建 `.praxis/model-tiers.yaml` 将分级映射到具体模型：

```yaml
fast: claude-3-5-haiku
balanced: claude-3-7-sonnet
strongest: claude-3-7-sonnet
```

若未配置文件，所有子智能体默认使用宿主环境的默认模型。
