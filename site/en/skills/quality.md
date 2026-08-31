# Quality Standard Protocol

The Quality Standard (`skills/references/quality.md`) defines the explicit quality bar enforced across `tdd`, `review`, `ship`, `archive`, and `onboard`.

## Three-Dimensional Quality Bar

Every implementation and refactor cycle must be verified across four key dimensions:

### 1. Mechanical Checks
- Linting rules pass cleanly with zero warnings.
- Formatting conforms to project configuration.
- Type checking passes cleanly without `any` escape hatches or suppressed type errors.

### 2. Convention Adherence
- Adheres to project-specific and stack best practices declared in the spec (`convention:`).
- Evaluates idiomatic structure, error handling patterns, and naming standards.

### 3. Design & Boundaries Assessment
- **Inward Dependencies**: Core business logic never imports volatile I/O, UI, or DB adapters.
- **Isolated Side-Effects**: Pure computations and decision logic are separated from I/O and state mutations.
- **Cohesion & Simplicity**: Single responsibility per function/module; avoids bloated functions or leaky abstractions.

### 4. Documentation Coverage
- All public functions, API endpoints, exported interfaces, environment variables, and failure modes are accurately documented.
- `README.md` commands and examples remain runnable and up to date.
- Code changes without doc updates fail review.
