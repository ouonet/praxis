---
name: archive
description: Use at ship time to merge the spec into the living specification, delete the plan, and update the index.
---
# Archive

1. **Clean** `docs/specs/YYYY-MM-DD-<topic>.md`: drop `## Working notes`, TBDs, process narrative. Keep only decisions, contracts, invariants.

2. **Create** or **Merge** the cleaned spec into `docs/specification.md` as an idiomatic domain specification. 

3. **Delete** `docs/specs/YYYY-MM-DD-<topic>.md` — content absorbed; Git has the history.

4. **Delete** `docs/plans/YYYY-MM-DD-<topic>.md` — plans don't belong on `main`.
