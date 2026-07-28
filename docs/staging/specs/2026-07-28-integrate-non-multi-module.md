contract:  Add native pi CLI packaging through `package.json` and `extensions/praxis.js`; pi discovers `skills/`, injects `skills/using-praxis/SKILL.md` once per session, and documents install, update, uninstall, project-scope, and branch-pin commands in README and all four site locales.
contract:  Add `skills/references/quality.md` as the shared quality and documentation-coverage standard; `design`, `onboard`, `tdd`, `review`, `ship`, and `archive` reference the applicable declarations and gates without any multi-module conditions.
contract:  `design` resolves discoverable facts before asking the user, asks only the current decision frontier in prerequisite order, and stops once implementation-affecting contract, data, failure, and test decisions are decided or deferred.
contract:  Record the integrated pi support, quality gates, and dependency-aware clarification under `CHANGELOG.md` `Unreleased`.
invariant: Version fields remain at the current mainline version until a separate release workflow is requested.
invariant: No topology declaration, coordinator repository, repository registry, module-local spec/plan, revision set, linked commit, dependency-order repository commit, or multi-module reference file is introduced.
invariant: No marketplace source is pinned to `feat/multi-module-workspaces`; branch-install-only ref changes are excluded.
invariant: Existing single-repository Praxis behavior and supported harness integrations remain intact.
test:      A repository scan finds none of the excluded multi-module contract terms outside this staging spec and plan.
test:      Node tests prove pi bootstrap loading, frontmatter stripping, missing-skill handling, and once-per-session injection behavior.
test:      All JSON manifests parse, hook scripts pass `bash -n`, and `npm ci && npm run build` succeeds under `site/`.
test:      README and localized getting-started pages contain the pi commands represented by the package manifest.
convention: Preserve the repository's Markdown skill structure, concise declaration style, ECMAScript module syntax, cross-harness manifest layout, and four-locale documentation parity.
convention: Prefer focused semantic edits over whole-commit cherry-picks; exclude release-only version churn, branch-only install configuration, lockfile metadata churn, and unrelated typography rewrites.
deferred:  Publishing, tagging, pushing, and choosing the next released version are separate explicit release decisions.

## Working notes

source: `feat/multi-module-workspaces` commits `910a36f`, `f688011`, and `0f57aa0` contain the candidate general improvements.
excluded: commits `93d2017`, `f5c4659`, `c9754f7`, and `2ae3874` implement or release multi-module workspace mode.
excluded: commits `6af5ddc`, `91633c6`, `57328d8`, `c25e5bd`, and `18de48f` exist to install the feature branch rather than define mainline behavior.
