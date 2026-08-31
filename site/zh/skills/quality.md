# 质量标准规范 (Quality Standard)

质量标准 (`skills/references/quality.md`) 定义了在 `tdd`、`review`、`ship`、`archive` 及 `onboard` 中强制执行的质量标准。

## 三维质量校验

每次实现和重构循环都必须从以下维度进行严格校验：

### 1. 机械化检查 (Mechanical Checks)
- Lint 规则完全通过且零 Warning。
- 代码格式符合项目配置。
- 类型检查（Typecheck）完全通过，不使用 `any` 绕过或抑制类型错误。

### 2. 约定遵循 (Convention Adherence)
- 严格遵循规范（`convention:`）中声明的项目约定与技术栈最佳实践。
- 评估惯用结构、错误处理模式及命名规范。

### 3. 设计与边界评估 (Design & Boundaries)
- **依赖单向性（Inward Dependencies）**：核心业务逻辑严禁直接依赖易变的 I/O、UI 或数据库适配器。
- **副作用隔离（Isolated Side-Effects）**：纯计算与业务决策与 I/O 读写及状态突变明确隔离。
- **高内聚与极简（Cohesion & Simplicity）**：单函数/单模块职责单一；消除臃肿函数与泄露的抽象。

### 4. 文档覆盖率 (Documentation Coverage)
- 所有公共函数、API 接口、导出定义、环境变量及异常模式均具备准确文档。
- `README.md` 中的命令与示例保持可运行且最新。
- 未同步更新文档的代码修改将无法通过 Code Review。
