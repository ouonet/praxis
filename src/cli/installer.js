import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, execFileSync } from 'node:child_process';
import { HOSTS, formatCommandStep } from './hosts.js';

export function checkBinaryAvailable(binaryName) {
  if (!binaryName) return false;
  const binaries = Array.isArray(binaryName) ? binaryName : [binaryName];
  const isWin = os.platform() === 'win32';
  for (const bin of binaries) {
    const cmd = isWin ? `where ${bin}` : `command -v ${bin}`;
    try {
      execSync(cmd, { stdio: 'ignore' });
      return true;
    } catch {}
  }
  return false;
}

export function isHomeDirectory(dir = process.cwd()) {
  try {
    return path.resolve(dir).toLowerCase() === path.resolve(os.homedir()).toLowerCase();
  } catch {
    return false;
  }
}

export function normalizeScope(scope, rootDir = process.cwd()) {
  if (scope === undefined || scope === null || scope === '') {
    return 'user';
  }
  if (typeof scope !== 'string') {
    throw new RangeError(`Invalid scope: ${String(scope)}. Valid scopes: user, global, project, workspace, local`);
  }
  const s = scope.toLowerCase().trim();
  if (s === '') return 'user';
  if (s === 'global' || s === 'user') return 'user';
  if (s === 'local') return 'local';
  if (s === 'project' || s === 'workspace') return 'project';
  throw new RangeError(`Invalid scope: "${scope}". Valid scopes: user, global, project, workspace, local`);
}

export function normalizeMethod(method) {
  if (method === undefined || method === null || method === '') {
    return 'auto';
  }
  if (typeof method !== 'string') {
    throw new RangeError(`Invalid method: ${String(method)}. Valid methods: auto, native, link, copy`);
  }
  const m = method.toLowerCase().trim();
  if (m === '') return 'auto';
  if (m === 'auto' || m === 'native' || m === 'link' || m === 'copy') {
    return m;
  }
  throw new RangeError(`Invalid method: "${method}". Valid methods: auto, native, link, copy`);
}

export function validateRef(ref) {
  if (ref === undefined || ref === null || ref === '') {
    return null;
  }
  if (typeof ref !== 'string') {
    throw new RangeError(`Invalid ref: ${String(ref)}. Expected git branch, tag, or commit.`);
  }
  const trimmed = ref.trim();
  if (trimmed === '') return null;
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(trimmed) ||
    trimmed.includes('..') ||
    trimmed.includes('@{') ||
    trimmed.includes('//') ||
    trimmed.endsWith('/') ||
    trimmed.endsWith('.lock')
  ) {
    throw new RangeError(`Invalid ref: "${ref}". Must be a valid git ref name without shell metacharacters.`);
  }
  return trimmed;
}

export function supportsRef(host, action, scope, method, { binaryAvailable = false } = {}) {
  const normScope = normalizeScope(scope);
  const normMethod = normalizeMethod(method);
  const normAction = String(action || '').toLowerCase();
  if (normAction !== 'install' && normAction !== 'update') {
    return false;
  }
  if (host.id === 'claude') {
    return normAction === 'install' && (normMethod === 'auto' || normMethod === 'native') && Boolean(binaryAvailable);
  }
  if (host.id === 'pi' || host.id === 'omp') {
    return (normMethod === 'auto' || normMethod === 'native') && Boolean(binaryAvailable);
  }
  if (host.id === 'opencode') {
    return (normScope === 'project' || normScope === 'user') && normMethod === 'auto';
  }
  return false;
}

function runCommandSteps(steps, { dryRun = false, rootDir = process.cwd() } = {}) {
  if (!Array.isArray(steps) || steps.length === 0) return false;
  if (dryRun) {
    for (const step of steps) {
      console.log(`  [dry-run] Executing CLI command: ${formatCommandStep(step)}`);
    }
    return true;
  }
  for (const step of steps) {
    const formatted = formatCommandStep(step);
    console.log(`  Executing: ${formatted}`);
    try {
      execFileSync(step.bin, step.args, {
        stdio: 'inherit',
        cwd: rootDir,
        shell: process.platform === 'win32',
      });
    } catch (err) {
      if (step.allowFailure) {
        console.warn(`  [warning] Non-fatal step failed (${formatted}): ${err.message}`);
      } else {
        console.warn(`  [warning] CLI command failed (${formatted}): ${err.message}`);
        return false;
      }
    }
  }
  return true;
}

export function resolveTargetPath(host, scope, rootDir = process.cwd(), homeDir = os.homedir()) {
  const normScope = normalizeScope(scope, rootDir);
  if (normScope === 'user') {
    if (homeDir && path.resolve(homeDir) !== path.resolve(os.homedir())) {
      const rel = path.relative(os.homedir(), host.userTarget);
      if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
        return path.join(homeDir, rel);
      }
    }
    return host.userTarget;
  }
  if (normScope === 'local') {
    return path.resolve(rootDir, host.localTarget || host.projectTarget);
  }
  return path.resolve(rootDir, host.projectTarget);
}

export function pathExistsLstat(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

export function isPraxisPluginEntry(entry) {
  if (typeof entry !== 'string') return false;
  const s = entry.trim();
  return (
    /^(?:@ouonet\/)?praxis(?:[@#\/]|$)/i.test(s) ||
    /\/ouonet\/praxis(?:\.git)?(?:#.*)?$/i.test(s)
  );
}

export function readValidatedOpencodeJson(filePath) {
  if (!pathExistsLstat(filePath)) {
    return { exists: false, config: {} };
  }
  let raw = '';
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read opencode.json at ${filePath}: ${err.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid opencode.json at ${filePath}: ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid opencode.json at ${filePath}: root must be an object`);
  }
  if (parsed.plugin !== undefined && !Array.isArray(parsed.plugin)) {
    throw new Error(`Invalid opencode.json at ${filePath}: plugin field must be an array`);
  }
  return { exists: true, config: parsed };
}

export function isPraxisManagedRuleFile(filePath) {
  if (!pathExistsLstat(filePath)) {
    return false;
  }
  try {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() && !stat.isSymbolicLink()) {
      return false;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return (
      content.includes('<!-- praxis:managed-rule -->') ||
      (content.includes('# Praxis Triage Rules') && content.includes('praxis: scope=<x>'))
    );
  } catch {
    return false;
  }
}

export function copyManagedRuleFile(src, dest, { method = 'copy', force = false, dryRun = false } = {}) {
  if (pathExistsLstat(dest) && !isPraxisManagedRuleFile(dest)) {
    console.warn(`  [warning] Preserving user-owned rule file: ${dest}`);
    return 'preserved';
  }
  if (dryRun) {
    console.log(`  [dry-run] ${method === 'link' ? 'Symlink' : 'Copy'} ${src} -> ${dest}`);
    return 'dry-run';
  }
  if (pathExistsLstat(dest) && !force) {
    console.log(`  [skip] Target already exists: ${dest} (use --force to overwrite)`);
    return 'skipped';
  }
  copyOrLink(src, dest, { method, force, dryRun });
  return 'installed';
}

export function writeFileAtomic(filePath, content) {
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      if (pathExistsLstat(tmpPath)) fs.rmSync(tmpPath, { force: true });
    } catch {}
    throw err;
  }
}

function parseTomlHeaderSegments(rawHeaderInner) {
  const segments = [];
  let current = '';
  let inQuote = null;
  for (let i = 0; i < rawHeaderInner.length; i++) {
    const ch = rawHeaderInner[i];
    if (inQuote) {
      if (ch === '\\' && inQuote === '"' && i + 1 < rawHeaderInner.length) {
        current += rawHeaderInner[++i];
      } else if (ch === inQuote) {
        inQuote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === '.') {
      segments.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (inQuote) return null;
  segments.push(current.trim());
  return segments.filter(Boolean);
}

function isPraxisCodexTableSegments(segments) {
  if (!Array.isArray(segments) || segments.length < 2) return false;
  return (
    (segments[0] === 'marketplaces' && segments[1] === 'praxis-marketplace') ||
    (segments[0] === 'plugins' && segments[1] === 'praxis@praxis-marketplace')
  );
}

export function scanTomlLines(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const annotated = [];

  let inMultiBasic = false;
  let inMultiLiteral = false;
  let bracketDepth = 0;

  for (const line of lines) {
    const atTopLevel = !inMultiBasic && !inMultiLiteral && bracketDepth === 0;
    let headerSegments = null;
    if (atTopLevel) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') && !trimmed.startsWith('#')) {
        const m = trimmed.match(/^\[\[?(.+?)\]\]?(?:\s*(?:#.*)?)?$/);
        if (m) {
          headerSegments = parseTomlHeaderSegments(m[1]);
        }
      }
    }

    annotated.push({ line, headerSegments, atTopLevel });

    // Advance multiline string / array bracket state across line characters
    let i = 0;
    let inSingle = false;
    let inDouble = false;
    while (i < line.length) {
      if (inMultiBasic) {
        if (line.startsWith('"""', i)) {
          inMultiBasic = false;
          i += 3;
          continue;
        }
        if (line[i] === '\\') i += 2;
        else i += 1;
        continue;
      }
      if (inMultiLiteral) {
        if (line.startsWith("'''", i)) {
          inMultiLiteral = false;
          i += 3;
          continue;
        }
        i += 1;
        continue;
      }
      if (inDouble) {
        if (line[i] === '\\') i += 2;
        else if (line[i] === '"') {
          inDouble = false;
          i += 1;
        } else i += 1;
        continue;
      }
      if (inSingle) {
        if (line[i] === "'") inSingle = false;
        i += 1;
        continue;
      }

      if (line[i] === '#') break;
      if (line.startsWith('"""', i)) {
        inMultiBasic = true;
        i += 3;
        continue;
      }
      if (line.startsWith("'''", i)) {
        inMultiLiteral = true;
        i += 3;
        continue;
      }
      if (line[i] === '"') {
        inDouble = true;
        i += 1;
        continue;
      }
      if (line[i] === "'") {
        inSingle = true;
        i += 1;
        continue;
      }
      if (!headerSegments) {
        if (line[i] === '[') bracketDepth += 1;
        else if (line[i] === ']' && bracketDepth > 0) bracketDepth -= 1;
      }
      i += 1;
    }
  }

  return { eol, annotated };
}

export function hasPraxisCodexToml(content) {
  if (!content) return false;
  const str = String(content);
  const { annotated } = scanTomlLines(str);
  let inPraxisPluginSection = false;
  let pluginDisabled = false;

  for (const item of annotated) {
    if (item.headerSegments) {
      if (inPraxisPluginSection && !pluginDisabled) {
        return true;
      }
      inPraxisPluginSection = false;
      pluginDisabled = false;

      if (item.headerSegments[0] === 'marketplaces' && item.headerSegments[1] === 'praxis-marketplace') {
        return true;
      }
      if (item.headerSegments[0] === 'plugins' && item.headerSegments[1] === 'praxis@praxis-marketplace') {
        inPraxisPluginSection = true;
      }
    } else if (inPraxisPluginSection) {
      const trimmed = item.line.trim();
      if (/^enabled\s*=\s*false(?:\s*(?:#.*)?)?$/i.test(trimmed)) {
        pluginDisabled = true;
      }
    }
  }

  if (inPraxisPluginSection && !pluginDisabled) {
    return true;
  }
  return false;
}

export function hasPraxisOpencodeConfigText(content) {
  if (!content) return false;
  try {
    const j = JSON.parse(String(content));
    if (!j || typeof j !== 'object' || Array.isArray(j)) return false;
    if (!Array.isArray(j.plugin)) return false;
    return j.plugin.some(isPraxisPluginEntry);
  } catch {
    return false;
  }
}

export function hasPraxisPiSettingsText(content) {
  if (!content) return false;
  try {
    const j = JSON.parse(String(content));
    if (!j || typeof j !== 'object' || Array.isArray(j)) return false;
    const praxisRegex = /(?:^|[\/:@])praxis(?:[@#\/.]|$)/i;
    const checkItem = (item) => {
      if (typeof item === 'string') return praxisRegex.test(item);
      if (item && typeof item === 'object') {
        return (
          (typeof item.source === 'string' && praxisRegex.test(item.source)) ||
          (typeof item.path === 'string' && praxisRegex.test(item.path)) ||
          (typeof item.name === 'string' && praxisRegex.test(item.name))
        );
      }
      return false;
    };
    for (const key of ['packages', 'extensions', 'skills']) {
      if (Array.isArray(j[key]) && j[key].some(checkItem)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function stripPraxisCodexToml(content) {
  if (content === null || content === undefined || content === '') {
    return { content: content ?? '', changed: false };
  }
  const str = String(content);
  const { eol, annotated } = scanTomlLines(str);
  const kept = [];
  let skipping = false;
  let changed = false;

  for (const item of annotated) {
    if (item.headerSegments) {
      if (isPraxisCodexTableSegments(item.headerSegments)) {
        skipping = true;
        changed = true;
        if (kept.length > 0 && kept[kept.length - 1].trim() === '') {
          kept.pop();
        }
        continue;
      }
      skipping = false;
    }
    if (!skipping) {
      kept.push(item.line);
    }
  }

  if (!changed) {
    return { content: str, changed: false };
  }

  while (kept.length > 1 && kept[kept.length - 1].trim() === '' && kept[kept.length - 2].trim() === '') {
    kept.pop();
  }
  const out = kept.join(eol);
  return { content: out, changed: true };
}

function writeCopyOrLinkTarget(src, targetPath, logDest, method) {
  if (method === 'link') {
    try {
      const isWin = os.platform() === 'win32';
      const stat = fs.statSync(src);
      const linkType = stat.isDirectory() ? (isWin ? 'junction' : 'dir') : 'file';
      fs.symlinkSync(path.resolve(src), targetPath, linkType);
      console.log(`  [success] Linked ${src} -> ${logDest}`);
      return;
    } catch (err) {
      console.warn(`  [warning] Symlink failed (${err.message}). Falling back to copy.`);
    }
  }

  fs.cpSync(src, targetPath, { recursive: true });
  console.log(`  [success] Copied ${src} -> ${logDest}`);
}

export function copyOrLink(src, dest, { method = 'copy', force = false, dryRun = false } = {}) {
  if (dryRun) {
    console.log(`  [dry-run] ${method === 'link' ? 'Symlink' : 'Copy'} ${src} -> ${dest}`);
    return true;
  }

  const parentDir = path.dirname(dest);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if (pathExistsLstat(dest)) {
    if (!force) {
      console.log(`  [skip] Target already exists: ${dest} (use --force to overwrite)`);
      return true;
    }

    const suffix = `${process.pid}-${Date.now()}`;
    const tmpDest = `${dest}.praxis-tmp-${suffix}`;
    const bakDest = `${dest}.praxis-bak-${suffix}`;
    try {
      writeCopyOrLinkTarget(src, tmpDest, dest, method);
      fs.renameSync(dest, bakDest);
      fs.renameSync(tmpDest, dest);
      fs.rmSync(bakDest, { recursive: true, force: true });
      return true;
    } catch (err) {
      try {
        if (pathExistsLstat(bakDest) && !pathExistsLstat(dest)) {
          fs.renameSync(bakDest, dest);
        }
      } catch {}
      try {
        if (pathExistsLstat(tmpDest)) {
          fs.rmSync(tmpDest, { recursive: true, force: true });
        }
      } catch {}
      throw err;
    }
  }

  writeCopyOrLinkTarget(src, dest, dest, method);
  return true;
}

export function copyPraxisSkillsToDir(praxisSrc, destSkillsDir, { method = 'copy', force = false, dryRun = false } = {}) {
  const srcSkills = path.join(praxisSrc, 'skills');
  if (!fs.existsSync(srcSkills)) return;
  const entries = fs.readdirSync(srcSkills, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const src = path.join(srcSkills, entry.name);
      const dest = path.join(destSkillsDir, entry.name);
      copyOrLink(src, dest, { method, force, dryRun });
    }
  }
}

export function copyPraxisHooksToDir(praxisSrc, destHooksDir, { method = 'copy', force = false, dryRun = false } = {}) {
  const srcHooks = path.join(praxisSrc, 'hooks');
  if (!fs.existsSync(srcHooks)) return;
  const entries = fs.readdirSync(srcHooks, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      const src = path.join(srcHooks, entry.name);
      const dest = path.join(destHooksDir, entry.name);
      copyOrLink(src, dest, { method, force, dryRun });
    }
  }
}

export function copyPraxisRulesToDir(praxisSrc, destRulesDir, { method = 'copy', force = false, dryRun = false } = {}) {
  const srcRules = path.join(praxisSrc, 'rules');
  if (!fs.existsSync(srcRules)) return;
  const entries = fs.readdirSync(srcRules, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      const src = path.join(srcRules, entry.name);
      const dest = path.join(destRulesDir, entry.name);
      copyManagedRuleFile(src, dest, { method, force, dryRun });
    }
  }
}

export function copyPluginFiles(src, dest, { method = 'copy', force = false, dryRun = false, exclude = [] } = {}) {
  const excluded = new Set(exclude);
  const itemsToCopy = [
    'assets',
    'skills',
    'rules',
    'hooks',
    'plugin.json',
    'extensions',
    '.claude-plugin',
    '.codex-plugin',
    '.copilot-plugin',
    '.qoder-plugin',
    '.grok-plugin',
    '.opencode',
    'gemini-extension.json',
    'package.json',
    'README.md',
    'LICENSE',
  ];

  for (const item of itemsToCopy) {
    if (excluded.has(item)) continue;
    const itemSrc = path.join(src, item);
    if (fs.existsSync(itemSrc)) {
      const itemDest = path.join(dest, item);
      copyOrLink(itemSrc, itemDest, { method, force, dryRun });
    }
  }
}

export const PRAXIS_SKILL_NAMES = [
  'using-praxis',
  'archive',
  'debug',
  'design',
  'onboard',
  'plan',
  'references',
  'release',
  'review',
  'ship',
  'subagents',
  'tdd',
  'worktree',
];

export const PRAXIS_HOOK_FILES = [
  'session-start',
  'SessionStart.js',
  'run-hook.cmd',
  'hooks.json',
  'codex-hooks.json',
  'gemini-hooks.json',
];

export const PRAXIS_RULE_FILES = [
  'praxis.md',
  'AGENTS.md',
];

export function removePraxisSkillsFromDir(skillsDir, dryRun = false) {
  if (!fs.existsSync(skillsDir)) return;
  for (const skill of PRAXIS_SKILL_NAMES) {
    const skillPath = path.join(skillsDir, skill);
    if (fs.existsSync(skillPath)) {
      if (dryRun) {
        console.log(`  [dry-run] Remove skill: ${skillPath}`);
      } else {
        try {
          fs.rmSync(skillPath, { recursive: true, force: true });
          console.log(`  [success] Removed skill: ${skillPath}`);
        } catch {}
      }
    }
  }
  if (!dryRun) {
    cleanEmptyDirectory(skillsDir);
  }
}

export function removePraxisHooksFromDir(hooksDir, dryRun = false) {
  if (!fs.existsSync(hooksDir)) return;
  for (const hook of PRAXIS_HOOK_FILES) {
    const hookPath = path.join(hooksDir, hook);
    if (fs.existsSync(hookPath)) {
      if (dryRun) {
        console.log(`  [dry-run] Remove hook: ${hookPath}`);
      } else {
        try {
          fs.rmSync(hookPath, { force: true });
          console.log(`  [success] Removed hook: ${hookPath}`);
        } catch {}
      }
    }
  }
  if (!dryRun) {
    cleanEmptyDirectory(hooksDir);
  }
}

export function removePraxisRulesFromDir(rulesDir, dryRun = false) {
  if (!fs.existsSync(rulesDir)) return;
  for (const rule of PRAXIS_RULE_FILES) {
    const rulePath = path.join(rulesDir, rule);
    if (pathExistsLstat(rulePath)) {
      if (isPraxisManagedRuleFile(rulePath)) {
        if (dryRun) {
          console.log(`  [dry-run] Remove rule: ${rulePath}`);
        } else {
          try {
            fs.rmSync(rulePath, { force: true });
            console.log(`  [success] Removed rule: ${rulePath}`);
          } catch {}
        }
      } else {
        console.log(`  [skip] Preserving non-Praxis rule file: ${rulePath}`);
      }
    }
  }
  if (!dryRun) {
    cleanEmptyDirectory(rulesDir);
  }
}

export function cleanEmptyDirectory(dir) {
  try {
    if (fs.existsSync(dir)) {
      const entries = fs.readdirSync(dir);
      if (entries.length === 0) {
        fs.rmdirSync(dir);
      }
    }
  } catch {}
}

export function installHost(host, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const scope = normalizeScope(options.scope, rootDir);
  const method = normalizeMethod(options.method);
  const ref = validateRef(options.ref);
  const {
    dryRun = false,
    force = false,
    praxisSrc = path.resolve(import.meta.dirname, '../..'),
  } = options;

  console.log(`\n📦 Installing Praxis for ${host.displayName} [scope: ${scope}]...`);

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  if (ref !== null && !supportsRef(host, 'install', scope, method, { binaryAvailable })) {
    console.error(`  [error] --ref is not supported for ${host.displayName} (install, scope: ${scope}, method: ${method}).`);
    return false;
  }

  const nativeSteps = typeof host.nativeInstallCmd === 'function' ? host.nativeInstallCmd(ref, scope) : null;
  if (method === 'native') {
    if (!nativeSteps || !binaryAvailable) {
      console.error(`  [error] Native install is not available for ${host.displayName} [scope: ${scope}].`);
      return false;
    }
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir });
    if (ok && !dryRun) {
      console.log(`  [success] Successfully installed via ${host.cliBinary} CLI.`);
    }
    return ok;
  }

  const useNative = method === 'auto' && binaryAvailable && Boolean(nativeSteps);
  if (useNative) {
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir });
    if (ok) {
      if (!dryRun) {
        console.log(`  [success] Successfully installed via ${host.cliBinary} CLI.`);
      }
      return true;
    }
    if (ref !== null) {
      console.error(`  [error] Native install with --ref failed for ${host.displayName}; refusing file-copy fallback.`);
      return false;
    }
    console.warn(`  [warning] Falling back to direct file installation.`);
  }

  // Fallback / Direct file installation
  const homeDir = options.homeDir || os.homedir();
  const destPath = resolveTargetPath(host, scope, rootDir, homeDir);

  if (host.id === 'opencode') {
    if (method === 'native') {
      console.error(`  [error] Native install is not available for OpenCode [scope: ${scope}].`);
      return false;
    }

    const opencodeDir = scope === 'user'
      ? path.join(homeDir, '.config', 'opencode')
      : path.join(rootDir, '.opencode');
    const configFile = scope === 'user'
      ? path.join(homeDir, '.config', 'opencode', 'opencode.json')
      : path.join(rootDir, 'opencode.json');

    if (scope === 'project') {
      if (method === 'copy' || method === 'link') {
        console.error(`  [error] OpenCode project scope only supports --method auto (opencode.json). Use --scope local for file installation.`);
        return false;
      }
      let configResult;
      try {
        configResult = readValidatedOpencodeJson(configFile);
      } catch (err) {
        console.error(`  [error] Failed to validate ${configFile}: ${err.message}`);
        return false;
      }
      const config = configResult.config;
      config.plugin = config.plugin || [];

      const targetEntry = ref
        ? `praxis@git+https://github.com/ouonet/praxis.git#${ref}`
        : 'praxis@git+https://github.com/ouonet/praxis.git';

      const existingIndex = config.plugin.findIndex((p) => isPraxisPluginEntry(p));
      let modified = false;

      if (existingIndex !== -1) {
        if (force || ref !== null) {
          if (config.plugin[existingIndex] !== targetEntry) {
            config.plugin[existingIndex] = targetEntry;
            modified = true;
          }
        }
      } else {
        config.plugin.push(targetEntry);
        modified = true;
      }

      if (modified) {
        if (!dryRun) {
          writeFileAtomic(configFile, JSON.stringify(config, null, 2) + '\n');
          console.log(`  [success] Updated ${configFile}`);
        } else {
          console.log(`  [dry-run] Update plugin list in ${configFile}`);
        }
      }
      return true;
    }

    if (scope === 'local') {
      if (ref !== null) {
        console.error(`  [error] --ref is not supported for OpenCode local scope.`);
        return false;
      }
      const pluginDest = path.join(opencodeDir, 'plugins', 'praxis.js');
      copyOrLink(path.join(praxisSrc, '.opencode', 'plugins', 'praxis.js'), pluginDest, {
        method: method === 'link' ? 'link' : 'copy',
        force,
        dryRun,
      });
      const skillsDest = path.join(opencodeDir, 'skills');
      copyPraxisSkillsToDir(praxisSrc, skillsDest, {
        method: method === 'link' ? 'link' : 'copy',
        force,
        dryRun,
      });
      return true;
    }

    if (scope === 'user') {
      if (method === 'auto') {
        let configResult;
        try {
          configResult = readValidatedOpencodeJson(configFile);
        } catch (err) {
          console.error(`  [error] Failed to validate ${configFile}: ${err.message}`);
          return false;
        }
        const config = configResult.config;
        config.plugin = config.plugin || [];

        const targetEntry = ref
          ? `praxis@git+https://github.com/ouonet/praxis.git#${ref}`
          : 'praxis@git+https://github.com/ouonet/praxis.git';

        const existingIndex = config.plugin.findIndex((p) => isPraxisPluginEntry(p));
        let modified = false;

        if (existingIndex !== -1) {
          if (force || ref !== null) {
            if (config.plugin[existingIndex] !== targetEntry) {
              config.plugin[existingIndex] = targetEntry;
              modified = true;
            }
          }
        } else {
          config.plugin.push(targetEntry);
          modified = true;
        }

        if (modified) {
          if (!dryRun) {
            writeFileAtomic(configFile, JSON.stringify(config, null, 2) + '\n');
            console.log(`  [success] Updated ${configFile}`);
          } else {
            console.log(`  [dry-run] Update plugin list in ${configFile}`);
          }
        }

        const legacyPlugin = path.join(opencodeDir, 'plugins', 'praxis.js');
        if (pathExistsLstat(legacyPlugin)) {
          if (!dryRun) {
            fs.rmSync(legacyPlugin, { force: true });
            cleanEmptyDirectory(path.join(opencodeDir, 'plugins'));
          } else {
            console.log(`  [dry-run] Remove ${legacyPlugin}`);
          }
        }
        removePraxisSkillsFromDir(path.join(opencodeDir, 'skills'), dryRun);
        if (!dryRun) cleanEmptyDirectory(opencodeDir);
        return true;
      }

      // method === 'copy' | 'link'
      if (pathExistsLstat(configFile)) {
        let configResult;
        try {
          configResult = readValidatedOpencodeJson(configFile);
        } catch (err) {
          console.error(`  [error] Failed to validate ${configFile}: ${err.message}`);
          return false;
        }
        const config = configResult.config;
        if (Array.isArray(config.plugin)) {
          const prevLen = config.plugin.length;
          config.plugin = config.plugin.filter((p) => !isPraxisPluginEntry(p));
          if (config.plugin.length !== prevLen) {
            if (!dryRun) {
              writeFileAtomic(configFile, JSON.stringify(config, null, 2) + '\n');
              console.log(`  [success] Removed praxis entry from ${configFile}`);
            } else {
              console.log(`  [dry-run] Remove praxis entry from ${configFile}`);
            }
          }
        }
      }

      const pluginDest = path.join(opencodeDir, 'plugins', 'praxis.js');
      copyOrLink(path.join(praxisSrc, '.opencode', 'plugins', 'praxis.js'), pluginDest, {
        method: method === 'link' ? 'link' : 'copy',
        force,
        dryRun,
      });
      const skillsDest = path.join(opencodeDir, 'skills');
      copyPraxisSkillsToDir(praxisSrc, skillsDest, {
        method: method === 'link' ? 'link' : 'copy',
        force,
        dryRun,
      });
      return true;
    }
  }

  if (host.id === 'antigravity') {
    if (scope === 'user') {
      const globalConfigDest = path.join(homeDir, '.gemini', 'config', 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, globalConfigDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun, exclude: ['rules'] });
      const ideDest = path.join(homeDir, '.gemini', 'antigravity-ide', 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, ideDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun, exclude: ['rules'] });
      const destAgentsRule = path.join(homeDir, '.gemini', 'config', 'rules', 'AGENTS.md');
      copyManagedRuleFile(path.join(praxisSrc, 'rules', 'AGENTS.md'), destAgentsRule, { method: method === 'link' ? 'link' : 'copy', force, dryRun });

      if (force) {
        const legacyPraxisRule = path.join(homeDir, '.gemini', 'config', 'rules', 'praxis.md');
        if (isPraxisManagedRuleFile(legacyPraxisRule)) {
          if (!dryRun) {
            try { fs.rmSync(legacyPraxisRule, { force: true }); } catch {}
          } else {
            console.log(`  [dry-run] Remove legacy rule: ${legacyPraxisRule}`);
          }
        }
        removePraxisSkillsFromDir(path.join(homeDir, '.gemini', 'config', 'skills'), dryRun);
      }
    } else {
      const agentsDest = path.join(rootDir, '.agents');
      const pluginDest = path.join(agentsDest, 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, pluginDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun, exclude: ['rules'] });
      const skillsDest = path.join(agentsDest, 'skills');
      copyPraxisSkillsToDir(praxisSrc, skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
      const destAgentsRule = path.join(agentsDest, 'rules', 'AGENTS.md');
      copyManagedRuleFile(path.join(praxisSrc, 'rules', 'AGENTS.md'), destAgentsRule, { method: method === 'link' ? 'link' : 'copy', force, dryRun });

      if (force) {
        const legacyPraxisRule = path.join(agentsDest, 'rules', 'praxis.md');
        if (isPraxisManagedRuleFile(legacyPraxisRule)) {
          if (!dryRun) {
            try { fs.rmSync(legacyPraxisRule, { force: true }); } catch {}
          } else {
            console.log(`  [dry-run] Remove legacy rule: ${legacyPraxisRule}`);
          }
        }
      }
    }
    return true;
  }

  if (host.id === 'qoder') {
    const skillsDest = scope === 'user' ? path.join(destPath, 'skills') : path.join(rootDir, 'skills');
    copyPraxisSkillsToDir(praxisSrc, skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const manifestDest = scope === 'user' ? path.join(destPath, 'plugin.json') : path.join(rootDir, '.qoder-plugin', 'plugin.json');
    copyOrLink(path.join(praxisSrc, '.qoder-plugin', 'plugin.json'), manifestDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    return true;
  }

  if (host.id === 'grok') {
    const grokRoot = scope === 'user' ? path.join(homeDir, '.grok') : path.join(rootDir, '.grok');
    const pluginDest = path.join(grokRoot, 'plugins', 'praxis');
    copyPluginFiles(praxisSrc, pluginDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun, exclude: ['rules'] });
    copyPraxisSkillsToDir(praxisSrc, path.join(grokRoot, 'skills'), { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    copyManagedRuleFile(path.join(praxisSrc, 'rules', 'praxis.md'), path.join(grokRoot, 'rules', 'praxis.md'), { method: method === 'link' ? 'link' : 'copy', force, dryRun });

    if (force) {
      const legacyAgentsRule = path.join(grokRoot, 'rules', 'AGENTS.md');
      if (isPraxisManagedRuleFile(legacyAgentsRule)) {
        if (!dryRun) {
          try { fs.rmSync(legacyAgentsRule, { force: true }); } catch {}
        } else {
          console.log(`  [dry-run] Remove legacy rule: ${legacyAgentsRule}`);
        }
      }
    }
    return true;
  }

  if (host.id === 'agents') {
    const destPath = scope === 'user' ? path.join(homeDir, '.agents') : path.join(rootDir, '.agents');
    const skillsDest = path.join(destPath, 'skills');
    copyPraxisSkillsToDir(praxisSrc, skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const hooksDest = path.join(destPath, 'hooks');
    copyPraxisHooksToDir(praxisSrc, hooksDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });

    const agentsRulePath = path.join(destPath, 'rules', 'AGENTS.md');
    const praxisRulePath = path.join(destPath, 'rules', 'praxis.md');
    if (!isPraxisManagedRuleFile(agentsRulePath)) {
      copyManagedRuleFile(path.join(praxisSrc, 'rules', 'praxis.md'), praxisRulePath, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    }
    return true;
  }

  // Standard plugin copy/link (Claude, Codex, Copilot, Gemini, Pi)
  copyPluginFiles(praxisSrc, destPath, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
  return true;
}

export function uninstallHost(host, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const home = options.homeDir || os.homedir();
  const scope = normalizeScope(options.scope, rootDir);
  const method = normalizeMethod(options.method);
  const ref = validateRef(options.ref);
  const {
    dryRun = false,
  } = options;

  console.log(`\n🗑️  Uninstalling Praxis from ${host.displayName} [scope: ${scope}]...`);

  if (ref !== null) {
    console.error(`  [error] --ref is not supported for uninstall.`);
    return false;
  }

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const nativeSteps = typeof host.nativeUninstallCmd === 'function' ? host.nativeUninstallCmd(scope) : null;

  if (method === 'native') {
    if (!nativeSteps || !binaryAvailable) {
      console.error(`  [error] Native uninstall is not available for ${host.displayName} [scope: ${scope}].`);
      return false;
    }
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir });
    if (ok && !dryRun) {
      console.log(`  [success] Successfully uninstalled via ${host.cliBinary} CLI.`);
    }
    return ok;
  }

  const useNative = method === 'auto' && binaryAvailable && Boolean(nativeSteps);

  if (useNative) {
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir });
    if (host.id !== 'codex') {
      if (ok) {
        if (!dryRun) {
          console.log(`  [success] Successfully uninstalled via ${host.cliBinary} CLI.`);
        }
        return true;
      }
      console.warn(`  [warning] Removing files manually.`);
    } else if (ok && !dryRun) {
      console.log(`  [success] Successfully uninstalled via codex CLI.`);
    }
  }

  // File-level non-destructive cleanup
  const destPath = resolveTargetPath(host, scope, rootDir);

  if (host.id === 'grok') {
    const grokRoot = scope === 'user' ? path.join(home, '.grok') : path.join(rootDir, '.grok');
    const pluginDir = path.join(grokRoot, 'plugins', 'praxis');
    if (pathExistsLstat(pluginDir)) {
      if (dryRun) {
        console.log(`  [dry-run] Remove ${pluginDir}`);
      } else {
        fs.rmSync(pluginDir, { recursive: true, force: true });
        console.log(`  [success] Removed ${pluginDir}`);
        cleanEmptyDirectory(path.join(grokRoot, 'plugins'));
      }
    }
    removePraxisSkillsFromDir(path.join(grokRoot, 'skills'), dryRun);
    removePraxisRulesFromDir(path.join(grokRoot, 'rules'), dryRun);
    if (!dryRun) cleanEmptyDirectory(grokRoot);
    return true;
  }

  if (host.id === 'antigravity') {
    if (scope === 'user') {
      const globalPlugin = path.join(home, '.gemini', 'config', 'plugins', 'praxis');
      const idePlugin = path.join(home, '.gemini', 'antigravity-ide', 'plugins', 'praxis');
      for (const p of [globalPlugin, idePlugin]) {
        if (pathExistsLstat(p)) {
          if (!dryRun) {
            fs.rmSync(p, { recursive: true, force: true });
            console.log(`  [success] Removed ${p}`);
          } else {
            console.log(`  [dry-run] Remove ${p}`);
          }
        }
      }
      removePraxisSkillsFromDir(path.join(home, '.gemini', 'config', 'skills'), dryRun);
      removePraxisRulesFromDir(path.join(home, '.gemini', 'config', 'rules'), dryRun);
    } else {
      const targetBase = path.join(rootDir, '.agents');
      const pluginDir = path.join(targetBase, 'plugins', 'praxis');
      if (pathExistsLstat(pluginDir)) {
        if (!dryRun) {
          fs.rmSync(pluginDir, { recursive: true, force: true });
          console.log(`  [success] Removed ${pluginDir}`);
          cleanEmptyDirectory(path.join(targetBase, 'plugins'));
        } else {
          console.log(`  [dry-run] Remove ${pluginDir}`);
        }
      }
      const hasAgentsHook = pathExistsLstat(path.join(targetBase, 'hooks', 'session-start'));
      if (!hasAgentsHook) {
        removePraxisSkillsFromDir(path.join(targetBase, 'skills'), dryRun);
        removePraxisRulesFromDir(path.join(targetBase, 'rules'), dryRun);
        if (!dryRun) cleanEmptyDirectory(targetBase);
      }
    }
    return true;
  }

  if (host.id === 'agents') {
    const targetBase = scope === 'user' ? path.join(home, '.agents') : path.join(rootDir, '.agents');
    removePraxisHooksFromDir(path.join(targetBase, 'hooks'), dryRun);

    const hasAntigravityPlugin = pathExistsLstat(path.join(targetBase, 'plugins', 'praxis'));
    if (!hasAntigravityPlugin) {
      removePraxisSkillsFromDir(path.join(targetBase, 'skills'), dryRun);
      removePraxisRulesFromDir(path.join(targetBase, 'rules'), dryRun);
      if (!dryRun) cleanEmptyDirectory(targetBase);
    }
    return true;
  }

  if (host.id === 'opencode') {
    const opencodeDir = scope === 'user'
      ? path.join(home, '.config', 'opencode')
      : path.join(rootDir, '.opencode');
    const configFile = scope === 'user'
      ? path.join(home, '.config', 'opencode', 'opencode.json')
      : path.join(rootDir, 'opencode.json');

    // 1. Validate configFile FIRST if it exists
    let parsedConfig = null;
    let configExists = false;
    if (pathExistsLstat(configFile)) {
      try {
        const res = readValidatedOpencodeJson(configFile);
        parsedConfig = res.config;
        configExists = true;
      } catch (err) {
        console.error(`  [error] Failed to validate ${configFile}: ${err.message}`);
        return false;
      }
    }

    // 2. If valid, remove praxis from opencode.json if present
    if (configExists && parsedConfig && Array.isArray(parsedConfig.plugin)) {
      const prevLen = parsedConfig.plugin.length;
      parsedConfig.plugin = parsedConfig.plugin.filter((p) => !isPraxisPluginEntry(p));
      if (parsedConfig.plugin.length !== prevLen) {
        if (!dryRun) {
          writeFileAtomic(configFile, JSON.stringify(parsedConfig, null, 2) + '\n');
          console.log(`  [success] Removed praxis entry from ${configFile}`);
        } else {
          console.log(`  [dry-run] Remove praxis entry from ${configFile}`);
        }
      }
    }

    // 3. For local or user scope, clean up plugins/praxis.js and skills
    if (scope !== 'project') {
      const pluginFile = path.join(opencodeDir, 'plugins', 'praxis.js');
      if (pathExistsLstat(pluginFile)) {
        if (!dryRun) {
          fs.rmSync(pluginFile, { force: true });
          console.log(`  [success] Removed ${pluginFile}`);
          cleanEmptyDirectory(path.join(opencodeDir, 'plugins'));
        } else {
          console.log(`  [dry-run] Remove ${pluginFile}`);
        }
      }
      removePraxisSkillsFromDir(path.join(opencodeDir, 'skills'), dryRun);
      if (!dryRun) cleanEmptyDirectory(opencodeDir);
    }
    return true;
  }

  if (host.id === 'qoder') {
    if (scope === 'user') {
      for (const p of [path.join(home, '.qoder-cn', 'plugins', 'praxis'), path.join(home, '.qoder', 'plugins', 'praxis')]) {
        if (fs.existsSync(p)) {
          if (!dryRun) {
            fs.rmSync(p, { recursive: true, force: true });
            console.log(`  [success] Removed ${p}`);
          }
        }
      }
    } else {
      const qoderPluginFile = path.join(rootDir, '.qoder-plugin', 'plugin.json');
      if (fs.existsSync(qoderPluginFile)) {
        if (!dryRun) {
          fs.rmSync(path.join(rootDir, '.qoder-plugin'), { recursive: true, force: true });
          console.log(`  [success] Removed ${path.join(rootDir, '.qoder-plugin')}`);
        }
      }
      removePraxisSkillsFromDir(path.join(rootDir, 'skills'), dryRun);
    }
    return true;
  }

  if (host.id === 'pi') {
    if (scope === 'user') {
      const pluginDir = path.join(home, '.pi', 'plugins', 'praxis');
      if (fs.existsSync(pluginDir)) {
        if (!dryRun) fs.rmSync(pluginDir, { recursive: true, force: true });
      }
      removePraxisSkillsFromDir(path.join(home, '.pi', 'skills'), dryRun);
      removePraxisSkillsFromDir(path.join(home, '.pi', 'agent', 'skills'), dryRun);
    } else {
      removePraxisSkillsFromDir(path.join(rootDir, '.pi', 'skills'), dryRun);
      cleanEmptyDirectory(path.join(rootDir, '.pi'));
    }
    return true;
  }

  if (host.id === 'omp') {
    if (scope === 'user') {
      for (const p of [path.join(home, '.omp', 'plugins', 'node_modules', 'praxis'), path.join(home, '.omp', 'plugins', 'praxis')]) {
        if (fs.existsSync(p)) {
          if (!dryRun) fs.rmSync(p, { recursive: true, force: true });
        }
      }
      removePraxisSkillsFromDir(path.join(home, '.omp', 'skills'), dryRun);
    } else {
      removePraxisSkillsFromDir(path.join(rootDir, '.omp', 'skills'), dryRun);
      const ompPluginDir = path.join(rootDir, '.omp', 'plugins', 'praxis');
      if (fs.existsSync(ompPluginDir)) {
        if (!dryRun) fs.rmSync(ompPluginDir, { recursive: true, force: true });
      }
      cleanEmptyDirectory(path.join(rootDir, '.omp'));
    }
    return true;
  }

  if (host.id === 'codex') {
    const codexBase = scope === 'user' ? path.join(home, '.codex') : path.join(rootDir, '.codex');
    const cfgFile = path.join(codexBase, 'config.toml');
    const targetDirs = scope === 'user'
      ? [
          path.join(codexBase, 'plugins', 'praxis'),
          path.join(codexBase, '.tmp', 'marketplaces', 'praxis-marketplace'),
          path.join(codexBase, 'plugins', 'cache', 'praxis-marketplace'),
        ]
      : [path.join(codexBase, 'plugins', 'praxis')];

    try {
      if (fs.existsSync(cfgFile)) {
        const raw = fs.readFileSync(cfgFile, 'utf8');
        const stripped = stripPraxisCodexToml(raw);
        if (stripped.changed) {
          if (dryRun) {
            console.log(`  [dry-run] Remove Praxis sections from ${cfgFile}`);
          } else {
            writeFileAtomic(cfgFile, stripped.content);
            console.log(`  [success] Cleaned Praxis sections from ${cfgFile}`);
          }
        }
      }

      for (const p of targetDirs) {
        if (pathExistsLstat(p)) {
          if (dryRun) {
            console.log(`  [dry-run] Remove directory/file: ${p}`);
          } else {
            fs.rmSync(p, { recursive: true, force: true });
            console.log(`  [success] Removed ${p}`);
          }
        }
      }

      if (!dryRun && scope !== 'user') {
        cleanEmptyDirectory(path.join(rootDir, '.codex', 'plugins'));
        cleanEmptyDirectory(path.join(rootDir, '.codex'));
      }
      return true;
    } catch (err) {
      console.error(`  [error] Failed to uninstall Codex artifacts: ${err.message}`);
      return false;
    }
  }

  // Generic praxis plugin directory cleanup (Claude, Copilot, etc.)
  try {
    if (pathExistsLstat(destPath)) {
      if (dryRun) {
        console.log(`  [dry-run] Remove directory/file: ${destPath}`);
      } else {
        fs.rmSync(destPath, { recursive: true, force: true });
        console.log(`  [success] Removed ${destPath}`);
      }
    } else {
      console.log(`  [skip] Path does not exist: ${destPath}`);
    }
    return true;
  } catch (err) {
    console.error(`  [error] Failed to remove ${destPath}: ${err.message}`);
    return false;
  }
}

export function updateHost(host, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const scope = normalizeScope(options.scope, rootDir);
  const method = normalizeMethod(options.method);
  const ref = validateRef(options.ref);
  const {
    dryRun = false,
  } = options;

  console.log(`\n🔄 Updating Praxis for ${host.displayName} [scope: ${scope}]...`);

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  if (ref !== null && !supportsRef(host, 'update', scope, method, { binaryAvailable })) {
    console.error(`  [error] --ref is not supported for ${host.displayName} (update, scope: ${scope}, method: ${method}).`);
    return false;
  }

  const nativeSteps = typeof host.nativeUpdateCmd === 'function' ? host.nativeUpdateCmd(ref, scope) : null;
  if (method === 'native') {
    if (!nativeSteps || !binaryAvailable) {
      console.error(`  [error] Native update is not available for ${host.displayName} [scope: ${scope}].`);
      return false;
    }
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir });
    if (ok && !dryRun) {
      console.log(`  [success] Successfully updated via ${host.cliBinary} CLI.`);
    }
    return ok;
  }

  const useNative = method === 'auto' && binaryAvailable && Boolean(nativeSteps);
  if (useNative) {
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir });
    if (ok) {
      if (!dryRun) {
        console.log(`  [success] Successfully updated via ${host.cliBinary} CLI.`);
      }
      return true;
    }
    if (ref !== null) {
      console.error(`  [error] Native update with --ref failed for ${host.displayName}; refusing file-copy fallback.`);
      return false;
    }
    console.warn(`  [warning] CLI update failed. Re-installing files.`);
  }

  return installHost(host, { ...options, scope, method, ref, force: true });
}

export function getHostStatus(host, rootDir = process.cwd(), { homeDir = os.homedir() } = {}) {
  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const home = homeDir;
  const isHome = path.resolve(rootDir).toLowerCase() === path.resolve(home).toLowerCase();

  const readFileSafe = (p) => {
    try {
      return fs.readFileSync(p, 'utf8');
    } catch {
      return null;
    }
  };

  // 1. Check user scope
  let userInstalled = false;
  if (host.id === 'opencode') {
    const userCfg = path.join(home, '.config', 'opencode', 'opencode.json');
    userInstalled =
      pathExistsLstat(path.join(home, '.config', 'opencode', 'plugins', 'praxis.js')) ||
      pathExistsLstat(path.join(home, '.config', 'opencode', 'skills', 'using-praxis')) ||
      hasPraxisOpencodeConfigText(readFileSafe(userCfg));
  } else if (host.id === 'codex') {
    const configToml = path.join(home, '.codex', 'config.toml');
    userInstalled =
      pathExistsLstat(path.join(home, '.codex', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(home, '.codex', '.tmp', 'marketplaces', 'praxis-marketplace')) ||
      pathExistsLstat(path.join(home, '.codex', 'plugins', 'cache', 'praxis-marketplace')) ||
      hasPraxisCodexToml(readFileSafe(configToml));
  } else if (host.id === 'pi') {
    const piCfg = path.join(home, '.pi', 'agent', 'settings.json');
    userInstalled =
      pathExistsLstat(path.join(home, '.pi', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(home, '.pi', 'agent', 'skills', 'using-praxis')) ||
      pathExistsLstat(path.join(home, '.pi', 'skills', 'using-praxis')) ||
      hasPraxisPiSettingsText(readFileSafe(piCfg));
  } else if (host.id === 'omp') {
    const pkgFile = path.join(home, '.omp', 'plugins', 'package.json');
    const lockFile = path.join(home, '.omp', 'plugins', 'omp-plugins.lock.json');
    let pkgHasPraxis = false;
    const pkgText = readFileSafe(pkgFile);
    if (pkgText) {
      try {
        const j = JSON.parse(pkgText);
        if (j.dependencies && Object.keys(j.dependencies).some((k) => k.includes('praxis'))) pkgHasPraxis = true;
      } catch {}
    }
    let lockHasPraxis = false;
    const lockText = readFileSafe(lockFile);
    if (lockText) {
      try {
        const j = JSON.parse(lockText);
        if (j.plugins && Object.keys(j.plugins).some((k) => k.includes('praxis'))) lockHasPraxis = true;
      } catch {}
    }
    userInstalled =
      pathExistsLstat(path.join(home, '.omp', 'plugins', 'node_modules', 'praxis')) ||
      pathExistsLstat(path.join(home, '.omp', 'plugins', 'node_modules', '@ouonet', 'praxis')) ||
      pathExistsLstat(path.join(home, '.omp', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(home, '.omp', 'skills', 'using-praxis')) ||
      pkgHasPraxis ||
      lockHasPraxis;
  } else if (host.id === 'antigravity') {
    userInstalled =
      pathExistsLstat(path.join(home, '.gemini', 'config', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(home, '.gemini', 'antigravity-ide', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(home, '.gemini', 'config', 'skills', 'using-praxis')) ||
      isPraxisManagedRuleFile(path.join(home, '.gemini', 'config', 'rules', 'AGENTS.md')) ||
      isPraxisManagedRuleFile(path.join(home, '.gemini', 'config', 'rules', 'praxis.md'));
  } else if (host.id === 'agents') {
    userInstalled =
      pathExistsLstat(path.join(home, '.agents', 'skills', 'using-praxis')) ||
      pathExistsLstat(path.join(home, '.agents', 'plugins', 'praxis')) ||
      isPraxisManagedRuleFile(path.join(home, '.agents', 'rules', 'AGENTS.md')) ||
      isPraxisManagedRuleFile(path.join(home, '.agents', 'rules', 'praxis.md'));
  } else if (host.id === 'grok') {
    const registry = path.join(home, '.grok', 'installed-plugins', 'registry.json');
    let regHasPraxis = false;
    const regText = readFileSafe(registry);
    if (regText) {
      try {
        const j = JSON.parse(regText);
        if (j.repos && Object.values(j.repos).some((repo) => repo.plugins && Object.keys(repo.plugins).includes('praxis'))) {
          regHasPraxis = true;
        }
      } catch {}
    }
    userInstalled =
      pathExistsLstat(path.join(home, '.grok', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(home, '.grok', 'skills', 'using-praxis')) ||
      isPraxisManagedRuleFile(path.join(home, '.grok', 'rules', 'praxis.md')) ||
      isPraxisManagedRuleFile(path.join(home, '.grok', 'rules', 'AGENTS.md')) ||
      regHasPraxis;
  } else if (host.id === 'claude') {
    const userTarget = resolveTargetPath(host, 'user', rootDir, home);
    userInstalled = pathExistsLstat(userTarget);
    if (!userInstalled) {
      const installedFile = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
      const instText = readFileSafe(installedFile);
      if (instText) {
        try {
          const j = JSON.parse(instText);
          if (j.plugins && Object.keys(j.plugins).some((k) => k.includes('praxis'))) userInstalled = true;
        } catch {}
      }
    }
    if (!userInstalled) {
      const settingsFile = path.join(home, '.claude', 'settings.json');
      const settText = readFileSafe(settingsFile);
      if (settText) {
        try {
          const j = JSON.parse(settText);
          if (j.enabledPlugins && Object.keys(j.enabledPlugins).some((k) => k.includes('praxis') && j.enabledPlugins[k] !== false)) {
            userInstalled = true;
          }
        } catch {}
      }
    }
    if (!userInstalled) {
      const cacheDir = path.join(home, '.claude', 'plugins', 'cache');
      if (pathExistsLstat(cacheDir)) {
        try {
          const list = fs.readdirSync(cacheDir);
          if (list.some((item) => item.includes('praxis'))) userInstalled = true;
        } catch {}
      }
    }
  } else {
    const userTarget = resolveTargetPath(host, 'user', rootDir, home);
    userInstalled = pathExistsLstat(userTarget);
    if (!userInstalled && host.userAltTargets) {
      userInstalled = host.userAltTargets.some((alt) => {
        const resolvedAlt = home && path.resolve(home) !== path.resolve(os.homedir())
          ? path.join(home, path.relative(os.homedir(), alt))
          : alt;
        return pathExistsLstat(resolvedAlt);
      });
    }
  }

  // 2. Check project scope
  let projectInstalled = false;
  if (!isHome) {
    if (host.id === 'opencode') {
      const projCfg = path.join(rootDir, 'opencode.json');
      projectInstalled = hasPraxisOpencodeConfigText(readFileSafe(projCfg));
    } else if (host.id === 'codex') {
      const projConfig = path.join(rootDir, '.codex', 'config.toml');
      projectInstalled =
        pathExistsLstat(path.join(rootDir, '.codex', 'plugins', 'praxis')) ||
        hasPraxisCodexToml(readFileSafe(projConfig));
    } else if (host.id === 'pi') {
      const projCfg = path.join(rootDir, '.pi', 'settings.json');
      projectInstalled =
        pathExistsLstat(path.join(rootDir, '.pi', 'skills', 'using-praxis')) ||
        hasPraxisPiSettingsText(readFileSafe(projCfg));
    } else if (host.id === 'omp') {
      const pkgFile = path.join(rootDir, '.omp', 'plugins', 'package.json');
      const lockFile = path.join(rootDir, '.omp', 'plugins', 'omp-plugins.lock.json');
      let pkgHasPraxis = false;
      const pkgText = readFileSafe(pkgFile);
      if (pkgText) {
        try {
          const j = JSON.parse(pkgText);
          if (j.dependencies && Object.keys(j.dependencies).some((k) => k.includes('praxis'))) pkgHasPraxis = true;
        } catch {}
      }
      let lockHasPraxis = false;
      const lockText = readFileSafe(lockFile);
      if (lockText) {
        try {
          const j = JSON.parse(lockText);
          if (j.plugins && Object.keys(j.plugins).some((k) => k.includes('praxis'))) lockHasPraxis = true;
        } catch {}
      }
      projectInstalled =
        pathExistsLstat(path.join(rootDir, '.omp', 'skills', 'using-praxis')) ||
        pathExistsLstat(path.join(rootDir, '.omp', 'plugins', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.omp', 'plugins', 'node_modules', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.omp', 'plugins', 'node_modules', '@ouonet', 'praxis')) ||
        pkgHasPraxis ||
        lockHasPraxis;
    } else if (host.id === 'antigravity') {
      projectInstalled =
        pathExistsLstat(path.join(rootDir, '.agents', 'plugins', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.agents', 'skills', 'using-praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'AGENTS.md'));
    } else if (host.id === 'agents') {
      projectInstalled =
        pathExistsLstat(path.join(rootDir, '.agents', 'skills', 'using-praxis')) ||
        pathExistsLstat(path.join(rootDir, '.agents', 'plugins', 'praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'praxis.md')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'AGENTS.md'));
    } else if (host.id === 'grok') {
      projectInstalled =
        pathExistsLstat(path.join(rootDir, '.grok', 'plugins', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.grok', 'skills', 'using-praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.grok', 'rules', 'praxis.md'));
    } else if (host.id === 'claude') {
      const projSettings = path.join(rootDir, '.claude', 'settings.json');
      const settText = readFileSafe(projSettings);
      if (settText) {
        try {
          const j = JSON.parse(settText);
          if (j.enabledPlugins && Object.keys(j.enabledPlugins).some((k) => k.includes('praxis') && j.enabledPlugins[k] !== false)) {
            projectInstalled = true;
          }
        } catch {}
      }
      if (!projectInstalled) {
        projectInstalled = pathExistsLstat(path.resolve(rootDir, host.projectTarget));
      }
    } else if (host.id === 'qoder') {
      projectInstalled =
        pathExistsLstat(path.join(rootDir, '.qoder-plugin', 'plugin.json')) ||
        pathExistsLstat(path.join(rootDir, 'skills', 'using-praxis'));
    } else {
      const projectPath = resolveTargetPath(host, 'project', rootDir, home);
      projectInstalled = pathExistsLstat(projectPath);
    }
  }

  // 3. Check local scope
  let localInstalled = false;
  if (!isHome) {
    if (host.id === 'opencode') {
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.opencode', 'plugins', 'praxis.js')) ||
        pathExistsLstat(path.join(rootDir, '.opencode', 'skills', 'using-praxis'));
    } else if (host.id === 'codex') {
      const projConfig = path.join(rootDir, '.codex', 'config.toml');
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.codex', 'plugins', 'praxis')) ||
        hasPraxisCodexToml(readFileSafe(projConfig));
    } else if (host.id === 'pi') {
      const projCfg = path.join(rootDir, '.pi', 'settings.json');
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.pi', 'skills', 'using-praxis')) ||
        hasPraxisPiSettingsText(readFileSafe(projCfg));
    } else if (host.id === 'omp') {
      const pkgFile = path.join(rootDir, '.omp', 'plugins', 'package.json');
      const lockFile = path.join(rootDir, '.omp', 'plugins', 'omp-plugins.lock.json');
      let pkgHasPraxis = false;
      const pkgText = readFileSafe(pkgFile);
      if (pkgText) {
        try {
          const j = JSON.parse(pkgText);
          if (j.dependencies && Object.keys(j.dependencies).some((k) => k.includes('praxis'))) pkgHasPraxis = true;
        } catch {}
      }
      let lockHasPraxis = false;
      const lockText = readFileSafe(lockFile);
      if (lockText) {
        try {
          const j = JSON.parse(lockText);
          if (j.plugins && Object.keys(j.plugins).some((k) => k.includes('praxis'))) lockHasPraxis = true;
        } catch {}
      }
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.omp', 'skills', 'using-praxis')) ||
        pathExistsLstat(path.join(rootDir, '.omp', 'plugins', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.omp', 'plugins', 'node_modules', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.omp', 'plugins', 'node_modules', '@ouonet', 'praxis')) ||
        pkgHasPraxis ||
        lockHasPraxis;
    } else if (host.id === 'antigravity') {
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.agents', 'plugins', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.agents', 'skills', 'using-praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'AGENTS.md'));
    } else if (host.id === 'agents') {
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.agents', 'skills', 'using-praxis')) ||
        pathExistsLstat(path.join(rootDir, '.agents', 'plugins', 'praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'praxis.md')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'AGENTS.md'));
    } else if (host.id === 'grok') {
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.grok', 'plugins', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.grok', 'skills', 'using-praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.grok', 'rules', 'praxis.md'));
    } else if (host.id === 'qoder') {
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.qoder-plugin', 'plugin.json')) ||
        pathExistsLstat(path.join(rootDir, 'skills', 'using-praxis'));
    } else {
      const localPath = resolveTargetPath(host, 'local', rootDir, home);
      localInstalled = pathExistsLstat(localPath);
    }
  }

  return {
    id: host.id,
    displayName: host.displayName,
    cliBinary: host.cliBinary,
    binaryAvailable,
    isHome,
    localInstalled,
    projectInstalled,
    userInstalled,
    localPath: isHome ? null : resolveTargetPath(host, 'local', rootDir, home),
    projectPath: isHome ? null : resolveTargetPath(host, 'project', rootDir, home),
    userPath: resolveTargetPath(host, 'user', rootDir, home),
  };
}
