---
name: tdd
when: implementing or fixing production code
---
# TDD

**No production code without a failing test first.** Wrote code before the test? Delete it. Rewrite from the test.

RED → run, see it fail for the *right reason* → GREEN (minimum) → all tests green → refactor → commit.

## Don't
- Test passes without the impl (tests nothing).
- Mock the unit under test (tests the mock).
- Assert many behaviors in one test (split).
- Skip "watch it fail" (you don't know what it tests).
- Edit the test to match buggy code (tests the bug).

Exception — ask user: prototypes, generated code, throwaway scripts.
