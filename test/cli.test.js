import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { resolveHost, HOSTS } from '../src/cli/hosts.js';
import { runCli } from '../src/cli/index.js';
import { installHost, uninstallHost, updateHost, getHostStatus, normalizeScope } from '../src/cli/installer.js';

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

  code = await runCli(['-v']);
  assert.equal(code, 0);

  code = await runCli(['version']);
  assert.equal(code, 0);

  code = await runCli(['v']);
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

test('uninstallHost is non-destructive to user files in .agents', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-nondestructive-'));
  try {
    // 1. User has custom rules, custom skills, and AGENTS.md in .agents
    const agentsDir = path.join(tmpDir, '.agents');
    fs.mkdirSync(path.join(agentsDir, 'rules'), { recursive: true });
    fs.writeFileSync(path.join(agentsDir, 'rules', 'my-rule.md'), '# My Custom Rule');
    fs.mkdirSync(path.join(agentsDir, 'skills', 'my-custom-skill'), { recursive: true });
    fs.writeFileSync(path.join(agentsDir, 'skills', 'my-custom-skill', 'SKILL.md'), '# My Skill');
    fs.writeFileSync(path.join(agentsDir, 'AGENTS.md'), '# Agents config');

    // 2. Install Praxis in project scope
    installHost(HOSTS.agents, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });

    // Verify both Praxis and user files exist
    assert.equal(fs.existsSync(path.join(agentsDir, 'skills', 'using-praxis', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(agentsDir, 'rules', 'my-rule.md')), true);
    assert.equal(fs.existsSync(path.join(agentsDir, 'skills', 'my-custom-skill', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(agentsDir, 'AGENTS.md')), true);

    // 3. Uninstall Praxis from agents
    uninstallHost(HOSTS.agents, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });

    // 4. Assert Praxis skills are removed, BUT user files remain 100% intact!
    assert.equal(fs.existsSync(path.join(agentsDir, 'skills', 'using-praxis')), false);
    assert.equal(fs.existsSync(path.join(agentsDir, 'rules', 'my-rule.md')), true);
    assert.equal(fs.existsSync(path.join(agentsDir, 'skills', 'my-custom-skill', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(agentsDir, 'AGENTS.md')), true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('uninstallHost gracefully skips when no scope is installed', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-skip-test-'));
  try {
    const ok = uninstallHost(HOSTS.copilot, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });
    assert.equal(ok, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('normalizeScope always defaults to user regardless of directory', () => {
  const home = os.homedir();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-scope-test-'));
  try {
    assert.equal(normalizeScope(undefined, home), 'user');
    assert.equal(normalizeScope(null, home), 'user');
    assert.equal(normalizeScope('', home), 'user');

    assert.equal(normalizeScope(undefined, tmpDir), 'user');
    assert.equal(normalizeScope(null, tmpDir), 'user');
    assert.equal(normalizeScope('', tmpDir), 'user');

    assert.equal(normalizeScope('user', tmpDir), 'user');
    assert.equal(normalizeScope('global', tmpDir), 'user');
    assert.equal(normalizeScope('project', tmpDir), 'project');
    assert.equal(normalizeScope('local', tmpDir), 'local');
    assert.equal(normalizeScope('workspace', tmpDir), 'project');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('installHost, uninstallHost, and updateHost in non-home directory default to user scope', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-scope-default-'));
  try {
    const host = HOSTS.antigravity;

    // When scope is not provided, dryRun should show User target path
    const installOk = installHost(host, {
      dryRun: true,
      rootDir: tmpDir,
    });
    assert.equal(installOk, true);

    const updateOk = updateHost(host, {
      dryRun: true,
      rootDir: tmpDir,
    });
    assert.equal(updateOk, true);

    const uninstallOk = uninstallHost(host, {
      dryRun: true,
      rootDir: tmpDir,
    });
    assert.equal(uninstallOk, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('installHost and uninstallHost for antigravity across project and local scopes', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-antigravity-'));
  try {
    const host = HOSTS.antigravity;

    // 1. Install project scope
    installHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });

    const pluginDir = path.join(tmpDir, '.agents', 'plugins', 'praxis');
    assert.equal(fs.existsSync(path.join(pluginDir, 'skills', 'using-praxis', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(pluginDir, 'rules', 'praxis.md')), true);
    assert.equal(fs.existsSync(path.join(pluginDir, 'plugin.json')), true);

    const status = getHostStatus(host, tmpDir);
    assert.equal(status.projectInstalled, true);
    assert.equal(status.localInstalled, true);

    // 2. Update project scope
    updateHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });
    assert.equal(fs.existsSync(path.join(pluginDir, 'rules', 'praxis.md')), true);

    // 3. Uninstall
    uninstallHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      method: 'file',
    });

    const afterStatus = getHostStatus(host, tmpDir);
    assert.equal(afterStatus.projectInstalled, false);
    assert.equal(afterStatus.localInstalled, false);
    assert.equal(fs.existsSync(pluginDir), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});





