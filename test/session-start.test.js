import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const hook = path.join(root, 'hooks', 'session-start');

function run({ env = {}, stdin = '', clear = [] } = {}) {
  const base = { ...process.env, ...env };
  for (const k of clear) delete base[k];
  return spawnSync('bash', [hook], {
    cwd: root,
    env: base,
    input: stdin,
    encoding: 'utf8',
  });
}

test('Claude startup: full nested bootstrap', () => {
  const res = run({
    env: { CLAUDE_PLUGIN_ROOT: root },
    stdin: JSON.stringify({ source: 'startup', hook_event_name: 'SessionStart' }),
    clear: ['COPILOT_CLI', 'PLUGIN_ROOT'],
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  const ctx = j.hookSpecificOutput.additionalContext;
  assert.match(ctx, /You have Praxis/);
  assert.match(ctx, /Triage|using-praxis|scope=/i);
  assert.equal(ctx.includes('after context compaction'), false);
});

test('Claude compact: brief reminder only', () => {
  const res = run({
    env: { CLAUDE_PLUGIN_ROOT: root },
    stdin: JSON.stringify({ source: 'compact', hook_event_name: 'SessionStart' }),
    clear: ['COPILOT_CLI', 'PLUGIN_ROOT'],
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  const ctx = j.hookSpecificOutput.additionalContext;
  assert.match(ctx, /after context compaction/);
  assert.equal(ctx.includes('| vague |'), false);
  assert.ok(ctx.length < 1200, `brief should be short, got ${ctx.length}`);
});

test('Claude clear: full bootstrap again', () => {
  const res = run({
    env: { CLAUDE_PLUGIN_ROOT: root },
    stdin: JSON.stringify({ source: 'clear' }),
    clear: ['COPILOT_CLI', 'PLUGIN_ROOT'],
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.match(j.hookSpecificOutput.additionalContext, /You have Praxis/);
  assert.equal(j.hookSpecificOutput.additionalContext.includes('after context compaction'), false);
});

test('Codex PLUGIN_ROOT compact brief', () => {
  const res = run({
    env: { PLUGIN_ROOT: root },
    stdin: JSON.stringify({ source: 'compact', hook_event_name: 'SessionStart' }),
    clear: ['CLAUDE_PLUGIN_ROOT', 'COPILOT_CLI'],
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.match(j.hookSpecificOutput.additionalContext, /compaction/);
});

test('Copilot flat additionalContext on startup', () => {
  const res = run({
    env: { COPILOT_CLI: '1' },
    stdin: JSON.stringify({ source: 'startup' }),
    clear: ['CLAUDE_PLUGIN_ROOT', 'PLUGIN_ROOT'],
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.ok(j.additionalContext);
  assert.equal('hookSpecificOutput' in j, false);
  assert.match(j.additionalContext, /You have Praxis/);
});

test('Gemini path: empty context (contextFileName owns bootstrap)', () => {
  const res = run({
    stdin: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup' }),
    clear: ['CLAUDE_PLUGIN_ROOT', 'PLUGIN_ROOT', 'COPILOT_CLI'],
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.equal(j.hookSpecificOutput.additionalContext, '');
});

test('control characters still JSON-safe', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-hook-'));
  const skills = path.join(tmp, 'skills', 'using-praxis');
  fs.mkdirSync(skills, { recursive: true });
  fs.writeFileSync(path.join(skills, 'SKILL.md'), '---\nname: x\n---\n# X\n\u0007bell\n');
  const hooksDir = path.join(tmp, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(hook, path.join(hooksDir, 'session-start'));
  fs.chmodSync(path.join(hooksDir, 'session-start'), 0o755);
  const res = spawnSync('bash', [path.join(hooksDir, 'session-start')], {
    cwd: tmp,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: tmp },
    input: JSON.stringify({ source: 'startup' }),
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, res.stderr);
  JSON.parse(res.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('missing skill file: valid empty/full-safe JSON', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-hook-miss-'));
  const hooksDir = path.join(tmp, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(hook, path.join(hooksDir, 'session-start'));
  fs.chmodSync(path.join(hooksDir, 'session-start'), 0o755);
  const res = spawnSync('bash', [path.join(hooksDir, 'session-start')], {
    cwd: tmp,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: tmp },
    input: JSON.stringify({ source: 'startup' }),
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.equal(j.hookSpecificOutput.additionalContext, '');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('hooks matchers include documented SessionStart sources', () => {
  const claude = JSON.parse(fs.readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
  const m = claude.hooks.SessionStart[0].matcher;
  for (const s of ['startup', 'resume', 'clear', 'compact', 'fork']) {
    assert.match(m, new RegExp(s));
  }
  const codex = JSON.parse(fs.readFileSync(path.join(root, 'hooks/codex-hooks.json'), 'utf8'));
  const cm = codex.hooks.SessionStart[0].matcher;
  assert.match(cm, /startup/);
  assert.match(cm, /compact/);
  assert.equal(cm.includes('.*'), false);
});
