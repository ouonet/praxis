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

function runHook(env = {}, stdin = '') {
  const res = spawnSync('bash', [hook], {
    cwd: root,
    env: { ...process.env, ...env },
    input: stdin,
    encoding: 'utf8',
  });
  return res;
}

test('session-start emits parseable Claude-shaped JSON', () => {
  const res = runHook({ CLAUDE_PLUGIN_ROOT: root });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.ok(j.hookSpecificOutput?.additionalContext?.includes('You have Praxis'));
  assert.ok(j.hookSpecificOutput.additionalContext.includes('using-praxis') || j.hookSpecificOutput.additionalContext.includes('Triage'));
  assert.equal(j.hookSpecificOutput.additionalContext.includes('Skill tool in Claude Code'), false);
});

test('session-start emits parseable Copilot-shaped JSON', () => {
  const res = runHook({ COPILOT_CLI: '1', CLAUDE_PLUGIN_ROOT: '' });
  // Clear CLAUDE if set empty string still counts as set — unset explicitly
  const res2 = spawnSync('bash', [hook], {
    cwd: root,
    env: Object.fromEntries(Object.entries({ ...process.env, COPILOT_CLI: '1' }).filter(([k]) => k !== 'CLAUDE_PLUGIN_ROOT')),
    encoding: 'utf8',
  });
  assert.equal(res2.status, 0, res2.stderr);
  const j = JSON.parse(res2.stdout);
  assert.ok(j.additionalContext);
  assert.equal('hookSpecificOutput' in j, false);
});

test('session-start Gemini stdin shape', () => {
  const res = spawnSync('bash', [hook], {
    cwd: root,
    env: Object.fromEntries(Object.entries({ ...process.env }).filter(([k]) => k !== 'CLAUDE_PLUGIN_ROOT' && k !== 'COPILOT_CLI')),
    input: '{"hook_event_name":"SessionStart"}',
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.ok(j.additionalContext);
});

test('json_escape handles control characters via hook content path', () => {
  // Build a temp praxis root with a skill containing control chars
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-hook-'));
  const skills = path.join(tmp, 'skills', 'using-praxis');
  fs.mkdirSync(skills, { recursive: true });
  fs.writeFileSync(
    path.join(skills, 'SKILL.md'),
    '---\nname: using-praxis\ndescription: t\n---\n# X\nline\u0001with\u0007bell\n',
  );
  const hooksDir = path.join(tmp, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(hook, path.join(hooksDir, 'session-start'));
  fs.chmodSync(path.join(hooksDir, 'session-start'), 0o755);
  const res = spawnSync('bash', [path.join(hooksDir, 'session-start')], {
    cwd: tmp,
    env: Object.fromEntries(Object.entries({ ...process.env, CLAUDE_PLUGIN_ROOT: tmp }).filter(([k]) => k !== 'COPILOT_CLI')),
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.ok(j.hookSpecificOutput.additionalContext.includes('line'));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('missing skill file still emits valid JSON', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-hook-miss-'));
  const hooksDir = path.join(tmp, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(hook, path.join(hooksDir, 'session-start'));
  fs.chmodSync(path.join(hooksDir, 'session-start'), 0o755);
  const res = spawnSync('bash', [path.join(hooksDir, 'session-start')], {
    cwd: tmp,
    env: Object.fromEntries(Object.entries({ ...process.env, CLAUDE_PLUGIN_ROOT: tmp }).filter(([k]) => k !== 'COPILOT_CLI')),
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.equal(j.hookSpecificOutput.additionalContext, '');
  fs.rmSync(tmp, { recursive: true, force: true });
});
