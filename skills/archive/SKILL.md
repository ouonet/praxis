---
name: archive
description: Use at ship time to merge the spec into the living specification, delete the plan, and update the index.
---
# Archive

1. **Clean** `docs/specs/YYYY-MM-DD-<topic>.md`: drop `## Working notes`, TBDs, process narrative. Keep only decisions, contracts, invariants.

2. **Create** or **Merge** the cleaned spec into `docs/specification/<domain>.md` as an idiomatic domain specification. Decompose into independently referenceable units — a unit is what a developer would look up on its own. If new, add a link in `docs/specification.md` (create if missing). Link only — never copy content.
   - New decisions → add under the relevant section.
   - Changed decisions → update in place.
   - Decisions explicitly superseded by this spec → remove.
   - Unchanged content → preserve exactly.

3. **Delete** `docs/specs/YYYY-MM-DD-<topic>.md` — content absorbed; Git has the history.

4. **Delete** `docs/plans/YYYY-MM-DD-<topic>.md` — plans don't belong on `main`.
