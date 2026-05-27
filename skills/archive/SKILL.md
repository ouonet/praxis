---
name: archive
description: Use at ship time to merge the spec into the living documentation, delete the staging spec and plan, and ask how to finish.
---
# living documentation

- `README.md` : project overview, what it is, who it's for, how to use it. Links to the technical specification.
- `docs/tech-spec.md` : main technical specification.
- `docs/specs/*.md` : created by splitting out details from the main spec if they are too bulky or complex. Reference by path from the main spec.

technical specification is declarations only (no narrative), with facts only, no interpretation or plans.

# Archive

`<gate>`Before proceeding: (1) verify `tdd`/`subagents` have completed all tasks listed in the plan; (2) confirm the user has provided explicit written approval.`</gate>`

1. **Merge** the living documentation file with `docs/staging/specs/YYYY-MM-DD-<topic>.md`'s content (minus roadmap). Not simple copy-paste — integrate new spec content into the existing living spec, preserving its structure and existing content. Maintain coherence and readability.

2. **Roadmap handling** (if spec contains `## Roadmap`):
   - Roadmap is long-term project knowledge, initialized in living doc during Design.
   - Do **not** re-copy roadmap from staging spec into living doc.
   - Roadmap in living doc will be updated independently as project progresses (separate from staging/archive cycles).

`<gate>`  confirm the merged content with the user before deleting staging spec and plan. ` </gate>`

3. **Delete** `docs/staging/specs/YYYY-MM-DD-<topic>.md` — content absorbed; Git has the history.
4. **Delete** `docs/staging/plans/YYYY-MM-DD-<topic>.md` — plans don't belong on `main`.
