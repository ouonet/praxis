# design

The `design` skill produces executable specifications before coding or planning begins. It handles new features, architectural changes, vague goals, and multi-module work.

## Key Features

1. **Clarification Frontier**: Resolves discoverable facts from code first, asking the user only for current decision frontiers in prerequisite order.
2. **Declarative Specs**: Writes decisions as declarative contracts (`contract:`, `invariant:`, `test:`, `convention:`, `deferred:`).
3. **Spec Review Gate**: Before handoff to `plan`, inspects the spec against the [Reviewers Trigger Table](./reviewers). Dispatches matching reviewers as parallel subagents. The coordinator performs critical synthesis to patch findings in one pass.
4. **Multi-Module Topology**: For changes spanning multiple repos, designates a coordinator repo, writes an on-disk mode marker (`topology: multi-module`), and maintains shared vs module-local specs.
5. **Abandon Path**: Allows stopping cleanly if exploration concludes without a build decision, archiving learnings into `docs/decisions/`.
