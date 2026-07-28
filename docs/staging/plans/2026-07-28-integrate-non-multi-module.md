spec: `docs/staging/specs/2026-07-28-integrate-non-multi-module.md`

[parallel] T1, T2

- [x] T1: Integrate single-repository quality and clarification workflow
  goal:       Bring the general quality, documentation-coverage, and dependency-aware design rules onto the mainline skill set without multi-module clauses.
  files:      `skills/references/quality.md`, `skills/archive/SKILL.md`, `skills/design/SKILL.md`, `skills/onboard/SKILL.md`, `skills/review/SKILL.md`, `skills/ship/SKILL.md`, `skills/tdd/SKILL.md`, `tests/quality-workflow.test.mjs`
  acceptance: `node --test tests/quality-workflow.test.mjs`
  spec:       `docs/staging/specs/2026-07-28-integrate-non-multi-module.md`

- [x] T2: Integrate native pi CLI support
  goal:       Add the pi package manifest, once-per-session bootstrap extension, focused runtime tests, and matching localized installation documentation.
  files:      `package.json`, `extensions/praxis.js`, `tests/pi-extension.test.mjs`, `site/en/guide/getting-started.md`, `site/zh/guide/getting-started.md`, `site/ja/guide/getting-started.md`, `site/ko/guide/getting-started.md`, `site/en/index.md`, `site/zh/index.md`, `site/ja/index.md`, `site/ko/index.md`
  acceptance: `node --test tests/pi-extension.test.mjs` and `npm ci && npm run build` from `site/`
  spec:       `docs/staging/specs/2026-07-28-integrate-non-multi-module.md`

- [x] T3: Integrate public documentation and verify scope
  goal:       Document the accepted general improvements under mainline usage and Unreleased history, then prove the combined change is green and contains no excluded workspace behavior.
  files:      `README.md`, `CHANGELOG.md`
  acceptance: `node --test tests/*.test.mjs`; parse all JSON manifests; run `bash -n hooks/session-start hooks/run-hook.cmd`; build `site/`; scan the non-staging diff for excluded multi-module contracts, feature-branch refs, version bumps, and lockfile changes.
  spec:       `docs/staging/specs/2026-07-28-integrate-non-multi-module.md`
