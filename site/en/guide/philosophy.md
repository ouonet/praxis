# Philosophy

## Intent, not instruction

Tell the agent what to achieve and what done looks like. Let it decide how to do it.

Step-by-step recipes become obsolete as agents get smarter. Declarations of intent stay relevant — they encode *what matters*, not *how to get there*.

## Pay for discipline only when it pays back

Triage decides. A typo fix doesn't need a spec. A new system does. Praxis applies overhead proportional to complexity.

| Task | Praxis cost |
|------|-------------|
| Fix a typo | ~450 tokens (bootstrap only) |
| Standard feature (design→ship) | ~1,300 tokens |
| Complex task (all skills) | ~2,900 tokens |

## Skills are short

If a rule needs 3,000 tokens to express, it's probably not a rule — it's a manual. Praxis skills average ~230 tokens each.

Short skills mean agents read them fully, follow them reliably, and the framework stays maintainable as AI capabilities evolve.

## Specs are facts, not plans

A spec is a list of decisions: contracts, invariants, failure modes, test criteria. No narrative, no rationale, no step-by-step. Plans are separate, and they're milestone stubs — not scripts.

The agent brings domain knowledge. Praxis provides structure for what needs to be decided, not instructions for how to decide it.
