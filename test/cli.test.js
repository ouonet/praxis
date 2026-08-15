import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { resolveHost, HOSTS } from '../src/cli/hosts.js';
import { runCli } from '../src/cli/index.js';
import { installHost, uninstallHost, updateHost, getHostStatus } from '../src/cli/installer.js';

test('resolveHost resolves host names and aliases', () => {
  assert.equal(resolveHost('codex')?.id, 'codex');
  assert.equal(resolveHost('claude')?.id, 'claude');
  assert.equal(resolveHost('claudecode')?.id, 'claude');
  assert.equal(resolveHost('agy')?.id, 'antigravity');
  assert.equal(resolveHost('generic')?.id, 'agents');
  assert.equal(resolveHost('omp')?.id, 'omp');
  assert.equal(resolveHost('oh-my-pi')?.id, 'omp');
  assert.equal(resolveHost('nonexistent'), null);
});

test('runCli prints version and help', async () => {
  let code = await runCli(['--version']);
  assert.equal(code, 0);

  code = await runCli(['help']);
  assert.equal(code, 0);
});

test('runCli status lists hosts', async () => {
  const code = await runCli(['status']);
  assert.equal(code, 0);
});

test('installHost dry-run does not write files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-test-'));
  try {
    const host = HOSTS.agents;
    const ok = installHost(host, {
      scope: 'project',
      dryRun: true,
      rootDir: tmpDir,
      method: 'file',
    });
    assert.equal(ok, true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents')), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('installHost, status, update, and uninstall in temp directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-test-'));
  try {
    const host = HOSTS.agents;

    // Initial status check
    let status = getHostStatus(host, tmpDir);
    assert.equal(status.projectInstalled, false);

    // Install
    installHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });

    status = getHostStatus(host, tmpDir);
    assert.equal(status.projectInstalled, true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'using-praxis', 'SKILL.md')), true);

    // Update
    updateHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'using-praxis', 'SKILL.md')), true);

    // Uninstall
    uninstallHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });

    status = getHostStatus(host, tmpDir);
    assert.equal(status.projectInstalled, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('installHost for codex and opencode in temp directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-test-'));
  try {
    // Install codex (local/project)
    installHost(HOSTS.codex, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });
    assert.equal(fs.existsSync(path.join(tmpDir, '.codex', 'plugins', 'praxis', 'skills')), true);

    // Install opencode (project)
    installHost(HOSTS.opencode, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });
    assert.equal(fs.existsSync(path.join(tmpDir, 'opencode.json')), true);
    const opencodeCfg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'opencode.json'), 'utf8'));
    assert.ok(opencodeCfg.plugin.includes('praxis@git+https://github.com/ouonet/praxis.git'));

    // Status check in project directory
    const opencodeStatus = getHostStatus(HOSTS.opencode, tmpDir);
    assert.equal(opencodeStatus.projectInstalled, true);
    assert.equal(opencodeStatus.localInstalled, true);
    assert.equal(opencodeStatus.isHome, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('local scope does not modify project manifest for opencode', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-local-test-'));
  try {
    installHost(HOSTS.opencode, {
      scope: 'local',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });
    assert.equal(fs.existsSync(path.join(tmpDir, '.opencode', 'plugins', 'praxis.js')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'opencode.json')), false);

    const status = getHostStatus(HOSTS.opencode, tmpDir);
    assert.equal(status.localInstalled, true);
    assert.equal(status.projectInstalled, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('home directory status marks project/local as false / not in project', () => {
  const home = os.homedir();
  const status = getHostStatus(HOSTS.agents, home);
  assert.equal(status.isHome, true);
  assert.equal(status.projectInstalled, false);
  assert.equal(status.localInstalled, false);
});

