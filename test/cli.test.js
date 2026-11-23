import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { resolveHost, HOSTS, formatCommandStep } from '../src/cli/hosts.js';
import { runCli, parseArgs } from '../src/cli/index.js';
import {
  installHost,
  uninstallHost,
  updateHost,
  getHostStatus,
  normalizeScope,
  normalizeMethod,
  validateRef,
  supportsRef,
  stripPraxisCodexToml,
  copyOrLink,
  copyPluginFiles,
  isPraxisPluginEntry,
  isPraxisManagedRuleFile,
  copyManagedRuleFile,
  hasPraxisCodexToml,
  hasPraxisOpencodeConfigText,
  hasPraxisPiSettingsText,
  PLUGIN_ITEMS_TO_COPY,
  HOST_ADAPTERS,
  getHostAdapter,
  derivePraxisSkillNames,
  DEFAULT_PRAXIS_SKILL_NAMES,
  PRAXIS_SKILL_NAMES,
  resolveBinaryAvailable,
  diagnoseHost,
  diagnoseHosts,
  validateTomlBasic,
  isDanglingSymlink,
} from '../src/cli/installer.js';

test('resolveHost resolves host names and aliases', () => {
  assert.equal(resolveHost('codex')?.id, 'codex');
  assert.equal(resolveHost('claude')?.id, 'claude');
  assert.equal(resolveHost('claudecode')?.id, 'claude');
  assert.equal(resolveHost('agy')?.id, 'antigravity');
  assert.equal(resolveHost('generic')?.id, 'agents');
  assert.equal(resolveHost('omp')?.id, 'omp');
  assert.equal(resolveHost('oh-my-pi')?.id, 'omp');
  assert.equal(resolveHost('grok')?.id, 'grok');
  assert.equal(resolveHost('grok-cli')?.id, 'grok');
  assert.equal(resolveHost('xai-grok')?.id, 'grok');
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
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-status-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-status-home-'));
  try {
    const code = await runCli(['status'], { rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false });
    assert.equal(code, 0);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('installHost dry-run does not write files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-test-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
  try {
    const host = HOSTS.agents;
    const ok = installHost(host, {
      scope: 'project',
      dryRun: true,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });
    assert.equal(ok, true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents')), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('installHost, status, update, and uninstall in temp directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-test-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
  const statusOpts = { homeDir: tmpHome, checkBinary: () => false };
  try {
    const host = HOSTS.agents;

    // Initial status check
    let status = getHostStatus(host, tmpDir, statusOpts);
    assert.equal(status.projectInstalled, false);

    // Install
    installHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });

    status = getHostStatus(host, tmpDir, statusOpts);
    assert.equal(status.projectInstalled, true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'using-praxis', 'SKILL.md')), true);

    // Update
    updateHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'using-praxis', 'SKILL.md')), true);

    // Uninstall
    uninstallHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });

    status = getHostStatus(host, tmpDir, statusOpts);
    assert.equal(status.projectInstalled, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('installHost for codex and opencode in temp directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-test-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
  try {
    // Install codex (local/project)
    installHost(HOSTS.codex, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });
    assert.equal(fs.existsSync(path.join(tmpDir, '.codex', 'plugins', 'praxis', 'skills')), true);

    // Install opencode (project, auto) — writes opencode.json only without duplicating .opencode/
    installHost(HOSTS.opencode, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'auto',
      checkBinary: () => false,
    });
    assert.equal(fs.existsSync(path.join(tmpDir, 'opencode.json')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.opencode', 'plugins', 'praxis.js')), false);
    const opencodeCfg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'opencode.json'), 'utf8'));
    assert.ok(opencodeCfg.plugin.includes('praxis@git+https://github.com/ouonet/praxis.git'));

    // Status check in project directory
    const opencodeStatus = getHostStatus(HOSTS.opencode, tmpDir, { homeDir: tmpHome, checkBinary: () => false });
    assert.equal(opencodeStatus.projectInstalled, true);
    assert.equal(opencodeStatus.localInstalled, false);
    assert.equal(opencodeStatus.isHome, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('local scope does not modify project manifest for opencode', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-local-test-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
  try {
    installHost(HOSTS.opencode, {
      scope: 'local',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });
    assert.equal(fs.existsSync(path.join(tmpDir, '.opencode', 'plugins', 'praxis.js')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'opencode.json')), false);

    const status = getHostStatus(HOSTS.opencode, tmpDir, { homeDir: tmpHome, checkBinary: () => false });
    assert.equal(status.localInstalled, true);
    assert.equal(status.projectInstalled, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('home directory status marks project/local as false / not in project', () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-check-'));
  try {
    const status = getHostStatus(HOSTS.agents, tmpHome, { homeDir: tmpHome, checkBinary: () => false });
    assert.equal(status.isHome, true);
    assert.equal(status.projectInstalled, false);
    assert.equal(status.localInstalled, false);
  } finally {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('uninstallHost is non-destructive to user files in .agents', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-nondestructive-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
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
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
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
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });

    // 4. Assert Praxis skills are removed, BUT user files remain 100% intact!
    assert.equal(fs.existsSync(path.join(agentsDir, 'skills', 'using-praxis')), false);
    assert.equal(fs.existsSync(path.join(agentsDir, 'rules', 'my-rule.md')), true);
    assert.equal(fs.existsSync(path.join(agentsDir, 'skills', 'my-custom-skill', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(agentsDir, 'AGENTS.md')), true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('uninstallHost gracefully skips when no scope is installed', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-skip-test-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
  try {
    const ok = uninstallHost(HOSTS.copilot, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });
    assert.equal(ok, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
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
    assert.throws(() => normalizeScope('porject', tmpDir), RangeError);
    assert.throws(() => normalizeScope(123, tmpDir), RangeError);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('parseArgs, normalizeMethod, validateRef, supportsRef, and runCli validation', async () => {
  const okParsed = parseArgs(['install', '--host', 'claude', '--scope=project', '--ref', 'v4.2.11', '--method=copy', '--dry-run', '-f']);
  assert.equal(okParsed.errors.length, 0);
  assert.equal(okParsed.options.command, 'install');
  assert.equal(okParsed.options.host, 'claude');
  assert.equal(okParsed.options.scope, 'project');
  assert.equal(okParsed.options.ref, 'v4.2.11');
  assert.equal(okParsed.options.method, 'copy');
  assert.equal(okParsed.options.dryRun, true);
  assert.equal(okParsed.options.force, true);

  // Missing or flag-like values, inline = on boolean/short flags, unknown flags, extra positional args
  const bad1 = parseArgs(['install', '--host', '--dry-run']);
  assert.ok(bad1.errors.length > 0);
  assert.equal(bad1.options.dryRun, true);
  assert.equal(bad1.options.host, null);

  assert.ok(parseArgs(['install', '--host=']).errors.length > 0);
  assert.ok(parseArgs(['install', '--dry-run=true']).errors.length > 0);
  assert.ok(parseArgs(['install', '-H=claude']).errors.length > 0);
  assert.ok(parseArgs(['install', '--scope', '']).errors.length > 0);
  assert.ok(parseArgs(['install', '--bogus']).errors.length > 0);
  assert.ok(parseArgs(['install', 'extra']).errors.length > 0);

  // normalizeMethod
  assert.equal(normalizeMethod(undefined), 'auto');
  assert.equal(normalizeMethod(null), 'auto');
  assert.equal(normalizeMethod(''), 'auto');
  assert.equal(normalizeMethod('AUTO'), 'auto');
  assert.equal(normalizeMethod('native'), 'native');
  assert.equal(normalizeMethod('link'), 'link');
  assert.equal(normalizeMethod('copy'), 'copy');
  assert.throws(() => normalizeMethod('file'), RangeError);
  assert.throws(() => normalizeMethod(123), RangeError);

  // validateRef
  assert.equal(validateRef(undefined), null);
  assert.equal(validateRef(''), null);
  assert.equal(validateRef('main'), 'main');
  assert.equal(validateRef('feat/topic_1-2.0'), 'feat/topic_1-2.0');
  for (const badRef of ['main;id', 'a&&b', '$(id)', '../evil', 'a..b', 'a@{0}', 'a//b', 'foo/', 'foo.lock', '-flag', 123]) {
    assert.throws(() => validateRef(badRef), RangeError, `Expected RangeError for ref=${badRef}`);
  }

  // supportsRef matrix
  assert.equal(supportsRef(HOSTS.claude, 'install', 'user', 'auto', { binaryAvailable: true }), true);
  assert.equal(supportsRef(HOSTS.claude, 'install', 'user', 'auto', { binaryAvailable: false }), false);
  assert.equal(supportsRef(HOSTS.claude, 'update', 'user', 'native', { binaryAvailable: true }), false);
  assert.equal(supportsRef(HOSTS.pi, 'install', 'project', 'native', { binaryAvailable: true }), true);
  assert.equal(supportsRef(HOSTS.pi, 'update', 'local', 'auto', { binaryAvailable: true }), true);
  assert.equal(supportsRef(HOSTS.omp, 'update', 'user', 'auto', { binaryAvailable: true }), true);
  assert.equal(supportsRef(HOSTS.opencode, 'install', 'project', 'auto', { binaryAvailable: false }), true);
  assert.equal(supportsRef(HOSTS.opencode, 'install', 'local', 'auto', { binaryAvailable: true }), false);
  assert.equal(supportsRef(HOSTS.opencode, 'install', 'user', 'copy', { binaryAvailable: true }), false);
  assert.equal(supportsRef(HOSTS.codex, 'install', 'user', 'native', { binaryAvailable: true }), false);
  assert.equal(supportsRef(HOSTS.agents, 'install', 'user', 'auto', { binaryAvailable: false }), false);
  assert.equal(supportsRef(HOSTS.pi, 'uninstall', 'user', 'native', { binaryAvailable: true }), false);

  // runCli returns 1 on parse/validation errors even when --help or --version is passed
  const tmpCliRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-runcli-root-'));
  const tmpCliHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-runcli-home-'));
  const cliOpts = { rootDir: tmpCliRoot, homeDir: tmpCliHome, checkBinary: () => false };
  try {
    assert.equal(await runCli(['--help', '--bogus'], cliOpts), 1);
    assert.equal(await runCli(['--version', '--scope=invalid'], cliOpts), 1);
    assert.equal(await runCli(['status', '--scope', 'porject'], cliOpts), 1);
    assert.equal(await runCli(['install', '--ref', 'main;id', '--dry-run'], cliOpts), 1);
    // Upfront multi-host --ref preflight fails before mutating any host
    assert.equal(await runCli(['install', '--host', 'all', '--ref', 'main', '--dry-run'], cliOpts), 1);
    // --method native fails (returns 1) when host has no native commands
    assert.equal(await runCli(['install', '--host', 'agents', '--method', 'native', '--dry-run'], cliOpts), 1);
    // 'i' alias succeeds with auto-detection in dry-run
    assert.equal(await runCli(['i', '--dry-run'], cliOpts), 0);
  } finally {
    fs.rmSync(tmpCliRoot, { recursive: true, force: true });
    fs.rmSync(tmpCliHome, { recursive: true, force: true });
  }

  // Direct calls throw RangeError on bad scope/method/ref
  assert.throws(() => installHost(HOSTS.agents, { scope: 'porject', dryRun: true, checkBinary: () => false }), RangeError);
  assert.throws(() => updateHost(HOSTS.agents, { method: 'file', dryRun: true, checkBinary: () => false }), RangeError);
  assert.throws(() => uninstallHost(HOSTS.agents, { ref: 'a;b', dryRun: true, checkBinary: () => false }), RangeError);
});

test('installHost, uninstallHost, and updateHost in non-home directory default to user scope', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-scope-default-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
  try {
    const host = HOSTS.antigravity;

    // When scope is not provided, dryRun should show User target path
    const installOk = installHost(host, {
      dryRun: true,
      rootDir: tmpDir,
      homeDir: tmpHome,
      checkBinary: () => false,
    });
    assert.equal(installOk, true);

    const updateOk = updateHost(host, {
      dryRun: true,
      rootDir: tmpDir,
      homeDir: tmpHome,
      checkBinary: () => false,
    });
    assert.equal(updateOk, true);

    const uninstallOk = uninstallHost(host, {
      dryRun: true,
      rootDir: tmpDir,
      homeDir: tmpHome,
      checkBinary: () => false,
    });
    assert.equal(uninstallOk, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('installHost and uninstallHost for antigravity across project and local scopes', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-antigravity-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
  try {
    const host = HOSTS.antigravity;

    // 1. Install project scope
    installHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });

    const pluginDir = path.join(tmpDir, '.agents', 'plugins', 'praxis');
    assert.equal(fs.existsSync(path.join(pluginDir, 'skills', 'using-praxis', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(pluginDir, 'rules')), false, 'pluginDir excludes duplicate rules/');
    assert.equal(fs.existsSync(path.join(pluginDir, 'plugin.json')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'rules', 'praxis.md')), false, 'no duplicate praxis.md');
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'rules', 'AGENTS.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'using-praxis', 'SKILL.md')), true);

    const status = getHostStatus(host, tmpDir, { homeDir: tmpHome, checkBinary: () => false });
    assert.equal(status.projectInstalled, true);
    assert.equal(status.localInstalled, true);

    // 2. Update project scope (also cleans any legacy praxis.md)
    fs.writeFileSync(
      path.join(tmpDir, '.agents', 'rules', 'praxis.md'),
      '# Praxis Triage Rules\npraxis: scope=<x>, loading=<skills>\n',
    );
    updateHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });
    assert.equal(fs.existsSync(path.join(pluginDir, 'rules')), false);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'rules', 'praxis.md')), false);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'rules', 'AGENTS.md')), true);

    // 3. Uninstall
    uninstallHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });

    const afterStatus = getHostStatus(host, tmpDir, { homeDir: tmpHome, checkBinary: () => false });
    assert.equal(afterStatus.projectInstalled, false);
    assert.equal(afterStatus.localInstalled, false);
    assert.equal(fs.existsSync(pluginDir), false);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'rules', 'praxis.md')), false);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'rules', 'AGENTS.md')), false);
    assert.equal(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'using-praxis')), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('installHost and uninstallHost for grok copies plugin skills and rules', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-grok-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-cli-home-'));
  try {
    const host = HOSTS.grok;
    const grokDir = path.join(tmpDir, '.grok');
    fs.mkdirSync(path.join(grokDir, 'rules'), { recursive: true });
    fs.writeFileSync(path.join(grokDir, 'rules', 'custom.md'), '# keep me');

    installHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });

    assert.equal(fs.existsSync(path.join(grokDir, 'plugins', 'praxis', 'skills', 'using-praxis', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(grokDir, 'skills', 'using-praxis', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(grokDir, 'rules', 'praxis.md')), true);
    assert.equal(fs.existsSync(path.join(grokDir, 'rules', 'custom.md')), true);

    const status = getHostStatus(host, tmpDir, { homeDir: tmpHome, checkBinary: () => false });
    assert.equal(status.projectInstalled, true);
    assert.equal(status.localInstalled, true);

    updateHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });
    assert.equal(fs.existsSync(path.join(grokDir, 'rules', 'praxis.md')), true);

    uninstallHost(host, {
      scope: 'project',
      dryRun: false,
      rootDir: tmpDir,
      homeDir: tmpHome,
      method: 'copy',
      checkBinary: () => false,
    });

    const after = getHostStatus(host, tmpDir, { homeDir: tmpHome, checkBinary: () => false });
    assert.equal(after.projectInstalled, false);
    assert.equal(after.localInstalled, false);
    assert.equal(fs.existsSync(path.join(grokDir, 'plugins', 'praxis')), false);
    assert.equal(fs.existsSync(path.join(grokDir, 'skills', 'using-praxis')), false);
    assert.equal(fs.existsSync(path.join(grokDir, 'rules', 'praxis.md')), false);
    assert.equal(fs.existsSync(path.join(grokDir, 'rules', 'custom.md')), true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('native CommandStep[] builders and formatCommandStep for claude, codex, copilot, pi, and omp', () => {
  assert.equal(
    formatCommandStep({ bin: 'claude', args: ['plugins', 'install', 'my pkg'] }),
    'claude plugins install "my pkg"',
  );

  // Claude Code
  assert.deepEqual(HOSTS.claude.nativeInstallCmd(null, 'user'), [
    { bin: 'claude', args: ['plugins', 'marketplace', 'add', 'ouonet/praxis'], allowFailure: true },
    { bin: 'claude', args: ['plugins', 'install', 'praxis@praxis'] },
  ]);
  assert.deepEqual(HOSTS.claude.nativeInstallCmd('4.2.10', 'project'), [
    { bin: 'claude', args: ['plugins', 'marketplace', 'add', 'ouonet/praxis#4.2.10'], allowFailure: true },
    { bin: 'claude', args: ['plugins', 'install', 'praxis@praxis', '--scope', 'project'] },
  ]);
  assert.deepEqual(HOSTS.claude.nativeUpdateCmd(null, 'user'), [
    { bin: 'claude', args: ['plugins', 'update', 'praxis@praxis'] },
  ]);
  assert.deepEqual(HOSTS.claude.nativeUpdateCmd(null, 'project'), [
    { bin: 'claude', args: ['plugins', 'update', 'praxis@praxis', '--scope', 'project'] },
  ]);
  assert.equal(HOSTS.claude.nativeUpdateCmd('4.2.10', 'user'), null);
  assert.deepEqual(HOSTS.claude.nativeUninstallCmd('user'), [
    { bin: 'claude', args: ['plugins', 'uninstall', 'praxis@praxis'] },
  ]);
  assert.deepEqual(HOSTS.claude.nativeUninstallCmd('local'), [
    { bin: 'claude', args: ['plugins', 'uninstall', 'praxis@praxis', '--scope', 'local'] },
  ]);

  // Codex (user scope only, null ref only)
  assert.equal(HOSTS.codex.nativeInstallCmd(null, 'user')?.length, 3);
  assert.equal(HOSTS.codex.nativeInstallCmd(null, 'project'), null);
  assert.equal(HOSTS.codex.nativeInstallCmd('main', 'user'), null);
  assert.equal(HOSTS.codex.nativeUpdateCmd(null, 'user')?.length, 2);
  assert.equal(HOSTS.codex.nativeUpdateCmd(null, 'local'), null);
  assert.equal(HOSTS.codex.nativeUninstallCmd('user')?.length, 2);
  assert.equal(HOSTS.codex.nativeUninstallCmd('project'), null);

  // Copilot (user scope only, null ref only)
  assert.deepEqual(HOSTS.copilot.nativeInstallCmd(null, 'user'), [
    { bin: 'copilot', args: ['plugin', 'install', 'ouonet/praxis'] },
  ]);
  assert.equal(HOSTS.copilot.nativeInstallCmd(null, 'project'), null);
  assert.equal(HOSTS.copilot.nativeInstallCmd('main', 'user'), null);
  assert.equal(HOSTS.copilot.nativeUpdateCmd(null, 'local'), null);
  assert.equal(HOSTS.copilot.nativeUninstallCmd('project'), null);

  // pi CLI
  assert.deepEqual(HOSTS.pi.nativeInstallCmd(null, 'user'), [
    { bin: 'pi', args: ['install', 'git:github.com/ouonet/praxis'] },
  ]);
  assert.deepEqual(HOSTS.pi.nativeInstallCmd(null, 'local'), [
    { bin: 'pi', args: ['install', '-l', 'git:github.com/ouonet/praxis'] },
  ]);
  assert.deepEqual(HOSTS.pi.nativeInstallCmd(null, 'project'), [
    { bin: 'pi', args: ['install', '-p', 'git:github.com/ouonet/praxis'] },
  ]);
  assert.deepEqual(HOSTS.pi.nativeInstallCmd('main', 'user'), [
    { bin: 'pi', args: ['install', 'git:github.com/ouonet/praxis@main'] },
  ]);
  assert.deepEqual(HOSTS.pi.nativeUpdateCmd('v4.2.10', 'project'), [
    { bin: 'pi', args: ['install', '-p', 'git:github.com/ouonet/praxis@v4.2.10'] },
  ]);
  assert.deepEqual(HOSTS.pi.nativeUninstallCmd('user'), [
    { bin: 'pi', args: ['remove', 'git:github.com/ouonet/praxis'] },
  ]);
  assert.equal(HOSTS.pi.nativeUninstallCmd('project'), null);

  // Oh My Pi (omp)
  assert.deepEqual(HOSTS.omp.nativeInstallCmd(null, 'user'), [
    { bin: 'omp', args: ['plugin', 'install', 'https://github.com/ouonet/praxis'] },
  ]);
  assert.deepEqual(HOSTS.omp.nativeInstallCmd(null, 'local'), [
    { bin: 'omp', args: ['plugin', 'install', 'https://github.com/ouonet/praxis', '-l'] },
  ]);
  assert.deepEqual(HOSTS.omp.nativeInstallCmd('v4.2.10', 'project'), [
    { bin: 'omp', args: ['plugin', 'install', 'https://github.com/ouonet/praxis#v4.2.10', '--scope=project'] },
  ]);
  assert.deepEqual(HOSTS.omp.nativeUninstallCmd('user'), [
    { bin: 'omp', args: ['plugin', 'uninstall', '@ouonet/praxis'] },
  ]);
  assert.equal(HOSTS.omp.nativeUninstallCmd('local'), null);
});

test('stripPraxisCodexToml, codex dry-run and scope isolation, copyPluginFiles assets/exclude, and dangling symlink handling', () => {
  // 1. stripPraxisCodexToml preserves inline arrays, multiline strings/arrays, unrelated sections, and EOL
  const tomlIn = [
    '[core]',
    'tags = ["alpha", "[not-a-section]", "beta"]',
    'notes = """',
    '[plugins."praxis@praxis-marketplace"]',
    'inside multiline string should remain',
    '"""',
    'arr = [',
    '  "[also-inside-array]"',
    ']',
    '',
    '[marketplaces . praxis-marketplace]',
    'url = "https://github.com/ouonet/praxis"',
    'items = ["a", "b"]',
    '',
    '[marketplaces.praxis-marketplace.extra]',
    'foo = "bar"',
    '',
    '[plugins."praxis@praxis-marketplace"]',
    'enabled = true',
    '',
    '[[other.list]]',
    'name = "keep"',
    '',
  ].join('\r\n');

  const stripped = stripPraxisCodexToml(tomlIn);
  assert.equal(stripped.changed, true);
  assert.ok(stripped.content.includes('\r\n'), 'Must preserve CRLF');
  assert.ok(stripped.content.includes('tags = ["alpha", "[not-a-section]", "beta"]'));
  assert.ok(stripped.content.includes('inside multiline string should remain'));
  assert.ok(stripped.content.includes('"[also-inside-array]"'));
  assert.ok(stripped.content.includes('[[other.list]]'));
  assert.equal(stripped.content.includes('[marketplaces . praxis-marketplace]'), false);
  assert.equal(stripped.content.includes('[marketplaces.praxis-marketplace.extra]'), false);
  assert.equal(stripped.content.includes('enabled = true'), false);

  const unchanged = stripPraxisCodexToml(stripped.content);
  assert.equal(unchanged.changed, false);
  assert.equal(unchanged.content, stripped.content);
  assert.deepEqual(stripPraxisCodexToml(''), { content: '', changed: false });

  // 2. Codex dry-run and scope isolation between user (homeDir) and project (rootDir)
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-codex-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-codex-home-'));
  try {
    const userCodex = path.join(tmpHome, '.codex');
    const projCodex = path.join(tmpRoot, '.codex');
    fs.mkdirSync(path.join(userCodex, 'plugins', 'praxis'), { recursive: true });
    fs.mkdirSync(path.join(userCodex, '.tmp', 'marketplaces', 'praxis-marketplace'), { recursive: true });
    fs.mkdirSync(path.join(userCodex, 'plugins', 'cache', 'praxis-marketplace'), { recursive: true });
    fs.writeFileSync(
      path.join(userCodex, 'config.toml'),
      '[core]\nx = 1\n\n[plugins."praxis@praxis-marketplace"]\nenabled = true\n',
      'utf8',
    );

    fs.mkdirSync(path.join(projCodex, 'plugins', 'praxis'), { recursive: true });
    fs.writeFileSync(
      path.join(projCodex, 'config.toml'),
      '[project]\ny = 2\n\n[marketplaces.praxis-marketplace]\nurl = "x"\n',
      'utf8',
    );

    // dryRun=true in user scope does NOT touch files or config.toml
    const dryOk = uninstallHost(HOSTS.codex, {
      scope: 'user',
      method: 'copy',
      dryRun: true,
      rootDir: tmpRoot,
      homeDir: tmpHome,
    });
    assert.equal(dryOk, true);
    assert.equal(fs.existsSync(path.join(userCodex, 'plugins', 'praxis')), true);
    assert.equal(fs.existsSync(path.join(userCodex, '.tmp', 'marketplaces', 'praxis-marketplace')), true);
    assert.match(fs.readFileSync(path.join(userCodex, 'config.toml'), 'utf8'), /praxis@praxis-marketplace/);

    // project uninstall ONLY touches projCodex, leaving userCodex 100% intact
    const projOk = uninstallHost(HOSTS.codex, {
      scope: 'project',
      method: 'copy',
      dryRun: false,
      rootDir: tmpRoot,
      homeDir: tmpHome,
    });
    assert.equal(projOk, true);
    assert.equal(fs.existsSync(path.join(projCodex, 'plugins', 'praxis')), false);
    assert.equal(
      fs.readFileSync(path.join(projCodex, 'config.toml'), 'utf8').includes('praxis-marketplace'),
      false,
    );
    assert.equal(fs.existsSync(path.join(userCodex, 'plugins', 'praxis')), true);
    assert.match(fs.readFileSync(path.join(userCodex, 'config.toml'), 'utf8'), /praxis@praxis-marketplace/);

    // user uninstall ONLY touches userCodex
    fs.mkdirSync(path.join(projCodex, 'plugins', 'praxis'), { recursive: true });
    const userOk = uninstallHost(HOSTS.codex, {
      scope: 'user',
      method: 'copy',
      dryRun: false,
      rootDir: tmpRoot,
      homeDir: tmpHome,
    });
    assert.equal(userOk, true);
    assert.equal(fs.existsSync(path.join(userCodex, 'plugins', 'praxis')), false);
    assert.equal(fs.existsSync(path.join(userCodex, '.tmp', 'marketplaces', 'praxis-marketplace')), false);
    assert.equal(fs.existsSync(path.join(userCodex, 'plugins', 'cache', 'praxis-marketplace')), false);
    assert.equal(
      fs.readFileSync(path.join(userCodex, 'config.toml'), 'utf8').includes('praxis@praxis-marketplace'),
      false,
    );
    assert.equal(fs.existsSync(path.join(projCodex, 'plugins', 'praxis')), true);

    // 3. copyPluginFiles includes assets/logo-mark.svg and respects exclude: ['rules']
    const pluginOut = path.join(tmpRoot, 'plugin-copy-test');
    copyPluginFiles(path.resolve(import.meta.dirname, '..'), pluginOut, {
      method: 'copy',
      force: true,
      exclude: ['rules'],
    });
    assert.equal(fs.existsSync(path.join(pluginOut, 'assets', 'logo-mark.svg')), true);
    assert.equal(fs.existsSync(path.join(pluginOut, 'rules')), false);

    // 4. Dangling symlink at dest is handled cleanly by copyOrLink with force=true
    const srcFile = path.join(tmpRoot, 'real-src.txt');
    fs.writeFileSync(srcFile, 'hello', 'utf8');
    const danglingDest = path.join(tmpRoot, 'dangling-dest.txt');
    let symlinkCreated = false;
    try {
      fs.symlinkSync(path.join(tmpRoot, 'nonexistent-target.txt'), danglingDest, 'file');
      symlinkCreated = true;
    } catch {}
    if (symlinkCreated) {
      copyOrLink(srcFile, danglingDest, { method: 'copy', force: true });
      assert.equal(fs.readFileSync(danglingDest, 'utf8'), 'hello');
    }
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('opencode single-source lifecycle, --ref replacement, method switching, and invalid JSON protection', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-opencode-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-opencode-home-'));
  try {
    assert.equal(isPraxisPluginEntry('praxis@git+https://github.com/ouonet/praxis.git'), true);
    assert.equal(isPraxisPluginEntry('praxis@git+https://github.com/ouonet/praxis.git#v4.2.11'), true);
    assert.equal(isPraxisPluginEntry('@ouonet/praxis'), true);
    assert.equal(isPraxisPluginEntry('my-praxis-helper'), false);

    // 1. project scope rejects method=copy/link
    assert.equal(
      installHost(HOSTS.opencode, { scope: 'project', method: 'copy', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      false,
    );

    // 2. project scope auto writes opencode.json, supports --ref replacement, preserves other keys on uninstall
    fs.writeFileSync(
      path.join(tmpRoot, 'opencode.json'),
      JSON.stringify({ theme: 'dark', plugin: ['other-plugin'] }, null, 2),
      'utf8',
    );
    assert.equal(
      installHost(HOSTS.opencode, { scope: 'project', method: 'auto', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      true,
    );
    let projCfg = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'opencode.json'), 'utf8'));
    assert.deepEqual(projCfg.plugin, ['other-plugin', 'praxis@git+https://github.com/ouonet/praxis.git']);

    // Pin a ref -> replaces existing praxis entry
    assert.equal(
      installHost(HOSTS.opencode, {
        scope: 'project',
        method: 'auto',
        ref: 'single-module',
        rootDir: tmpRoot,
        homeDir: tmpHome,
        checkBinary: () => false,
      }),
      true,
    );
    projCfg = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'opencode.json'), 'utf8'));
    assert.deepEqual(projCfg.plugin, ['other-plugin', 'praxis@git+https://github.com/ouonet/praxis.git#single-module']);

    // Re-install without --force and ref=null keeps pinned entry; update resets to unpinned default
    assert.equal(
      installHost(HOSTS.opencode, { scope: 'project', method: 'auto', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      true,
    );
    projCfg = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'opencode.json'), 'utf8'));
    assert.deepEqual(projCfg.plugin, ['other-plugin', 'praxis@git+https://github.com/ouonet/praxis.git#single-module']);

    assert.equal(
      updateHost(HOSTS.opencode, { scope: 'project', method: 'auto', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      true,
    );
    projCfg = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'opencode.json'), 'utf8'));
    assert.deepEqual(projCfg.plugin, ['other-plugin', 'praxis@git+https://github.com/ouonet/praxis.git']);

    // Uninstall project dryRun leaves opencode.json intact; real uninstall removes only praxis entry
    assert.equal(
      uninstallHost(HOSTS.opencode, { scope: 'project', dryRun: true, rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      true,
    );
    projCfg = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'opencode.json'), 'utf8'));
    assert.equal(projCfg.plugin.length, 2);

    assert.equal(
      uninstallHost(HOSTS.opencode, { scope: 'project', dryRun: false, rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      true,
    );
    projCfg = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'opencode.json'), 'utf8'));
    assert.equal(projCfg.theme, 'dark');
    assert.deepEqual(projCfg.plugin, ['other-plugin']);

    // 3. user scope switching between auto and copy cleans stale sibling artifacts
    assert.equal(
      installHost(HOSTS.opencode, { scope: 'user', method: 'copy', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      true,
    );
    const userOpencodeDir = path.join(tmpHome, '.config', 'opencode');
    assert.equal(fs.existsSync(path.join(userOpencodeDir, 'plugins', 'praxis.js')), true);
    assert.equal(fs.existsSync(path.join(userOpencodeDir, 'opencode.json')), false);

    // Switch to auto -> writes opencode.json and removes local plugins/praxis.js + skills
    assert.equal(
      installHost(HOSTS.opencode, { scope: 'user', method: 'auto', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      true,
    );
    assert.equal(fs.existsSync(path.join(userOpencodeDir, 'opencode.json')), true);
    assert.equal(fs.existsSync(path.join(userOpencodeDir, 'plugins', 'praxis.js')), false);
    assert.equal(fs.existsSync(path.join(userOpencodeDir, 'skills', 'using-praxis')), false);

    // Switch back to copy -> copies files and removes praxis entry from opencode.json
    assert.equal(
      installHost(HOSTS.opencode, { scope: 'user', method: 'copy', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      true,
    );
    assert.equal(fs.existsSync(path.join(userOpencodeDir, 'plugins', 'praxis.js')), true);
    const userCfgAfterCopy = JSON.parse(fs.readFileSync(path.join(userOpencodeDir, 'opencode.json'), 'utf8'));
    assert.deepEqual(userCfgAfterCopy.plugin, []);

    // 4. Invalid JSON or invalid plugin field in opencode.json aborts BEFORE deleting files
    fs.writeFileSync(path.join(userOpencodeDir, 'opencode.json'), '{ invalid json', 'utf8');
    assert.equal(
      uninstallHost(HOSTS.opencode, { scope: 'user', dryRun: false, rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      false,
    );
    assert.equal(
      fs.existsSync(path.join(userOpencodeDir, 'plugins', 'praxis.js')),
      true,
      'Must not delete plugins/praxis.js when opencode.json validation fails',
    );
    assert.equal(fs.readFileSync(path.join(userOpencodeDir, 'opencode.json'), 'utf8'), '{ invalid json');

    fs.writeFileSync(path.join(userOpencodeDir, 'opencode.json'), JSON.stringify({ plugin: 'not-an-array' }), 'utf8');
    assert.equal(
      installHost(HOSTS.opencode, { scope: 'user', method: 'auto', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }),
      false,
    );
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('ownership-marked rules, user AGENTS.md protection, antigravity/grok deduplication, and sibling-safe .agents uninstall', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-rules-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-rules-home-'));
  try {
    // 1. isPraxisManagedRuleFile and copyManagedRuleFile return values
    const srcRule = path.resolve(import.meta.dirname, '..', 'rules', 'AGENTS.md');
    const userRule = path.join(tmpRoot, 'user-AGENTS.md');
    fs.writeFileSync(userRule, '# Custom Team Instructions\nDo not delete me.\n', 'utf8');
    assert.equal(isPraxisManagedRuleFile(userRule), false);
    assert.equal(isPraxisManagedRuleFile(srcRule), true);

    const legacyRule = path.join(tmpRoot, 'legacy-AGENTS.md');
    fs.writeFileSync(legacyRule, '# Praxis Triage Rules\npraxis: scope=<x>, loading=<skills>\n', 'utf8');
    assert.equal(isPraxisManagedRuleFile(legacyRule), true);

    // copyManagedRuleFile never overwrites user-owned rule even with force=true
    assert.equal(copyManagedRuleFile(srcRule, userRule, { method: 'copy', force: true }), 'preserved');
    assert.match(fs.readFileSync(userRule, 'utf8'), /Custom Team Instructions/);

    const managedDest = path.join(tmpRoot, 'managed-AGENTS.md');
    assert.equal(copyManagedRuleFile(srcRule, managedDest, { method: 'copy', dryRun: true }), 'dry-run');
    assert.equal(fs.existsSync(managedDest), false);
    assert.equal(copyManagedRuleFile(srcRule, managedDest, { method: 'copy', force: false }), 'installed');
    assert.equal(copyManagedRuleFile(srcRule, managedDest, { method: 'copy', force: false }), 'skipped');
    assert.equal(copyManagedRuleFile(srcRule, managedDest, { method: 'copy', force: true }), 'installed');

    // 2. Antigravity user scope: preserves user-owned AGENTS.md, omits duplicate rules/skills, cleans legacy on force/update
    const geminiConfig = path.join(tmpHome, '.gemini', 'config');
    fs.mkdirSync(path.join(geminiConfig, 'rules'), { recursive: true });
    fs.mkdirSync(path.join(geminiConfig, 'skills', 'using-praxis'), { recursive: true });
    fs.writeFileSync(path.join(geminiConfig, 'skills', 'using-praxis', 'SKILL.md'), 'legacy skill', 'utf8');
    fs.writeFileSync(
      path.join(geminiConfig, 'rules', 'praxis.md'),
      '# Praxis Triage Rules\npraxis: scope=<x>, loading=<skills>\n',
      'utf8',
    );
    fs.writeFileSync(path.join(geminiConfig, 'rules', 'AGENTS.md'), '# User Custom Global AGENTS\n', 'utf8');

    installHost(HOSTS.antigravity, {
      scope: 'user',
      method: 'copy',
      force: true,
      rootDir: tmpRoot,
      homeDir: tmpHome,
    });
    assert.match(fs.readFileSync(path.join(geminiConfig, 'rules', 'AGENTS.md'), 'utf8'), /User Custom Global AGENTS/);
    assert.equal(fs.existsSync(path.join(geminiConfig, 'rules', 'praxis.md')), false, 'Legacy praxis.md cleaned');
    assert.equal(fs.existsSync(path.join(geminiConfig, 'skills', 'using-praxis')), false, 'Legacy skills cleaned');
    assert.equal(fs.existsSync(path.join(geminiConfig, 'plugins', 'praxis', 'rules')), false, 'Plugin rules excluded');

    uninstallHost(HOSTS.antigravity, {
      scope: 'user',
      method: 'copy',
      rootDir: tmpRoot,
      homeDir: tmpHome,
    });
    assert.match(
      fs.readFileSync(path.join(geminiConfig, 'rules', 'AGENTS.md'), 'utf8'),
      /User Custom Global AGENTS/,
      'Uninstall must preserve user-owned global AGENTS.md',
    );

    // 3. Co-installing antigravity + agents in project scope keeps a single rule file and sibling-safe uninstall
    const coRoot = path.join(tmpRoot, 'co-project');
    fs.mkdirSync(coRoot, { recursive: true });
    installHost(HOSTS.antigravity, { scope: 'project', method: 'copy', rootDir: coRoot, homeDir: tmpHome });
    installHost(HOSTS.agents, { scope: 'project', method: 'copy', rootDir: coRoot, homeDir: tmpHome });

    assert.equal(fs.existsSync(path.join(coRoot, '.agents', 'rules', 'AGENTS.md')), true);
    assert.equal(
      fs.existsSync(path.join(coRoot, '.agents', 'rules', 'praxis.md')),
      false,
      'agents must skip praxis.md when Praxis-managed AGENTS.md already exists',
    );

    // Uninstalling antigravity alone keeps shared skills/rules because agents hooks/session-start still exists
    uninstallHost(HOSTS.antigravity, { scope: 'project', method: 'copy', rootDir: coRoot, homeDir: tmpHome });
    assert.equal(fs.existsSync(path.join(coRoot, '.agents', 'plugins', 'praxis')), false);
    assert.equal(fs.existsSync(path.join(coRoot, '.agents', 'skills', 'using-praxis', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(coRoot, '.agents', 'rules', 'AGENTS.md')), true);

    // Now uninstalling agents removes remaining hooks, skills, and Praxis-managed rule
    uninstallHost(HOSTS.agents, { scope: 'project', method: 'copy', rootDir: coRoot, homeDir: tmpHome });
    assert.equal(fs.existsSync(path.join(coRoot, '.agents', 'hooks', 'session-start')), false);
    assert.equal(fs.existsSync(path.join(coRoot, '.agents', 'skills', 'using-praxis')), false);
    assert.equal(fs.existsSync(path.join(coRoot, '.agents', 'rules', 'AGENTS.md')), false);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('pure parsers (hasPraxisCodexToml, hasPraxisOpencodeConfigText, hasPraxisPiSettingsText) and accurate getHostStatus without false positives', () => {
  // 1. Pure text parsers
  assert.equal(hasPraxisCodexToml(null), false);
  assert.equal(hasPraxisCodexToml(''), false);
  assert.equal(hasPraxisCodexToml('# [marketplaces.praxis-marketplace]'), false);
  assert.equal(hasPraxisCodexToml('[plugins.other]\nenabled = true'), false);
  assert.equal(hasPraxisCodexToml('[marketplaces.praxis-marketplace]'), true);
  assert.equal(hasPraxisCodexToml('[plugins."praxis@praxis-marketplace"]'), true);
  assert.equal(hasPraxisCodexToml('[plugins."praxis@praxis-marketplace"]\nenabled = true'), true);
  assert.equal(hasPraxisCodexToml('[plugins."praxis@praxis-marketplace"]\nenabled = false'), false);
  assert.equal(hasPraxisCodexToml('[plugins."praxis@praxis-marketplace"]\nenabled = false # disabled\n'), false);

  assert.equal(hasPraxisOpencodeConfigText(null), false);
  assert.equal(hasPraxisOpencodeConfigText('{ invalid json'), false);
  assert.equal(hasPraxisOpencodeConfigText(JSON.stringify({ plugin: 'not-array' })), false);
  assert.equal(hasPraxisOpencodeConfigText(JSON.stringify({ plugin: ['other-plugin'] })), false);
  assert.equal(
    hasPraxisOpencodeConfigText(JSON.stringify({ plugin: ['praxis@git+https://github.com/ouonet/praxis.git'] })),
    true,
  );

  assert.equal(hasPraxisPiSettingsText(null), false);
  assert.equal(hasPraxisPiSettingsText('{ invalid json'), false);
  assert.equal(hasPraxisPiSettingsText(JSON.stringify({ packages: ['git:github.com/ouonet/praxis'] })), true);
  assert.equal(hasPraxisPiSettingsText(JSON.stringify({ skills: [{ name: 'praxis', path: 'custom/path' }] })), true);
  assert.equal(hasPraxisPiSettingsText(JSON.stringify({ extensions: ['other-extension'] })), false);

  // 2. getHostStatus false positive immunity
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-status-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-status-home-'));
  try {
    // A. Antigravity & Agents with user-authored AGENTS.md (no marker) must be false
    const userRuleDir = path.join(tmpHome, '.gemini', 'config', 'rules');
    fs.mkdirSync(userRuleDir, { recursive: true });
    fs.writeFileSync(path.join(userRuleDir, 'AGENTS.md'), '# Custom Team Instructions\n', 'utf8');

    const statusOpts = { homeDir: tmpHome, checkBinary: () => false };
    let agyStatus = getHostStatus(HOSTS.antigravity, tmpRoot, statusOpts);
    assert.equal(agyStatus.userInstalled, false, 'User-owned AGENTS.md must not trigger userInstalled for antigravity');

    let agentsStatus = getHostStatus(HOSTS.agents, tmpRoot, statusOpts);
    assert.equal(agentsStatus.userInstalled, false, 'User-owned AGENTS.md must not trigger userInstalled for agents');

    // Add Praxis marker -> now true
    fs.writeFileSync(
      path.join(userRuleDir, 'AGENTS.md'),
      '<!-- praxis:managed-rule -->\n# Praxis Triage Rules\n',
      'utf8',
    );
    agyStatus = getHostStatus(HOSTS.antigravity, tmpRoot, statusOpts);
    assert.equal(agyStatus.userInstalled, true, 'Managed AGENTS.md must trigger userInstalled for antigravity');

    // B. OMP: Bare .omp/plugins directory must NOT trigger projectInstalled or localInstalled
    const bareOmpDir = path.join(tmpRoot, '.omp', 'plugins');
    fs.mkdirSync(bareOmpDir, { recursive: true });
    let ompStatus = getHostStatus(HOSTS.omp, tmpRoot, statusOpts);
    assert.equal(ompStatus.projectInstalled, false, 'Bare .omp/plugins must not trigger projectInstalled');
    assert.equal(ompStatus.localInstalled, false, 'Bare .omp/plugins must not trigger localInstalled');

    // Add node_modules/@ouonet/praxis -> now true
    fs.mkdirSync(path.join(bareOmpDir, 'node_modules', '@ouonet', 'praxis'), { recursive: true });
    ompStatus = getHostStatus(HOSTS.omp, tmpRoot, statusOpts);
    assert.equal(ompStatus.projectInstalled, true);
    assert.equal(ompStatus.localInstalled, true);

    // C. Pi: Bare .pi/skills directory must NOT trigger projectInstalled or localInstalled
    const barePiDir = path.join(tmpRoot, '.pi', 'skills');
    fs.mkdirSync(barePiDir, { recursive: true });
    let piStatus = getHostStatus(HOSTS.pi, tmpRoot, statusOpts);
    assert.equal(piStatus.projectInstalled, false, 'Bare .pi/skills must not trigger projectInstalled');
    assert.equal(piStatus.localInstalled, false, 'Bare .pi/skills must not trigger localInstalled');

    // Add using-praxis skill -> now true
    fs.mkdirSync(path.join(barePiDir, 'using-praxis'), { recursive: true });
    piStatus = getHostStatus(HOSTS.pi, tmpRoot, statusOpts);
    assert.equal(piStatus.projectInstalled, true);
    assert.equal(piStatus.localInstalled, true);

    // D. OpenCode: Bare ~/.config/opencode must NOT trigger userInstalled
    const bareOpencodeDir = path.join(tmpHome, '.config', 'opencode');
    fs.mkdirSync(bareOpencodeDir, { recursive: true });
    let ocStatus = getHostStatus(HOSTS.opencode, tmpRoot, statusOpts);
    assert.equal(ocStatus.userInstalled, false, 'Bare ~/.config/opencode must not trigger userInstalled');

    // Add opencode.json with praxis entry -> now true
    fs.writeFileSync(
      path.join(bareOpencodeDir, 'opencode.json'),
      JSON.stringify({ plugin: ['praxis@git+https://github.com/ouonet/praxis.git'] }),
      'utf8',
    );
    ocStatus = getHostStatus(HOSTS.opencode, tmpRoot, statusOpts);
    assert.equal(ocStatus.userInstalled, true);

    // E. Codex: config.toml with enabled = false must NOT trigger userInstalled
    const codexDir = path.join(tmpHome, '.codex');
    fs.mkdirSync(codexDir, { recursive: true });
    fs.writeFileSync(
      path.join(codexDir, 'config.toml'),
      '[plugins."praxis@praxis-marketplace"]\nenabled = false # disabled\n',
      'utf8',
    );
    let codexStatus = getHostStatus(HOSTS.codex, tmpRoot, statusOpts);
    assert.equal(codexStatus.userInstalled, false, 'Disabled Codex plugin must not trigger userInstalled');

    // Switch to enabled = true -> now true
    fs.writeFileSync(
      path.join(codexDir, 'config.toml'),
      '[plugins."praxis@praxis-marketplace"]\nenabled = true\n',
      'utf8',
    );
    codexStatus = getHostStatus(HOSTS.codex, tmpRoot, statusOpts);
    assert.equal(codexStatus.userInstalled, true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('HOST_ADAPTERS registry, resolveBinaryAvailable, node_modules filtering, and M6 adapter safety fixes', async () => {
  // 1. HOST_ADAPTERS & getHostAdapter
  assert.equal(Object.isFrozen(HOST_ADAPTERS), true);
  assert.deepEqual(Object.keys(HOST_ADAPTERS).sort(), Object.keys(HOSTS).sort());
  for (const id of Object.keys(HOSTS)) {
    const adapter = getHostAdapter(id);
    assert.equal(adapter.id, id);
    assert.equal(typeof adapter.installFiles, 'function');
    assert.equal(typeof adapter.uninstallFiles, 'function');
    assert.equal(typeof adapter.getStatus, 'function');
  }
  assert.equal(getHostAdapter(HOSTS.codex).alwaysRunFileUninstall, true);
  assert.equal(getHostAdapter('AGY').id, 'antigravity');
  assert.equal(getHostAdapter('generic').id, 'agents');
  assert.throws(() => getHostAdapter('unknown-host'), Error);
  assert.throws(() => getHostAdapter(null), Error);
  assert.throws(() => getHostAdapter(undefined), Error);

  // 2. PLUGIN_ITEMS_TO_COPY & derivePraxisSkillNames fallback
  assert.equal(Object.isFrozen(PLUGIN_ITEMS_TO_COPY), true);
  assert.equal(PLUGIN_ITEMS_TO_COPY.includes('.opencode'), false);
  assert.equal(PLUGIN_ITEMS_TO_COPY.includes('.opencode/plugins'), true);
  assert.equal(PLUGIN_ITEMS_TO_COPY.includes('.opencode/INSTALL.md'), true);
  assert.deepEqual(derivePraxisSkillNames('/nonexistent/skills/dir'), DEFAULT_PRAXIS_SKILL_NAMES);

  // 3. resolveBinaryAvailable precedence
  assert.equal(
    resolveBinaryAvailable(HOSTS.agents, { binaryAvailable: true, checkBinary: () => true }),
    false,
    'cliBinary === null always returns false',
  );
  assert.equal(
    resolveBinaryAvailable(HOSTS.claude, { binaryAvailable: true, checkBinary: () => false }),
    true,
  );
  assert.equal(
    resolveBinaryAvailable(HOSTS.claude, { binaryAvailable: false, checkBinary: () => true }),
    false,
  );
  let probedArg = null;
  assert.equal(
    resolveBinaryAvailable(HOSTS.qoder, {
      checkBinary: (b) => {
        probedArg = b;
        return true;
      },
    }),
    true,
  );
  assert.deepEqual(probedArg, HOSTS.qoder.cliBinary);
  assert.equal(resolveBinaryAvailable(HOSTS.claude, { method: 'copy' }), false);
  assert.equal(resolveBinaryAvailable(HOSTS.claude, { method: 'link' }), false);

  const tmpSrc = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-m6-src-'));
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-m6-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-m6-home-'));
  try {
    // 4. copyPluginFiles filters .opencode dev artifacts & nested node_modules under both copy and link
    fs.mkdirSync(path.join(tmpSrc, '.opencode', 'plugins'), { recursive: true });
    fs.mkdirSync(path.join(tmpSrc, '.opencode', 'node_modules', 'fake-pkg'), { recursive: true });
    fs.writeFileSync(path.join(tmpSrc, '.opencode', 'plugins', 'praxis.js'), 'export default {};', 'utf8');
    fs.writeFileSync(path.join(tmpSrc, '.opencode', 'INSTALL.md'), '# install', 'utf8');
    fs.writeFileSync(path.join(tmpSrc, '.opencode', 'package.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(tmpSrc, '.opencode', 'bun.lock'), 'lock', 'utf8');
    fs.writeFileSync(path.join(tmpSrc, '.opencode', 'node_modules', 'fake-pkg', 'index.js'), '', 'utf8');
    fs.mkdirSync(path.join(tmpSrc, 'skills', 'using-praxis', 'node_modules', 'evil'), { recursive: true });
    fs.writeFileSync(path.join(tmpSrc, 'skills', 'using-praxis', 'SKILL.md'), '# skill', 'utf8');

    const destCopy = path.join(tmpRoot, 'out-copy');
    copyPluginFiles(tmpSrc, destCopy, { method: 'copy', force: true });
    assert.equal(fs.existsSync(path.join(destCopy, '.opencode', 'plugins', 'praxis.js')), true);
    assert.equal(fs.existsSync(path.join(destCopy, '.opencode', 'INSTALL.md')), true);
    assert.equal(fs.existsSync(path.join(destCopy, '.opencode', 'node_modules')), false);
    assert.equal(fs.existsSync(path.join(destCopy, '.opencode', 'package.json')), false);
    assert.equal(fs.existsSync(path.join(destCopy, '.opencode', 'bun.lock')), false);
    assert.equal(fs.existsSync(path.join(destCopy, 'skills', 'using-praxis', 'node_modules')), false);

    // Same .opencode isolation under method='link'
    const destLink = path.join(tmpRoot, 'out-link');
    copyPluginFiles(tmpSrc, destLink, { method: 'link', force: true });
    assert.equal(fs.existsSync(path.join(destLink, '.opencode', 'plugins', 'praxis.js')), true);
    assert.equal(fs.existsSync(path.join(destLink, '.opencode', 'INSTALL.md')), true);
    assert.equal(fs.existsSync(path.join(destLink, '.opencode', 'node_modules')), false);
    assert.equal(fs.existsSync(path.join(destLink, '.opencode', 'package.json')), false);
    assert.equal(fs.existsSync(path.join(destLink, '.opencode', 'bun.lock')), false);

    // 5. pi & omp project/local install skills directly under .pi/skills and .omp/skills, and dry-run preserves empty dirs
    assert.equal(
      installHost(HOSTS.pi, {
        scope: 'project',
        method: 'copy',
        rootDir: tmpRoot,
        homeDir: tmpHome,
        praxisSrc: tmpSrc,
        checkBinary: () => false,
      }),
      true,
    );
    assert.equal(fs.existsSync(path.join(tmpRoot, '.pi', 'skills', 'using-praxis', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(tmpRoot, '.pi', 'skills', 'plugin.json')), false);
    assert.equal(getHostStatus(HOSTS.pi, tmpRoot, { homeDir: tmpHome, checkBinary: () => false }).projectInstalled, true);

    assert.equal(
      uninstallHost(HOSTS.pi, {
        scope: 'project',
        method: 'copy',
        rootDir: tmpRoot,
        homeDir: tmpHome,
        checkBinary: () => false,
      }),
      true,
    );
    assert.equal(fs.existsSync(path.join(tmpRoot, '.pi')), false);

    // dryRun keeps existing empty .omp dir intact
    const ompDir = path.join(tmpRoot, '.omp');
    fs.mkdirSync(ompDir, { recursive: true });
    assert.equal(
      uninstallHost(HOSTS.omp, {
        scope: 'local',
        dryRun: true,
        rootDir: tmpRoot,
        homeDir: tmpHome,
        checkBinary: () => false,
      }),
      true,
    );
    assert.equal(fs.existsSync(ompDir), true);

    // 6. opencode local uninstall never touches or validates rootDir/opencode.json
    fs.writeFileSync(path.join(tmpRoot, 'opencode.json'), '{ invalid project json', 'utf8');
    fs.mkdirSync(path.join(tmpRoot, '.opencode', 'plugins'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, '.opencode', 'plugins', 'praxis.js'), 'export default {};', 'utf8');
    assert.equal(
      uninstallHost(HOSTS.opencode, {
        scope: 'local',
        dryRun: false,
        rootDir: tmpRoot,
        homeDir: tmpHome,
        checkBinary: () => false,
      }),
      true,
    );
    assert.equal(fs.existsSync(path.join(tmpRoot, '.opencode', 'plugins', 'praxis.js')), false);
    assert.equal(fs.readFileSync(path.join(tmpRoot, 'opencode.json'), 'utf8'), '{ invalid project json');

    // 7. claude/copilot user uninstall uses isolated homeDir
    const userCopilotPlugin = path.join(tmpHome, '.copilot-cli', 'plugins', 'praxis');
    fs.mkdirSync(userCopilotPlugin, { recursive: true });
    fs.writeFileSync(path.join(userCopilotPlugin, 'plugin.json'), '{}', 'utf8');
    assert.equal(
      uninstallHost(HOSTS.copilot, {
        scope: 'user',
        method: 'copy',
        rootDir: tmpRoot,
        homeDir: tmpHome,
        checkBinary: () => false,
      }),
      true,
    );
    assert.equal(fs.existsSync(userCopilotPlugin), false);

    // 8. codex --method native failure does NOT fall through to alwaysRunFileUninstall cleanup
    const codexUserPlugin = path.join(tmpHome, '.codex', 'plugins', 'praxis');
    fs.mkdirSync(codexUserPlugin, { recursive: true });
    assert.equal(
      uninstallHost(HOSTS.codex, {
        scope: 'user',
        method: 'native',
        binaryAvailable: false,
        rootDir: tmpRoot,
        homeDir: tmpHome,
      }),
      false,
    );
    assert.equal(fs.existsSync(codexUserPlugin), true);

    // 9. Caught filesystem I/O error inside installFiles returns false cleanly
    const fileBlocker = path.join(tmpRoot, 'blocked-parent');
    fs.writeFileSync(fileBlocker, 'not-a-directory', 'utf8');
    assert.equal(
      installHost(HOSTS.copilot, {
        scope: 'project',
        method: 'copy',
        rootDir: fileBlocker,
        homeDir: tmpHome,
        praxisSrc: tmpSrc,
        checkBinary: () => false,
      }),
      false,
    );

    // 10. runCli propagates caught adapter I/O failure as exit code 1 (invalid opencode.json)
    assert.equal(
      await runCli(['install', '--host', 'opencode', '--scope', 'project'], {
        rootDir: tmpRoot,
        homeDir: tmpHome,
        checkBinary: () => false,
      }),
      1,
    );
  } finally {
    fs.rmSync(tmpSrc, { recursive: true, force: true });
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

function snapshotTree(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (cur) => {
    const entries = fs.readdirSync(cur).sort();
    for (const name of entries) {
      const full = path.join(cur, name);
      const rel = path.relative(dir, full);
      const lstat = fs.lstatSync(full);
      if (lstat.isSymbolicLink()) {
        out.push(`L:${rel}->${fs.readlinkSync(full)}`);
      } else if (lstat.isDirectory()) {
        out.push(`D:${rel}`);
        walk(full);
      } else {
        out.push(`F:${rel}:${lstat.size}`);
      }
    }
  };
  walk(dir);
  return out;
}

test('praxis doctor helper predicates: isDanglingSymlink and validateTomlBasic', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-helpers-'));
  try {
    // 1. isDanglingSymlink
    assert.equal(isDanglingSymlink(path.join(tmpDir, 'does-not-exist')), false);
    const regularFile = path.join(tmpDir, 'regular.txt');
    fs.writeFileSync(regularFile, 'ok', 'utf8');
    assert.equal(isDanglingSymlink(regularFile), false);

    const realDir = path.join(tmpDir, 'real-dir');
    fs.mkdirSync(realDir, { recursive: true });
    const linkType = os.platform() === 'win32' ? 'junction' : 'dir';
    const validLink = path.join(tmpDir, 'valid-link');
    fs.symlinkSync(realDir, validLink, linkType);
    assert.equal(isDanglingSymlink(validLink), false);

    const missingTarget = path.join(tmpDir, 'missing-target');
    const brokenDirLink = path.join(tmpDir, 'broken-dir-link');
    fs.symlinkSync(missingTarget, brokenDirLink, linkType);
    assert.equal(isDanglingSymlink(brokenDirLink), true);

    // 2. validateTomlBasic
    assert.deepEqual(validateTomlBasic(''), { valid: true, error: null });
    assert.deepEqual(
      validateTomlBasic([
        "# don't break on apostrophe",
        '[core]',
        'tags = ["a", "[b]", "c"]',
        'note = """',
        'multi line "" and \\""" stay inside until close',
        '"""',
        "lit = '''don't escape'''",
        '[plugins."praxis@praxis-marketplace"] # inline comment',
        'enabled = true',
        '[[other.items]]',
        'name = "ok"',
      ].join('\n')),
      { valid: true, error: null },
    );

    for (const badInput of [null, undefined, 42, {}]) {
      const res = validateTomlBasic(badInput);
      assert.equal(res.valid, false);
      assert.equal(typeof res.error, 'string');
    }

    for (const badToml of [
      '[unclosed.header\nx = 1',
      '[[mismatched]\nx = 1',
      '[mismatched]]\nx = 1',
      '[]\nx = 1',
      '[core]\narr = [\n  "unclosed array"',
      '[core]\ns = """\nunclosed multiline basic',
      "[core]\ns = '''\nunclosed multiline literal",
      '[core]\ns = "unclosed single line',
    ]) {
      const res = validateTomlBasic(badToml);
      assert.equal(res.valid, false, `Expected invalid TOML for:\n${badToml}`);
      assert.ok(res.error && res.error.length > 0);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('praxis doctor direct API, CLI aliases, help output, flags, and read-only safety', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-cli-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-cli-home-'));
  try {
    // 1. Direct API defaults & error modes
    assert.throws(() => diagnoseHost('nonexistent-host', { rootDir: tmpRoot, homeDir: tmpHome }), Error);
    assert.throws(() => diagnoseHost(HOSTS.claude, { rootDir: tmpRoot, homeDir: tmpHome, scope: 'porject' }), RangeError);
    assert.throws(() => diagnoseHosts(['nonexistent-host'], { rootDir: tmpRoot, homeDir: tmpHome }), Error);

    const allSummary = diagnoseHosts(undefined, { rootDir: tmpRoot, homeDir: tmpHome });
    assert.equal(allSummary.ok, true);
    assert.equal(allSummary.failCount, 0);
    assert.equal(allSummary.warnCount, 0);
    assert.equal(allSummary.hosts.length, Object.keys(HOSTS).length);

    const subsetSummary = diagnoseHosts(['agy', HOSTS.grok], { rootDir: tmpRoot, homeDir: tmpHome });
    assert.deepEqual(subsetSummary.hosts.map((h) => h.id), ['antigravity', 'grok']);

    // 2. Capture CLI help output for doctor, validate, check
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      assert.equal(await runCli(['help'], { rootDir: tmpRoot, homeDir: tmpHome }), 0);
    } finally {
      console.log = origLog;
    }
    const helpOut = logs.join('\n');
    assert.match(helpOut, /doctor/);
    assert.match(helpOut, /validate/);
    assert.match(helpOut, /check/);

    // 3. Aliases and flag validation on empty clean workspace/home
    const beforeRoot = snapshotTree(tmpRoot);
    const beforeHome = snapshotTree(tmpHome);
    for (const cmd of ['doctor', 'validate', 'check']) {
      assert.equal(await runCli([cmd], { rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false }), 0);
    }
    assert.equal(await runCli(['doctor', '--host', 'bogus'], { rootDir: tmpRoot, homeDir: tmpHome }), 1);
    assert.equal(await runCli(['doctor', '--ref', 'main'], { rootDir: tmpRoot, homeDir: tmpHome }), 1);
    assert.equal(await runCli(['doctor', '--scope', 'porject'], { rootDir: tmpRoot, homeDir: tmpHome }), 1);
    assert.equal(await runCli(['doctor', '--method', 'bogus'], { rootDir: tmpRoot, homeDir: tmpHome }), 1);
    assert.equal(await runCli(['doctor', '--dry-run', '--force', '--method', 'copy'], { rootDir: tmpRoot, homeDir: tmpHome }), 0);
    assert.deepEqual(snapshotTree(tmpRoot), beforeRoot, 'doctor must perform zero mutations in rootDir');
    assert.deepEqual(snapshotTree(tmpHome), beforeHome, 'doctor must perform zero mutations in homeDir');

    // 4. Home directory explicit --scope project emits scope-skipped-home warn and exits 0
    const homeSkipReport = diagnoseHost('claude', { rootDir: tmpHome, homeDir: tmpHome, scope: 'project' });
    assert.equal(homeSkipReport.status, 'warn');
    assert.equal(homeSkipReport.checks[0].code, 'scope-skipped-home');
    assert.equal(homeSkipReport.checks[0].severity, 'warn');
    assert.equal(homeSkipReport.checks[0].path, null);
    assert.equal(await runCli(['doctor', '--host', 'claude', '--scope', 'project'], { rootDir: tmpHome, homeDir: tmpHome }), 0);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('praxis doctor diagnoses healthy installs, all 7 invalid configs, unreadable paths, incomplete skills, and dangling symlinks', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-checks-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-checks-home-'));
  const protectedFiles = [];
  try {
    // 1. Healthy installs across hosts
    for (const host of [HOSTS.grok, HOSTS.antigravity, HOSTS.copilot, HOSTS.pi, HOSTS.omp, HOSTS.qoder, HOSTS.codex, HOSTS.claude]) {
      assert.equal(
        installHost(host, {
          scope: 'project',
          method: 'copy',
          rootDir: tmpRoot,
          homeDir: tmpHome,
          checkBinary: () => false,
        }),
        true,
      );
    }
    assert.equal(
      installHost(HOSTS.opencode, {
        scope: 'project',
        method: 'auto',
        rootDir: tmpRoot,
        homeDir: tmpHome,
        checkBinary: () => false,
      }),
      true,
    );
    assert.equal(
      installHost(HOSTS.opencode, {
        scope: 'local',
        method: 'copy',
        rootDir: tmpRoot,
        homeDir: tmpHome,
        checkBinary: () => false,
      }),
      true,
    );

    const healthyAll = diagnoseHosts(undefined, { rootDir: tmpRoot, homeDir: tmpHome });
    assert.equal(healthyAll.ok, true);
    assert.equal(healthyAll.failCount, 0);
    assert.equal(healthyAll.warnCount, 0);
    const grokHealthy = healthyAll.hosts.find((h) => h.id === 'grok');
    assert.equal(grokHealthy.installed, true);
    assert.equal(grokHealthy.status, 'ok');
    assert.deepEqual(grokHealthy.checks.map((c) => [c.code, c.scope, c.path]), [['healthy', 'host', null]]);
    assert.equal(await runCli(['doctor'], { rootDir: tmpRoot, homeDir: tmpHome }), 0);

    // 2. Malformed configs across all 7 config-bearing hosts
    // opencode (project invalid JSON)
    fs.writeFileSync(path.join(tmpRoot, 'opencode.json'), '{ bad json', 'utf8');
    let rep = diagnoseHost('opencode', { rootDir: tmpRoot, homeDir: tmpHome });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config' && c.scope === 'project' && c.severity === 'fail'));
    // Fix opencode project, test user non-array plugin
    fs.writeFileSync(path.join(tmpRoot, 'opencode.json'), JSON.stringify({ plugin: ['praxis@git+https://github.com/ouonet/praxis.git'] }), 'utf8');
    fs.mkdirSync(path.join(tmpHome, '.config', 'opencode'), { recursive: true });
    fs.writeFileSync(path.join(tmpHome, '.config', 'opencode', 'opencode.json'), JSON.stringify({ plugin: 'nope' }), 'utf8');
    rep = diagnoseHost('opencode', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'user' });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config' && c.scope === 'user'));

    // pi (.pi/settings.json non-array packages)
    fs.writeFileSync(path.join(tmpRoot, '.pi', 'settings.json'), JSON.stringify({ packages: 'bad' }), 'utf8');
    rep = diagnoseHost('pi', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'project' });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config'));

    // claude (.claude/settings.json + ~/.claude/plugins/installed_plugins.json)
    fs.writeFileSync(path.join(tmpRoot, '.claude', 'settings.json'), JSON.stringify({ enabledPlugins: ['bad'] }), 'utf8');
    rep = diagnoseHost('claude', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'project' });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config'));
    fs.mkdirSync(path.join(tmpHome, '.claude', 'plugins'), { recursive: true });
    fs.writeFileSync(path.join(tmpHome, '.claude', 'plugins', 'installed_plugins.json'), '{bad', 'utf8');
    rep = diagnoseHost('claude', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'user' });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config' && c.scope === 'user'));

    // codex (.codex/config.toml invalid TOML)
    fs.writeFileSync(path.join(tmpRoot, '.codex', 'config.toml'), '[plugins."praxis@praxis-marketplace"\nenabled = true\n', 'utf8');
    rep = diagnoseHost('codex', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'project' });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config'));

    // omp (.omp/plugins/package.json invalid JSON)
    fs.mkdirSync(path.join(tmpRoot, '.omp', 'plugins'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, '.omp', 'plugins', 'package.json'), '[]', 'utf8');
    rep = diagnoseHost('omp', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'project' });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config'));

    // grok (~/.grok/installed-plugins/registry.json invalid JSON)
    fs.mkdirSync(path.join(tmpHome, '.grok', 'installed-plugins'), { recursive: true });
    fs.writeFileSync(path.join(tmpHome, '.grok', 'installed-plugins', 'registry.json'), '{broken', 'utf8');
    rep = diagnoseHost('grok', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'user' });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config' && c.scope === 'user'));

    // qoder (.qoder-plugin/plugin.json invalid JSON)
    fs.writeFileSync(path.join(tmpRoot, '.qoder-plugin', 'plugin.json'), '{broken', 'utf8');
    rep = diagnoseHost('qoder', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'project' });
    assert.ok(rep.checks.some((c) => c.code === 'invalid-config'));

    assert.equal(await runCli(['doctor'], { rootDir: tmpRoot, homeDir: tmpHome }), 1);

    // 3. Incomplete skills & deduplication check
    fs.rmSync(path.join(tmpRoot, '.grok', 'skills', 'plan'), { recursive: true, force: true });
    rep = diagnoseHost('grok', { rootDir: tmpRoot, homeDir: tmpHome });
    const grokIncomplete = rep.checks.filter((c) => c.code === 'incomplete-skills');
    assert.equal(grokIncomplete.length, 1, 'Workspace check must be deduplicated when scope omitted');
    assert.equal(grokIncomplete[0].scope, 'project');
    assert.match(grokIncomplete[0].message, /plan/);

    const grokLocalOnly = diagnoseHost('grok', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'local' });
    assert.ok(grokLocalOnly.checks.some((c) => c.code === 'incomplete-skills' && c.scope === 'local'));

    // Dedicated plugin dir missing skill -> incomplete-skills
    fs.rmSync(path.join(tmpRoot, '.copilot', 'plugins', 'praxis', 'skills', 'ship'), { recursive: true, force: true });
    rep = diagnoseHost('copilot', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'project' });
    assert.ok(rep.checks.some((c) => c.code === 'incomplete-skills' && /ship/.test(c.message)));

    // 4. Dangling symlink detection (including broken rule symlink suppressing missing-praxis-rule)
    const isolatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-dangle-'));
    try {
      installHost(HOSTS.grok, { scope: 'project', method: 'copy', rootDir: isolatedRoot, homeDir: tmpHome, checkBinary: () => false });
      const grokRule = path.join(isolatedRoot, '.grok', 'rules', 'praxis.md');
      fs.rmSync(grokRule, { force: true });
      const linkType = os.platform() === 'win32' ? 'junction' : 'dir';
      fs.symlinkSync(path.join(isolatedRoot, 'nonexistent-target'), grokRule, linkType);

      const dangleRep = diagnoseHost('grok', { rootDir: isolatedRoot, homeDir: tmpHome, scope: 'project' });
      assert.equal(dangleRep.status, 'fail');
      assert.ok(dangleRep.checks.some((c) => c.code === 'dangling-symlink' && c.path === grokRule));
      assert.equal(
        dangleRep.checks.some((c) => c.code === 'missing-praxis-rule'),
        false,
        'Broken rule symlink must not also trigger missing-praxis-rule',
      );
      assert.equal(await runCli(['doctor', '--host', 'grok', '--scope', 'project'], { rootDir: isolatedRoot, homeDir: tmpHome }), 1);

      // Verify PRAXIS_SKILL_NAMES includes multiple skills and negative case for unrelated skills/references
      assert.ok(PRAXIS_SKILL_NAMES.includes('references'));
      const unrelatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-unrelated-'));
      try {
        fs.mkdirSync(path.join(unrelatedRoot, 'skills', 'references'), { recursive: true });
        fs.writeFileSync(path.join(unrelatedRoot, 'skills', 'references', 'custom.md'), '# unrelated', 'utf8');
        const qoderUnrelated = diagnoseHost('qoder', { rootDir: unrelatedRoot, homeDir: tmpHome });
        assert.equal(qoderUnrelated.status, 'ok');
        assert.equal(qoderUnrelated.checks.some((c) => c.code === 'incomplete-skills'), false);
      } finally {
        fs.rmSync(unrelatedRoot, { recursive: true, force: true });
      }
    } finally {
      fs.rmSync(isolatedRoot, { recursive: true, force: true });
    }

    // 5. Unreadable paths: portable EISDIR across OSes + POSIX EACCES where supported
    const dirErrRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-eisdir-'));
    try {
      fs.mkdirSync(path.join(dirErrRoot, 'opencode.json'), { recursive: true });
      const eisdirRep = diagnoseHost('opencode', { rootDir: dirErrRoot, homeDir: tmpHome, scope: 'project' });
      assert.equal(eisdirRep.status, 'fail');
      assert.ok(eisdirRep.checks.some((c) => c.code === 'unreadable-path' && c.path === path.join(dirErrRoot, 'opencode.json')));

      if (process.platform !== 'win32') {
        fs.mkdirSync(path.join(dirErrRoot, '.pi'), { recursive: true });
        const piCfg = path.join(dirErrRoot, '.pi', 'settings.json');
        fs.writeFileSync(piCfg, '{}', 'utf8');
        fs.chmodSync(piCfg, 0o000);
        protectedFiles.push(piCfg);
        const eaccesRep = diagnoseHost('pi', { rootDir: dirErrRoot, homeDir: tmpHome, scope: 'project' });
        assert.ok(eaccesRep.checks.some((c) => c.code === 'unreadable-path' && c.path === piCfg));
      }
    } finally {
      for (const f of protectedFiles) {
        try { fs.chmodSync(f, 0o644); } catch {}
      }
      fs.rmSync(dirErrRoot, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('praxis doctor checks rule isolation (agents vs antigravity), duplicates, conflicts, missing rules, and OpenCode dual-source warnings', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-rules-root-'));
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-rules-home-'));
  try {
    // 1. Cross-host isolation: agents-only install preserves user AGENTS.md without triggering antigravity warning
    fs.mkdirSync(path.join(tmpRoot, '.agents', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, '.agents', 'rules', 'AGENTS.md'), '# User Custom Team Rules\n', 'utf8');
    installHost(HOSTS.agents, { scope: 'project', method: 'copy', rootDir: tmpRoot, homeDir: tmpHome, checkBinary: () => false });

    let summary = diagnoseHosts(undefined, { rootDir: tmpRoot, homeDir: tmpHome });
    assert.equal(summary.ok, true);
    assert.equal(summary.warnCount, 0, 'agents install with preserved user AGENTS.md and managed praxis.md must emit zero warnings');
    assert.equal(diagnoseHost('antigravity', { rootDir: tmpRoot, homeDir: tmpHome }).checks.some((c) => c.code === 'unmanaged-rule-conflict'), false);

    // 2. Duplicate Praxis rules -> warn, exit 0
    fs.copyFileSync(path.resolve(import.meta.dirname, '..', 'rules', 'AGENTS.md'), path.join(tmpRoot, '.agents', 'rules', 'AGENTS.md'));
    summary = diagnoseHosts(['agents'], { rootDir: tmpRoot, homeDir: tmpHome });
    assert.ok(summary.hosts[0].checks.some((c) => c.code === 'duplicate-praxis-rules' && c.severity === 'warn'));
    assert.equal(await runCli(['doctor', '--host', 'agents'], { rootDir: tmpRoot, homeDir: tmpHome }), 0);

    // 3. Antigravity unmanaged rule conflict vs missing rule
    const agyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-doctor-agy-'));
    try {
      fs.mkdirSync(path.join(agyRoot, '.agents', 'rules'), { recursive: true });
      fs.writeFileSync(path.join(agyRoot, '.agents', 'rules', 'AGENTS.md'), '# User Custom AGENTS\n', 'utf8');
      installHost(HOSTS.antigravity, { scope: 'project', method: 'copy', rootDir: agyRoot, homeDir: tmpHome, checkBinary: () => false });

      let agyRep = diagnoseHost('antigravity', { rootDir: agyRoot, homeDir: tmpHome, scope: 'project' });
      assert.equal(agyRep.status, 'warn');
      assert.ok(agyRep.checks.some((c) => c.code === 'unmanaged-rule-conflict' && c.severity === 'warn'));

      // Remove rule completely -> missing-praxis-rule warn
      fs.rmSync(path.join(agyRoot, '.agents', 'rules', 'AGENTS.md'));
      agyRep = diagnoseHost('antigravity', { rootDir: agyRoot, homeDir: tmpHome, scope: 'project' });
      assert.ok(agyRep.checks.some((c) => c.code === 'missing-praxis-rule' && c.severity === 'warn'));
    } finally {
      fs.rmSync(agyRoot, { recursive: true, force: true });
    }

    // 4. OpenCode user dual-source warning (exit 0)
    const ocUserDir = path.join(tmpHome, '.config', 'opencode');
    fs.mkdirSync(path.join(ocUserDir, 'plugins'), { recursive: true });
    fs.writeFileSync(
      path.join(ocUserDir, 'opencode.json'),
      JSON.stringify({ plugin: ['praxis@git+https://github.com/ouonet/praxis.git'] }),
      'utf8',
    );
    fs.writeFileSync(path.join(ocUserDir, 'plugins', 'praxis.js'), 'export default {};', 'utf8');
    const ocRep = diagnoseHost('opencode', { rootDir: tmpRoot, homeDir: tmpHome, scope: 'user' });
    assert.equal(ocRep.status, 'warn');
    assert.ok(ocRep.checks.some((c) => c.code === 'opencode-dual-source' && c.severity === 'warn'));
    assert.equal(await runCli(['doctor', '--host', 'opencode', '--scope', 'user'], { rootDir: tmpRoot, homeDir: tmpHome }), 0);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});
