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

### 3. Design Assessment
- **Coupling & Cohesion**: Functions and classes have high cohesion and minimal coupling.
- **Abstraction Level**: Prevents premature or unnecessary abstractions; implementation is as simple as possible while fulfilling the contract.

### 4. Documentation Coverage
- All public functions, API endpoints, exported interfaces, environment variables, and failure modes are accurately documented.
- `README.md` commands and examples remain runnable and up to date.
- Code changes without doc updates fail review.
