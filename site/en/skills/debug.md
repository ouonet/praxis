# debug

The `debug` skill isolates and resolves bugs, regressions, and unexpected failures from deterministic root causes rather than guesswork.

In `topology=multi-module` changes, investigate read-only across participating repositories, implement fixes only inside the task's registered module repository, and defer linked commits until coordinator integration passes ([Multi-Module Protocol](./multi-module)).

## Process

1. **Reproduce**: Establish a minimal deterministic reproduction first. No reproduction → no fix.
2. **Root-cause**: Ask "why" repeatedly until one root cause explains *all* observed symptoms. Change one variable at a time; if three hypotheses fail, stop and re-read from scratch.
3. **Fix with TDD**: Write a failing regression test first (RED), fix at the root (GREEN), and verify the full test suite passes.

Done = deterministic repro + failing-then-passing regression test + root cause named + green suite.
