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

function toPosix(p) {
  if (!p) return p;
  if (os.platform() === 'win32') {
    const match = p.match(/^([a-zA-Z]):[\\/](.*)/);
    if (match) {
      return `/mnt/${match[1].toLowerCase()}/${match[2].replace(/\\/g, '/')}`;
    }
    return p.replace(/\\/g, '/');
  }
  return p;
}

function run({ env = {}, stdin = '', clear = [] } = {}) {
  const base = { ...process.env, ...env };
  for (const k of clear) delete base[k];
  if (os.platform() === 'win32') {
    base.WSLENV = 'CLAUDE_PLUGIN_ROOT/p:PLUGIN_ROOT/p:COPILOT_CLI';
  }
  return spawnSync('bash', ['./hooks/session-start'], {
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
  const res = spawnSync('bash', ['./hooks/session-start'], {
    cwd: tmp,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: toPosix(tmp) },
    input: JSON.stringify({ source: 'startup' }),
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, res.stderr);
  JSON.parse(res.stdout);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
});

test('missing skill file: valid empty/full-safe JSON', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-hook-miss-'));
  const hooksDir = path.join(tmp, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(hook, path.join(hooksDir, 'session-start'));
  fs.chmodSync(path.join(hooksDir, 'session-start'), 0o755);
  const res = spawnSync('bash', ['./hooks/session-start'], {
    cwd: tmp,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: toPosix(tmp) },
    input: JSON.stringify({ source: 'startup' }),
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, res.stderr);
  const j = JSON.parse(res.stdout);
  assert.equal(j.hookSpecificOutput.additionalContext, '');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
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

test('json_escape falls back to node and pure-Bash when python3/python fail with control chars', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-hook-fallback-'));
  try {
    const skills = path.join(tmp, 'skills', 'using-praxis');
    fs.mkdirSync(skills, { recursive: true });
    fs.writeFileSync(path.join(skills, 'SKILL.md'), '---\nname: x\n---\n# X\n"quote"\t\u0007bell\u001b[31mred\n');
    const hooksDir = path.join(tmp, 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    fs.copyFileSync(hook, path.join(hooksDir, 'session-start'));
    fs.chmodSync(path.join(hooksDir, 'session-start'), 0o755);

    // 1. Test node fallback tier: python3 & python fail (exit 49), fake node succeeds via json_escape marker
    const fakeNodeBin = path.join(tmp, 'fake-node-bin');
    fs.mkdirSync(fakeNodeBin, { recursive: true });
    for (const bin of ['python3', 'python']) {
      const stub = path.join(fakeNodeBin, bin);
      fs.writeFileSync(stub, '#!/usr/bin/env bash\nexit 49\n');
      fs.chmodSync(stub, 0o755);
    }
    const nodeStub = path.join(fakeNodeBin, 'node');
    fs.writeFileSync(
      nodeStub,
      '#!/usr/bin/env bash\nprintf "%s" "NODE_TIER_ESCAPED"\n',
    );
    fs.chmodSync(nodeStub, 0o755);

    const resNode = spawnSync(
      'bash',
      ['-c', `PATH="${toPosix(fakeNodeBin)}:$PATH" ./hooks/session-start`],
      {
        cwd: tmp,
        env: { ...process.env, CLAUDE_PLUGIN_ROOT: toPosix(tmp) },
        input: JSON.stringify({ source: 'startup' }),
        encoding: 'utf8',
      },
    );
    assert.equal(resNode.status, 0, resNode.stderr);
    const parsedNode = JSON.parse(resNode.stdout);
    assert.equal(parsedNode.hookSpecificOutput.additionalContext, 'NODE_TIER_ESCAPED');

    // 2. Test pure-Bash fallback tier: python3, python, and node all fail (exit 49)
    const fakeBin = path.join(tmp, 'fake-bin');
    fs.mkdirSync(fakeBin, { recursive: true });
    for (const bin of ['python3', 'python', 'node']) {
      const stub = path.join(fakeBin, bin);
      fs.writeFileSync(stub, '#!/usr/bin/env bash\nexit 49\n');
      fs.chmodSync(stub, 0o755);
    }

    const res = spawnSync(
      'bash',
      ['-c', `PATH="${toPosix(fakeBin)}:$PATH" ./hooks/session-start`],
      {
        cwd: tmp,
        env: { ...process.env, CLAUDE_PLUGIN_ROOT: toPosix(tmp) },
        input: JSON.stringify({ source: 'startup' }),
        encoding: 'utf8',
      },
    );
    assert.equal(res.status, 0, res.stderr);
    const parsed = JSON.parse(res.stdout);
    assert.match(parsed.hookSpecificOutput.additionalContext, /"quote"/);
    assert.match(parsed.hookSpecificOutput.additionalContext, /bell/);
    assert.equal(parsed.hookSpecificOutput.additionalContext.includes('\u0007'), false);
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
});

test('build_full_content resolves Windows drive paths and falls back to script-relative SKILL.md', () => {
  // 1. Raw Windows drive path passed via WSLENV without /p so bash sees C:\... directly
  const winDriveRoot = root.replace(/\//g, '\\');
  const resDrive = spawnSync('bash', ['./hooks/session-start'], {
    cwd: root,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: winDriveRoot, WSLENV: 'CLAUDE_PLUGIN_ROOT' },
    input: JSON.stringify({ source: 'startup' }),
    encoding: 'utf8',
  });
  assert.equal(resDrive.status, 0, resDrive.stderr);
  const jDrive = JSON.parse(resDrive.stdout);
  assert.match(jDrive.hookSpecificOutput.additionalContext, /You have Praxis/);

  // 2. Non-drive missing CLAUDE_PLUGIN_ROOT falls back to script-relative ../skills/using-praxis/SKILL.md
  const resFallback = run({
    env: { CLAUDE_PLUGIN_ROOT: '/nonexistent/praxis-root-path' },
    stdin: JSON.stringify({ source: 'startup' }),
    clear: ['COPILOT_CLI', 'PLUGIN_ROOT'],
  });
  assert.equal(resFallback.status, 0, resFallback.stderr);
  const jFallback = JSON.parse(resFallback.stdout);
  assert.match(jFallback.hookSpecificOutput.additionalContext, /You have Praxis/);
});

test('bin/praxis.js exits with non-zero status code 1 on invalid CLI args', () => {
  const res = spawnSync(process.execPath, [path.join(root, 'bin/praxis.js'), 'install', '--bogus'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /Unknown option: --bogus/);
});
