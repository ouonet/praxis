# archive

The `archive` skill is executed at ship time to merge active staging specifications into living documentation and maintain project records.

## Responsibilities

1. **Living Document Sync**: Merges `docs/staging/specs/YYYY-MM-DD-<topic>.md` into `docs/tech-spec.md` (or split sub-specs in `docs/specs/`).
2. **Staging Cleanup**: Deletes staging spec and plan files once changes are verified and merged.
3. **Decision Records**: Saves persistent knowledge artifacts or architectural decisions to `docs/decisions/`.
4. **Roadmap & Changelog**: Updates `docs/ROADMAP.md` milestone status (`[x]`) and records version history in `CHANGELOG.md`.

## Workflow Gate

`<gate>`
Staging spec must reflect actual code behavior before archiving. Living documentation updates must strictly follow canonical field formats (`purpose`, `user`, `use-case`, `architecture`, `stack`, `entry`, `contract`, `flow`, `invariant`, `constraint`, `convention`).
`</gate>`
