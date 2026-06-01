# Best Practices

## Specs

**Write declaratively, not narratively.** Use sections like `contract:`, `invariant:`, `test:`, `failure:`, not numbered steps or prose. The agent reads fast and follows precise declarations.

**Close only decisions that affect implementation.** Before handing off to `plan`, resolve: contract, data shape, failure modes, and test criteria. Leave philosophical debates and "nice-to-haves" in `deferred` or `Working notes`.

**Reference code by path, never paste it.** Specs are decisions about what to build, not walkthroughs of how.

## Plans

**Tasks are 30-60 minutes each.** Atomic enough that the agent can reason about them. Too large and you lose visibility; too small and overhead kills momentum.

**Acceptance is executable.** Every task's acceptance condition must be something a CI/human can verify: a test name, a command, or a script. Not vague, not aspirational.

**Mark `[parallel]` only when truly independent.** Shared state, error handling, or contracts that aren't closed → tasks aren't parallel. Overmarking leads to broken merges.

## Git workflow

**One commit per RED-GREEN-refactor cycle.** Pushes your thinking into the history. Helps with debugging later.

**Sync docs after each cycle.** Right before commit. If you wait, you'll forget what you changed and why.

**Use descriptive branch names.** `feat/oauth-github`, not `feature1`. Helps you navigate when you have multiple worktrees.

## Large projects

**Use roadmap when ≥3 milestones.** Don't try to plan them all upfront. `plan` only the current one, update stubs as you learn.

**Mark current milestone clearly.** `← plan in detail now` on M1 signals intent. Move the marker after ship, before planning M2.

**Expect to revise milestones after M1.** First milestone teaches you what the rest will cost. That's the point.

## Debugging

**Isolate first, hypothesize second.** Narrow to the smallest repro. Cut code until symptom disappears. Only then ask "why."

**Change one variable at a time.** Parallel hypotheses are tempting but make it hard to know which change fixed it.

## Tests

**Test the contract, not the implementation.** If the contract says "returns 200 on success," test that. Not "calls X function" or "reads from database Y."

**No mocks of internals.** Mock external boundaries: HTTP, DB, filesystem. Mock your own code only if the real version is slow or nondeterministic.

## When to abandon

**If assumptions change materially, stop.** Don't power through if the problem you're solving isn't the problem anymore. Record reason and learnings in working notes, then stop — no spec, no plan, no ship.

**If a milestone's goal shifts ≥50%, return to design.** Don't extend the plan. Acknowledge the new direction and restart.

## Documentation sync

**Living docs are facts, staging docs are drafts.** After `ship`, spec moves to living docs. Tests and comments in code stay current with both.

**README is the first spec.** If it doesn't match the code, PRs fail review. Same rule applies to all public contracts.
