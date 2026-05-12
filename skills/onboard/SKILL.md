---
name: onboard
description: Use when taking over an existing codebase that has no docs/tech-spec.md. Produces a factual record of what already exists.
---
# Onboard

Goal: read the codebase, produce `docs/tech-spec.md`. No code changes. No plans. No gap analysis.

## Steps

1. **Explore** entry points, public interfaces, key dependencies, test patterns, file structure. Read, don't guess.
2. **Ask** about anything ambiguous — never invent architecture.
3. **Write** `docs/tech-spec.md` using declarations only (no narrative):

```
stack:       <language, runtime, frameworks, key deps>
entry:       <where execution starts>
contract:    <public APIs / interfaces that must not break>
convention:  <naming, file structure, test patterns>
invariant:   <what must always hold>
constraint:  <limits, warnings from code or README>
```

   If details are bulky, split into `docs/tech-specs/` and link.

4. **Confirm** with user.

<gate>`docs/tech-spec.md` must contain: `stack` + at least one `contract` + at least one `convention` before done.</gate>

## Don't
- Invent facts not found in code or README.
- Add gap analysis, plans, or code changes.
- Paste large code blocks — reference by path.

## After
`docs/tech-spec.md` on disk → user continues with normal `design → plan → tdd`.
