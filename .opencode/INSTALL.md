# Praxis on OpenCode

OpenCode runs `hooks/session-start.sh` at session start. The hook injects `bootstrap.md` as `additionalContext`. After install, send the agent any coding task — it will load `triage` first.

## Install
1. Clone or copy this repo somewhere stable.
2. Point OpenCode at `.opencode/config.json`.
3. Verify: start a fresh session, ask "fix a typo in README" — agent should output `praxis: scope=trivial, loading=` and just do it.
