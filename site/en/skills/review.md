# review

The `review` skill runs before merging, after subagent execution, or to review specs and plans. In multi-module work, review each module diff in its owning repository first and then inspect the workspace as a unified change set.

## Eight-Point Checklist

Evaluate changes in priority order:

1. **Spec match**: Diff implements the staging spec and plan without silent drift.
2. **Standards**: Mechanical lint/format/typecheck passes cleanly and code follows `convention:` ([Quality Standard](./quality)).
3. **Tests**: New behavior and edge cases are tested and green.
4. **Doc-coverage & Living docs**: `contract` covers the full public surface, config/errors are documented, `README.md` commands remain runnable, and living docs stay atemporal and modular.
5. **Edges**: Null, empty, large, concurrent, malformed, Unicode, and timezone inputs.
6. **Security**: Input validation, secret handling, authorization boundaries, injection, and path traversal.
7. **Scope**: Revert unrelated edits; flag implementations over twice the necessary complexity.
8. **Integration (multi-module)**: Dependency order, compatibility, failure propagation, and coordinator acceptance cover all participating modules.

## Output Format

Report findings strictly as `BLOCK` (must fix before merge), `FIX` (resolve or defer with explicit reason), or `NIT` (optional).
