#!/usr/bin/env bash
# Praxis SessionStart hook — injects bootstrap.md into agent context.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PRAXIS_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Substitute {{PRAXIS_ROOT}} with the actual absolute path so agent can read skill files.
content=$(sed "s|{{PRAXIS_ROOT}}|${PRAXIS_ROOT}|g" "${PRAXIS_ROOT}/bootstrap.md")

# JSON-escape
escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}
payload=$(escape "$content")

# Emit per-harness JSON shape.
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -z "${COPILOT_CLI:-}" ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$payload"
else
  # Copilot CLI, OpenCode, Codex, generic SDK
  printf '{"additionalContext":"%s"}\n' "$payload"
fi
