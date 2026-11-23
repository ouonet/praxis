import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HOSTS } from './hosts.js';
import { getHostAdapter } from './adapters/index.js';
import {
  PRAXIS_HOOK_FILES,
  PRAXIS_SKILL_NAMES,
  hasPraxisOpencodeConfigText,
  isHomeDirectory,
  isPraxisManagedRuleFile,
  normalizeScope,
  pathExistsLstat,
  readFileSafe,
  readValidatedOpencodeJson,
  resolveTargetPath,
  scanTomlLines,
} from './shared.js';

const PRAXIS_WORKFLOW_SKILLS = Object.freeze(PRAXIS_SKILL_NAMES.filter((name) => name !== 'references'));
const WORKFLOW_SKILL_SET = new Set(PRAXIS_WORKFLOW_SKILLS);
const UNREADABLE_CODES = new Set(['EACCES', 'EPERM', 'EISDIR']);

/**
 * Determine whether a filesystem path is a broken/dangling symbolic link.
 * Returns `false` when the path does not exist, is not a symlink, or fails with permission errors.
 */
export function isDanglingSymlink(filePath) {
  let lstat;
  try {
    lstat = fs.lstatSync(filePath);
  } catch {
    return false;
  }
  if (!lstat.isSymbolicLink()) return false;

  try {
    fs.statSync(filePath);
    return false;
  } catch (err) {
    return Boolean(err && (err.code === 'ENOENT' || err.code === 'ENOTDIR' || err.code === 'ELOOP'));
  }
}

/**
 * Perform structural validation of basic TOML syntax without external dependencies.
 */
export function validateTomlBasic(content) {
  if (typeof content !== 'string') {
    return { valid: false, error: 'TOML content must be a string' };
  }
  const scan = scanTomlLines(content);
  if (scan.hasMalformedHeader) {
    return { valid: false, error: 'Malformed TOML table header syntax' };
  }
  if (scan.eofState.inMultiBasic || scan.eofState.inMultiLiteral) {
    return { valid: false, error: 'Unclosed multiline TOML string literal' };
  }
  if (scan.eofState.bracketDepth > 0) {
    return { valid: false, error: 'Unclosed bracket in TOML array or inline table' };
  }
  const badStringLine = scan.annotated.findIndex((item) => item.hasUnclosedString);
  if (badStringLine !== -1) {
    return { valid: false, error: `Unclosed quoted string on line ${badStringLine + 1}` };
  }
  return { valid: true, error: null };
}

function makeCheck(host, scope, code, severity, targetPath, message, hint = null) {
  return {
    host,
    scope,
    code,
    severity,
    path: targetPath ?? null,
    message,
    hint,
  };
}

function isUnreadableErr(err, { treatEisdir = false } = {}) {
  if (!err) return false;
  if (err.code === 'EACCES' || err.code === 'EPERM') return true;
  if (treatEisdir && err.code === 'EISDIR') return true;
  return Boolean(err.code && err.code !== 'ENOENT' && err.code !== 'ENOTDIR' && err.code !== 'ELOOP');
}

function recordUnreadable(ctx, scope, targetPath, err) {
  if (ctx.unreadablePaths.has(targetPath)) return;
  ctx.unreadablePaths.add(targetPath);
  ctx.checks.push(
    makeCheck(
      ctx.hostId,
      scope,
      'unreadable-path',
      'fail',
      targetPath,
      `Unreadable path (${err?.code || 'I/O error'}): ${err?.message || targetPath}`,
      'Check filesystem permissions or ensure a file path is not occupied by a directory.',
    ),
  );
}

function probeReadableFile(ctx, scope, filePath) {
  if (ctx.unreadablePaths.has(filePath) || ctx.brokenPaths.has(filePath)) {
    return { exists: false, skip: true, content: null };
  }
  if (isDanglingSymlink(filePath)) {
    ctx.brokenPaths.add(filePath);
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'dangling-symlink',
        'fail',
        filePath,
        `Dangling symlink at ${filePath}`,
        'Run `npx @ouonet/praxis install --force` or remove the broken symlink.',
      ),
    );
    return { exists: false, skip: true, content: null };
  }
  try {
    fs.lstatSync(filePath);
  } catch (err) {
    if (isUnreadableErr(err)) {
      recordUnreadable(ctx, scope, filePath, err);
      return { exists: false, skip: true, content: null };
    }
    return { exists: false, skip: false, content: null };
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { exists: true, skip: false, content };
  } catch (err) {
    recordUnreadable(ctx, scope, filePath, err);
    return { exists: false, skip: true, content: null };
  }
}

function checkPathDanglingOrUnreadable(ctx, scope, targetPath, { expectFile = false } = {}) {
  if (!targetPath || ctx.unreadablePaths.has(targetPath) || ctx.brokenPaths.has(targetPath)) {
    return;
  }
  if (isDanglingSymlink(targetPath)) {
    ctx.brokenPaths.add(targetPath);
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'dangling-symlink',
        'fail',
        targetPath,
        `Dangling symlink at ${targetPath}`,
        'Run `npx @ouonet/praxis install --force` or remove the broken symlink.',
      ),
    );
    return;
  }
  try {
    const lstat = fs.lstatSync(targetPath);
    if (lstat.isSymbolicLink()) {
      fs.statSync(targetPath);
    }
    if (expectFile && fs.statSync(targetPath).isDirectory()) {
      recordUnreadable(ctx, scope, targetPath, { code: 'EISDIR', message: 'Expected file but found directory' });
    }
  } catch (err) {
    if (isUnreadableErr(err, { treatEisdir: expectFile })) {
      recordUnreadable(ctx, scope, targetPath, err);
    }
  }
}

function validateJsonConfig(ctx, scope, filePath, validatorFn = null) {
  const probed = probeReadableFile(ctx, scope, filePath);
  if (probed.skip || !probed.exists) return;

  let parsed;
  try {
    parsed = JSON.parse(probed.content);
  } catch (err) {
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'invalid-config',
        'fail',
        filePath,
        `Invalid JSON in ${filePath}: ${err.message}`,
        'Fix JSON syntax errors in this configuration file.',
      ),
    );
    return;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'invalid-config',
        'fail',
        filePath,
        `Invalid JSON config root in ${filePath}: expected an object.`,
        'Ensure the top-level JSON structure is an object `{ ... }`.',
      ),
    );
    return;
  }

  if (validatorFn) {
    const reason = validatorFn(parsed);
    if (reason) {
      ctx.checks.push(
        makeCheck(
          ctx.hostId,
          scope,
          'invalid-config',
          'fail',
          filePath,
          `Invalid config field in ${filePath}: ${reason}`,
          'Repair the invalid configuration field.',
        ),
      );
    }
  }
}

function validateOpencodeConfig(ctx, scope, filePath) {
  const probed = probeReadableFile(ctx, scope, filePath);
  if (probed.skip || !probed.exists) return;

  try {
    readValidatedOpencodeJson(filePath);
  } catch (err) {
    if (err && UNREADABLE_CODES.has(err.code)) {
      recordUnreadable(ctx, scope, filePath, err);
    } else {
      ctx.checks.push(
        makeCheck(
          ctx.hostId,
          scope,
          'invalid-config',
          'fail',
          filePath,
          err.message,
          'Fix opencode.json syntax or ensure `plugin` is an array.',
        ),
      );
    }
  }
}

function validateTomlConfig(ctx, scope, filePath) {
  const probed = probeReadableFile(ctx, scope, filePath);
  if (probed.skip || !probed.exists) return;

  const res = validateTomlBasic(probed.content);
  if (!res.valid) {
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'invalid-config',
        'fail',
        filePath,
        `Invalid TOML in ${filePath}: ${res.error}`,
        'Fix the TOML syntax error in config.toml.',
      ),
    );
  }
}

function readDirEntriesSafe(ctx, scope, dirPath) {
  if (ctx.unreadablePaths.has(dirPath) || ctx.brokenPaths.has(dirPath)) {
    return null;
  }
  if (isDanglingSymlink(dirPath)) {
    ctx.brokenPaths.add(dirPath);
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'dangling-symlink',
        'fail',
        dirPath,
        `Dangling symlink at ${dirPath}`,
        'Run `npx @ouonet/praxis install --force` or remove the broken symlink.',
      ),
    );
    return null;
  }
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return null;
    return fs.readdirSync(dirPath);
  } catch (err) {
    if (isUnreadableErr(err)) {
      recordUnreadable(ctx, scope, dirPath, err);
    }
    return null;
  }
}

function inspectSkillsDir(ctx, scope, skillsDir, { dedicatedPlugin = false } = {}) {
  const entries = readDirEntriesSafe(ctx, scope, skillsDir);
  if (entries === null) return;

  const hasPraxisWorkflowSkill = entries.some((name) => WORKFLOW_SKILL_SET.has(name));
  if (!dedicatedPlugin && !hasPraxisWorkflowSkill) {
    return;
  }

  const missing = [];
  for (const skillName of PRAXIS_SKILL_NAMES) {
    const skillPath = path.join(skillsDir, skillName);
    if (isDanglingSymlink(skillPath)) {
      checkPathDanglingOrUnreadable(ctx, scope, skillPath);
      continue;
    }

    let skillStat;
    try {
      skillStat = fs.statSync(skillPath);
    } catch (err) {
      if (isUnreadableErr(err)) {
        recordUnreadable(ctx, scope, skillPath, err);
      } else {
        missing.push(skillName);
      }
      continue;
    }

    if (!skillStat.isDirectory()) {
      missing.push(skillName);
      continue;
    }

    if (skillName === 'references') {
      const refEntries = readDirEntriesSafe(ctx, scope, skillPath);
      if (refEntries !== null && !refEntries.some((f) => f.endsWith('.md'))) {
        missing.push('references');
      }
      continue;
    }

    const mdPath = path.join(skillPath, 'SKILL.md');
    const probedMd = probeReadableFile(ctx, scope, mdPath);
    if (!probedMd.skip && !probedMd.exists) {
      missing.push(skillName);
    }
  }

  if (missing.length > 0) {
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'incomplete-skills',
        'fail',
        skillsDir,
        `Incomplete Praxis skills in ${skillsDir}; missing or invalid: ${missing.join(', ')}`,
        'Run `npx @ouonet/praxis update` or `install --force` to restore missing skills.',
      ),
    );
  }
}

function inspectDedicatedPluginRoot(ctx, scope, pluginRoot) {
  checkPathDanglingOrUnreadable(ctx, scope, pluginRoot);
  if (ctx.brokenPaths.has(pluginRoot) || ctx.unreadablePaths.has(pluginRoot)) return;

  const entries = readDirEntriesSafe(ctx, scope, pluginRoot);
  if (entries === null) return;

  const pluginSkills = path.join(pluginRoot, 'skills');
  const hasSkillsSubdir = pathExistsLstat(pluginSkills);
  const hasPluginJson = pathExistsLstat(path.join(pluginRoot, 'plugin.json'));

  if (hasSkillsSubdir) {
    inspectSkillsDir(ctx, scope, pluginSkills, { dedicatedPlugin: true });
  } else if (hasPluginJson) {
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'incomplete-skills',
        'fail',
        pluginSkills,
        `Missing skills directory under installed plugin at ${pluginRoot}`,
        'Run `npx @ouonet/praxis install --force` to reinstall plugin skills.',
      ),
    );
  }
}

function probeRuleFile(ctx, scope, rulePath) {
  const probed = probeReadableFile(ctx, scope, rulePath);
  if (probed.skip) {
    return {
      exists: false,
      broken: ctx.brokenPaths.has(rulePath),
      unreadable: ctx.unreadablePaths.has(rulePath),
      managed: false,
    };
  }
  if (!probed.exists) {
    return { exists: false, broken: false, unreadable: false, managed: false };
  }
  return {
    exists: true,
    broken: false,
    unreadable: false,
    managed: isPraxisManagedRuleFile(rulePath),
  };
}

function checkDuplicateManagedRules(ctx, scope, rulesDir, agentsState, praxisState) {
  if (agentsState.managed && praxisState.managed) {
    ctx.checks.push(
      makeCheck(
        ctx.hostId,
        scope,
        'duplicate-praxis-rules',
        'warn',
        rulesDir,
        `Both AGENTS.md and praxis.md are Praxis-managed in ${rulesDir}`,
        'Run `npx @ouonet/praxis update` or remove the redundant Praxis rule file.',
      ),
    );
  }
}

function hasAnyWorkflowSkillInDir(dirPath) {
  if (!pathExistsLstat(dirPath) || isDanglingSymlink(dirPath)) return false;
  try {
    const entries = fs.readdirSync(dirPath);
    return entries.some((name) => WORKFLOW_SKILL_SET.has(name));
  } catch {
    return false;
  }
}

function isPlainObjectOrInvalid(val) {
  return val !== undefined && (!val || typeof val !== 'object' || Array.isArray(val));
}

function validatePiSettings(cfg) {
  for (const key of ['packages', 'extensions', 'skills']) {
    if (cfg[key] !== undefined && !Array.isArray(cfg[key])) {
      return `\`${key}\` must be an array`;
    }
  }
  return null;
}

function hasGrokRegistryEntry(registryPath) {
  const txt = readFileSafe(registryPath);
  if (!txt) return false;
  try {
    const parsed = JSON.parse(txt);
    return Boolean(
      parsed?.repos &&
      Object.values(parsed.repos).some((repo) => repo?.plugins && Object.keys(repo.plugins).includes('praxis')),
    );
  } catch {
    return false;
  }
}

function inspectHostScope(ctx, host, scope, { rootDir, homeDir }) {
  const workspaceTarget = (rel) => path.resolve(rootDir, rel);
  const homeTarget = (...segments) => path.join(homeDir, ...segments);

  switch (host.id) {
    case 'claude': {
      const base = scope === 'user' ? homeTarget('.claude') : workspaceTarget('.claude');
      const pluginRoot = path.join(base, 'plugins', 'praxis');
      inspectDedicatedPluginRoot(ctx, scope, pluginRoot);
      validateJsonConfig(ctx, scope, path.join(base, 'settings.json'), (cfg) =>
        isPlainObjectOrInvalid(cfg.enabledPlugins) ? '`enabledPlugins` must be an object' : null,
      );
      if (scope === 'user') {
        validateJsonConfig(ctx, scope, path.join(base, 'plugins', 'installed_plugins.json'), (cfg) =>
          isPlainObjectOrInvalid(cfg.plugins) ? '`plugins` must be an object' : null,
        );
        checkPathDanglingOrUnreadable(ctx, scope, path.join(base, 'plugins', 'cache'));
      }
      break;
    }

    case 'codex': {
      const base = scope === 'user' ? homeTarget('.codex') : workspaceTarget('.codex');
      inspectDedicatedPluginRoot(ctx, scope, path.join(base, 'plugins', 'praxis'));
      if (scope === 'user') {
        checkPathDanglingOrUnreadable(ctx, scope, path.join(base, '.tmp', 'marketplaces', 'praxis-marketplace'));
        checkPathDanglingOrUnreadable(ctx, scope, path.join(base, 'plugins', 'cache', 'praxis-marketplace'));
      }
      validateTomlConfig(ctx, scope, path.join(base, 'config.toml'));
      break;
    }

    case 'opencode': {
      if (scope === 'project') {
        validateOpencodeConfig(ctx, scope, workspaceTarget('opencode.json'));
        break;
      }
      const ocDir = scope === 'user' ? homeTarget('.config', 'opencode') : workspaceTarget('.opencode');
      const pluginFile = path.join(ocDir, 'plugins', 'praxis.js');
      const cfgFile = path.join(ocDir, 'opencode.json');
      checkPathDanglingOrUnreadable(ctx, scope, pluginFile, { expectFile: true });
      inspectSkillsDir(ctx, scope, path.join(ocDir, 'skills'));
      if (scope === 'user') {
        validateOpencodeConfig(ctx, scope, cfgFile);
        const cfgContent = readFileSafe(cfgFile);
        if (
          hasPraxisOpencodeConfigText(cfgContent) &&
          !ctx.brokenPaths.has(pluginFile) &&
          !ctx.unreadablePaths.has(pluginFile) &&
          pathExistsLstat(pluginFile)
        ) {
          ctx.checks.push(
            makeCheck(
              ctx.hostId,
              scope,
              'opencode-dual-source',
              'warn',
              pluginFile,
              `Both ${cfgFile} and local ${pluginFile} configure Praxis for OpenCode.`,
              'Keep either the opencode.json plugin entry (--method auto) or local plugins/praxis.js (--method copy), not both.',
            ),
          );
        }
      }
      break;
    }

    case 'copilot': {
      const pluginRoot = scope === 'user'
        ? resolveTargetPath(host, 'user', rootDir, homeDir)
        : workspaceTarget('.copilot/plugins/praxis');
      inspectDedicatedPluginRoot(ctx, scope, pluginRoot);
      break;
    }

    case 'antigravity': {
      const pluginRoots = scope === 'user'
        ? [homeTarget('.gemini', 'config', 'plugins', 'praxis'), homeTarget('.gemini', 'antigravity-ide', 'plugins', 'praxis')]
        : [workspaceTarget('.agents/plugins/praxis')];
      for (const rootPath of pluginRoots) {
        inspectDedicatedPluginRoot(ctx, scope, rootPath);
      }

      const skillsDirs = scope === 'user'
        ? [homeTarget('.gemini', 'config', 'skills')]
        : [workspaceTarget('.agents/skills')];
      for (const sd of skillsDirs) {
        inspectSkillsDir(ctx, scope, sd);
      }

      const rulesDir = scope === 'user' ? homeTarget('.gemini', 'config', 'rules') : workspaceTarget('.agents/rules');
      checkPathDanglingOrUnreadable(ctx, scope, rulesDir);
      const agentsRulePath = path.join(rulesDir, 'AGENTS.md');
      const praxisRulePath = path.join(rulesDir, 'praxis.md');
      const agentsState = probeRuleFile(ctx, scope, agentsRulePath);
      const praxisState = probeRuleFile(ctx, scope, praxisRulePath);
      checkDuplicateManagedRules(ctx, scope, rulesDir, agentsState, praxisState);

      const agyOwnedInScope =
        pluginRoots.some((p) => pathExistsLstat(p)) ||
        (scope === 'user' && hasAnyWorkflowSkillInDir(homeTarget('.gemini', 'config', 'skills')));

      if (agyOwnedInScope) {
        if (agentsState.exists && !agentsState.managed) {
          ctx.checks.push(
            makeCheck(
              ctx.hostId,
              scope,
              'unmanaged-rule-conflict',
              'warn',
              agentsRulePath,
              `User-owned rule file at ${agentsRulePath} prevents Praxis-managed AGENTS.md updates.`,
              'Include Praxis triage rules manually or rename the existing AGENTS.md before reinstalling.',
            ),
          );
        } else if (!agentsState.managed && !praxisState.managed && !agentsState.broken && !agentsState.unreadable && !praxisState.broken && !praxisState.unreadable) {
          ctx.checks.push(
            makeCheck(
              ctx.hostId,
              scope,
              'missing-praxis-rule',
              'warn',
              agentsRulePath,
              `Antigravity Praxis install in ${scope} scope is missing a Praxis-managed rule file at ${agentsRulePath}.`,
              'Run `npx @ouonet/praxis install --host antigravity` to install rules/AGENTS.md.',
            ),
          );
        }
      }
      break;
    }

    case 'pi': {
      if (scope === 'user') {
        inspectDedicatedPluginRoot(ctx, scope, homeTarget('.pi', 'plugins', 'praxis'));
        inspectSkillsDir(ctx, scope, homeTarget('.pi', 'skills'));
        inspectSkillsDir(ctx, scope, homeTarget('.pi', 'agent', 'skills'));
        validateJsonConfig(ctx, scope, homeTarget('.pi', 'agent', 'settings.json'), validatePiSettings);
      } else {
        inspectSkillsDir(ctx, scope, workspaceTarget('.pi/skills'));
        validateJsonConfig(ctx, scope, workspaceTarget('.pi/settings.json'), validatePiSettings);
      }
      break;
    }

    case 'omp': {
      const ompBase = scope === 'user' ? homeTarget('.omp') : workspaceTarget('.omp');
      for (const p of [
        path.join(ompBase, 'plugins', 'node_modules', 'praxis'),
        path.join(ompBase, 'plugins', 'node_modules', '@ouonet', 'praxis'),
        path.join(ompBase, 'plugins', 'praxis'),
      ]) {
        inspectDedicatedPluginRoot(ctx, scope, p);
      }
      inspectSkillsDir(ctx, scope, path.join(ompBase, 'skills'));
      validateJsonConfig(ctx, scope, path.join(ompBase, 'plugins', 'package.json'));
      validateJsonConfig(ctx, scope, path.join(ompBase, 'plugins', 'omp-plugins.lock.json'));
      break;
    }

    case 'qoder': {
      if (scope === 'user') {
        const pluginRoot = homeTarget('.qoder-cn', 'plugins', 'praxis');
        inspectDedicatedPluginRoot(ctx, scope, pluginRoot);
        checkPathDanglingOrUnreadable(ctx, scope, homeTarget('.qoder-cn', 'praxis'));
        checkPathDanglingOrUnreadable(ctx, scope, homeTarget('.qoder', 'plugins', 'praxis'));
        validateJsonConfig(ctx, scope, path.join(pluginRoot, 'plugin.json'));
      } else {
        inspectSkillsDir(ctx, scope, workspaceTarget('skills'));
        validateJsonConfig(ctx, scope, workspaceTarget('.qoder-plugin/plugin.json'));
      }
      break;
    }

    case 'grok': {
      const grokRoot = scope === 'user' ? homeTarget('.grok') : workspaceTarget('.grok');
      const pluginRoot = path.join(grokRoot, 'plugins', 'praxis');
      const skillsDir = path.join(grokRoot, 'skills');
      const rulesDir = path.join(grokRoot, 'rules');
      inspectDedicatedPluginRoot(ctx, scope, pluginRoot);
      inspectSkillsDir(ctx, scope, skillsDir);

      let registryInstalled = false;
      if (scope === 'user') {
        const regPath = path.join(grokRoot, 'installed-plugins', 'registry.json');
        validateJsonConfig(ctx, scope, regPath);
        registryInstalled = hasGrokRegistryEntry(regPath);
      }

      checkPathDanglingOrUnreadable(ctx, scope, rulesDir);
      const agentsRulePath = path.join(rulesDir, 'AGENTS.md');
      const praxisRulePath = path.join(rulesDir, 'praxis.md');
      const agentsState = probeRuleFile(ctx, scope, agentsRulePath);
      const praxisState = probeRuleFile(ctx, scope, praxisRulePath);
      checkDuplicateManagedRules(ctx, scope, rulesDir, agentsState, praxisState);

      const grokInstalledInScope =
        pathExistsLstat(pluginRoot) || hasAnyWorkflowSkillInDir(skillsDir) || registryInstalled;
      if (grokInstalledInScope) {
        if (praxisState.exists && !praxisState.managed && !agentsState.managed) {
          ctx.checks.push(
            makeCheck(
              ctx.hostId,
              scope,
              'unmanaged-rule-conflict',
              'warn',
              praxisRulePath,
              `User-owned rule file at ${praxisRulePath} blocks Praxis triage injection for Grok.`,
              'Remove or rename the existing praxis.md and reinstall with `npx @ouonet/praxis install --host grok`.',
            ),
          );
        } else if (!praxisState.managed && !agentsState.managed && !agentsState.broken && !agentsState.unreadable && !praxisState.broken && !praxisState.unreadable) {
          ctx.checks.push(
            makeCheck(
              ctx.hostId,
              scope,
              'missing-praxis-rule',
              'warn',
              praxisRulePath,
              `Grok Praxis install in ${scope} scope is missing ${praxisRulePath} (Grok ignores SessionStart stdout).`,
              'Run `npx @ouonet/praxis install --host grok` to install rules/praxis.md.',
            ),
          );
        }
      }
      break;
    }

    case 'agents': {
      const targetBase = scope === 'user' ? homeTarget('.agents') : workspaceTarget('.agents');
      const hooksDir = path.join(targetBase, 'hooks');
      const skillsDir = path.join(targetBase, 'skills');
      const rulesDir = path.join(targetBase, 'rules');

      for (const hookFile of PRAXIS_HOOK_FILES) {
        checkPathDanglingOrUnreadable(ctx, scope, path.join(hooksDir, hookFile), { expectFile: true });
      }
      inspectSkillsDir(ctx, scope, skillsDir);
      checkPathDanglingOrUnreadable(ctx, scope, rulesDir);

      const agentsRulePath = path.join(rulesDir, 'AGENTS.md');
      const praxisRulePath = path.join(rulesDir, 'praxis.md');
      const agentsState = probeRuleFile(ctx, scope, agentsRulePath);
      const praxisState = probeRuleFile(ctx, scope, praxisRulePath);
      checkDuplicateManagedRules(ctx, scope, rulesDir, agentsState, praxisState);

      const hasAntigravityPlugin = pathExistsLstat(path.join(targetBase, 'plugins', 'praxis'));
      const agentsStandalone =
        !hasAntigravityPlugin &&
        (pathExistsLstat(path.join(hooksDir, 'session-start')) || hasAnyWorkflowSkillInDir(skillsDir));

      if (agentsStandalone && !agentsState.managed && praxisState.exists && !praxisState.managed) {
        ctx.checks.push(
          makeCheck(
            ctx.hostId,
            scope,
            'unmanaged-rule-conflict',
            'warn',
            praxisRulePath,
            `User-owned rule file at ${praxisRulePath} prevents Praxis-managed rule installation.`,
            'Rename the existing praxis.md or move custom instructions into AGENTS.md.',
          ),
        );
      }
      break;
    }

    default:
      break;
  }
}

function deduplicateWorkspaceChecks(checks, deduplicateWorkspace) {
  if (!deduplicateWorkspace) return checks;
  const seenWorkspaceKeys = new Set();
  const deduped = [];
  for (const check of checks) {
    if (check.scope === 'project' || check.scope === 'local') {
      const key = `${check.code}::${check.path || ''}`;
      if (seenWorkspaceKeys.has(key)) continue;
      seenWorkspaceKeys.add(key);
    }
    deduped.push(check);
  }
  return deduped;
}

/**
 * Run read-only health diagnostics for a single host.
 */
export function diagnoseHost(hostOrId, options = {}) {
  const adapter = getHostAdapter(hostOrId);
  const host = HOSTS[adapter.id];
  const rootDir = options.rootDir || process.cwd();
  const homeDir = options.homeDir || os.homedir();
  const isHome = isHomeDirectory(rootDir, homeDir);

  const hasExplicitScope = options.scope !== undefined && options.scope !== null && options.scope !== '';
  const explicitScope = hasExplicitScope ? normalizeScope(options.scope, rootDir) : null;

  const ctx = {
    hostId: host.id,
    checks: [],
    brokenPaths: new Set(),
    unreadablePaths: new Set(),
  };

  let scopesToCheck;
  if (explicitScope) {
    if (isHome && (explicitScope === 'project' || explicitScope === 'local')) {
      ctx.checks.push(
        makeCheck(
          host.id,
          explicitScope,
          'scope-skipped-home',
          'warn',
          null,
          `Skipped ${explicitScope} scope inspection inside the user home directory.`,
          'Run inside a project repository or pass `--scope user`.',
        ),
      );
      scopesToCheck = [];
    } else {
      scopesToCheck = [explicitScope];
    }
  } else {
    scopesToCheck = isHome ? ['user'] : ['user', 'project', 'local'];
  }

  for (const scope of scopesToCheck) {
    inspectHostScope(ctx, host, scope, { rootDir, homeDir });
  }

  const rawStatus = adapter.getStatus({
    host,
    rootDir,
    homeDir,
    isHome,
    readFileSafe,
  });

  const installed = scopesToCheck.some((s) => {
    if (s === 'user') return Boolean(rawStatus?.userInstalled);
    if (s === 'project') return Boolean(rawStatus?.projectInstalled);
    if (s === 'local') return Boolean(rawStatus?.localInstalled);
    return false;
  });

  const dedupedChecks = deduplicateWorkspaceChecks(
    ctx.checks,
    !explicitScope && !isHome && host.id !== 'opencode',
  );

  if (dedupedChecks.length === 0 && installed) {
    dedupedChecks.push(
      makeCheck(
        host.id,
        explicitScope || 'host',
        'healthy',
        'ok',
        null,
        `${host.displayName} installation is healthy.`,
        null,
      ),
    );
  }

  const hasFail = dedupedChecks.some((c) => c.severity === 'fail');
  const hasWarn = dedupedChecks.some((c) => c.severity === 'warn');
  const status = hasFail ? 'fail' : hasWarn ? 'warn' : 'ok';

  return {
    id: host.id,
    displayName: host.displayName,
    installed,
    status,
    checks: dedupedChecks,
  };
}

/**
 * Run read-only health diagnostics across a set of hosts (defaults to all HOSTS).
 */
export function diagnoseHosts(hosts = Object.values(HOSTS), options = {}) {
  const targetList = hosts === undefined || hosts === null ? Object.values(HOSTS) : hosts;
  const hostReports = [];
  for (const entry of targetList) {
    hostReports.push(diagnoseHost(entry, options));
  }

  let failCount = 0;
  let warnCount = 0;
  let okCount = 0;
  for (const report of hostReports) {
    for (const check of report.checks) {
      if (check.severity === 'fail') failCount += 1;
      else if (check.severity === 'warn') warnCount += 1;
      else if (check.severity === 'ok') okCount += 1;
    }
  }

  return {
    ok: failCount === 0,
    failCount,
    warnCount,
    okCount,
    hosts: hostReports,
  };
}
