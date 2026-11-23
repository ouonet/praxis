# onboard

The `onboard` skill documents an unfamiliar existing repository by producing factual living documentation (`docs/tech-spec.md` and optional `docs/specs/*.md`) without making code changes, plans, or speculative gap analysis.

## Steps

1. **Explore**: Inspect entry points, public interfaces, dependencies, test patterns, and file layout directly from code.
2. **Clarify**: Ask the user whenever architecture or intent is ambiguous rather than guessing.
3. **Write `docs/tech-spec.md`**: Record atemporal current ground truth using canonical declarative fields (`purpose`, `user`, `use-case`, `architecture`, `stack`, `entry`, `contract`, `flow`, `invariant`, `constraint`, `convention`), omitting `milestone`. Split subsystems exceeding 15 lines into `docs/specs/<topic>.md` and keep sentences concise (≤25 words).
4. **Confirm**: Review the recorded living documentation with the user.

## Completion Gate

`<gate>`
`docs/tech-spec.md` must define `stack`, at least one `contract`, and a code-verified `convention` covering the quality baseline ([Quality Standard](./quality)) before completing `onboard`.
`</gate>`
