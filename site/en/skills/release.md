# release

The `release` skill handles semantic versioning, changelog finalization, annotated git tags, and publishing only when explicitly requested by the user.

For `topology=multi-module`, release only the exact coordinator revision set that passed integration, honoring dependency order across repositories. Completion of a change set never authorizes a release on its own.

## Release Sequence

1. Confirm target semantic version bump (`MAJOR.MINOR.PATCH`).
2. Verify tests are green and the working tree is clean.
3. Update version manifests consistently from the single source of truth.
4. Move `CHANGELOG.md` `Unreleased` items into `<version> - <date>` and restore a fresh `Unreleased` heading.

`<gate>`
Steps 5–7 modify shared or irreversible state. Obtain explicit user confirmation before **each** step individually — never chain commit, tag, and push/publish on a single approval:
`</gate>`

5. Commit release edits.
6. Create an annotated git tag (`v<version>`).
7. Push commits/tags or publish packages.
