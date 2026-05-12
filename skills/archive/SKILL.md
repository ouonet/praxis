---
name: archive
description: Use at ship time to merge the spec into the living specification, delete the plan, and update the index.
---
# living specification

`README.md` should contains links to the living specifications:

- MUST have **technical specification**: `docs/tech-spec.md`, details may be placed in `docs/tech-specs/`.
- OPTIONA **product specification**: `docs/prod-spec.md`, details may be placed in `docs/prod-specs/`.

# Archive

1. **Clean** `docs/staging/specs/YYYY-MM-DD-<topic>.md`: drop `## Working notes`, TBDs, process narrative. Keep only decisions, contracts, invariants.
2. **Create** or **Merge** the cleaned spec into living specification file. <gate>`docs/tech-spec.md` must exist on disk </gate>
3. **Delete** `docs/staging/specs/YYYY-MM-DD-<topic>.md` — content absorbed; Git has the history.
4. **Delete** `docs/staging/plans/YYYY-MM-DD-<topic>.md` — plans don't belong on `main`.

