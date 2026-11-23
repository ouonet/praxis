import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, execFileSync } from 'node:child_process';

export const PACKAGE_ROOT = path.resolve(import.meta.dirname, '../..');

export const PLUGIN_ITEMS_TO_COPY = Object.freeze([
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
  '.opencode/plugins',
  '.opencode/INSTALL.md',
  'gemini-extension.json',
  'package.json',
  'README.md',
  'LICENSE',
]);

export const DEFAULT_PRAXIS_SKILL_NAMES = Object.freeze([
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
  'using-praxis',
  'worktree',
]);

export function derivePraxisSkillNames(skillsDir = path.join(PACKAGE_ROOT, 'skills')) {
  try {
    if (!fs.existsSync(skillsDir)) {
      return DEFAULT_PRAXIS_SKILL_NAMES;
    }
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const names = entries
      .filter((entry) => !entry.name.startsWith('.') && (entry.isDirectory() || entry.isSymbolicLink()))
      .map((entry) => entry.name)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return names.length > 0 ? Object.freeze(names) : DEFAULT_PRAXIS_SKILL_NAMES;
  } catch {
    return DEFAULT_PRAXIS_SKILL_NAMES;
  }
}

export const PRAXIS_SKILL_NAMES = derivePraxisSkillNames();

export const PRAXIS_HOOK_FILES = Object.freeze([
  'session-start',
  'SessionStart.js',
  'run-hook.cmd',
  'hooks.json',
  'codex-hooks.json',
  'gemini-hooks.json',
]);

export const PRAXIS_RULE_FILES = Object.freeze([
  'praxis.md',
  'AGENTS.md',
]);

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

export function resolveBinaryAvailable(host, { method, binaryAvailable, checkBinary } = {}) {
  if (!host?.cliBinary) {
    return false;
  }
  if (typeof binaryAvailable === 'boolean') {
    return binaryAvailable;
  }
  if (typeof checkBinary === 'function') {
    return Boolean(checkBinary(host.cliBinary));
  }
  if (method === 'copy' || method === 'link') {
    return false;
  }
  return checkBinaryAvailable(host.cliBinary);
}

export function isHomeDirectory(dir = process.cwd(), homeDir = os.homedir()) {
  try {
    return path.resolve(dir).toLowerCase() === path.resolve(homeDir).toLowerCase();
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

export function runCommandSteps(steps, { dryRun = false, rootDir = process.cwd() } = {}, formatStepFn) {
  if (!Array.isArray(steps) || steps.length === 0) return false;
  if (dryRun) {
    for (const step of steps) {
      console.log(`  [dry-run] Executing CLI command: ${formatStepFn(step)}`);
    }
    return true;
  }
  for (const step of steps) {
    const formatted = formatStepFn(step);
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

export function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
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
    const wrapped = new Error(`Failed to read opencode.json at ${filePath}: ${err.message}`, { cause: err });
    if (err && err.code) {
      wrapped.code = err.code;
    }
    throw wrapped;
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

function parseTomlTableHeader(trimmedLine) {
  const isArrayHeader = trimmedLine.startsWith('[[');
  const openLen = isArrayHeader ? 2 : 1;
  let inQuote = null;
  let closeStart = -1;

  for (let i = openLen; i < trimmedLine.length; i++) {
    const ch = trimmedLine[i];
    if (inQuote) {
      if (ch === '\\' && inQuote === '"' && i + 1 < trimmedLine.length) {
        i += 1;
      } else if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === ']') {
      if (isArrayHeader) {
        if (trimmedLine[i + 1] === ']') {
          closeStart = i;
          break;
        }
        return null;
      }
      closeStart = i;
      break;
    }
  }

  if (inQuote || closeStart === -1) return null;
  const closeLen = isArrayHeader ? 2 : 1;
  const trailing = trimmedLine.slice(closeStart + closeLen).trim();
  if (trailing !== '' && !trailing.startsWith('#')) {
    return null;
  }
  const inner = trimmedLine.slice(openLen, closeStart);
  const segments = parseTomlHeaderSegments(inner);
  if (!segments || segments.length === 0) return null;
  return segments;
}

export function scanTomlLines(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const annotated = [];

  let inMultiBasic = false;
  let inMultiLiteral = false;
  let bracketDepth = 0;
  let hasMalformedHeader = false;

  for (const line of lines) {
    const atTopLevel = !inMultiBasic && !inMultiLiteral && bracketDepth === 0;
    let headerSegments = null;
    if (atTopLevel) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') && !trimmed.startsWith('#')) {
        headerSegments = parseTomlTableHeader(trimmed);
        if (!headerSegments) {
          hasMalformedHeader = true;
        }
      }
    }

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

    const hasUnclosedString = inDouble || inSingle;
    annotated.push({ line, headerSegments, atTopLevel, hasUnclosedString });
  }

  return {
    eol,
    annotated,
    eofState: { inMultiBasic, inMultiLiteral, bracketDepth },
    hasMalformedHeader,
  };
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

  fs.cpSync(src, targetPath, {
    recursive: true,
    filter: (srcPath) => path.basename(srcPath) !== 'node_modules',
  });
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

  const suffix = `${process.pid}-${Date.now()}`;
  const tmpDest = `${dest}.praxis-tmp-${suffix}`;

  if (pathExistsLstat(dest)) {
    if (!force) {
      console.log(`  [skip] Target already exists: ${dest} (use --force to overwrite)`);
      return true;
    }

    const bakDest = `${dest}.praxis-bak-${suffix}`;
    let swapped = false;
    try {
      writeCopyOrLinkTarget(src, tmpDest, dest, method);
      fs.renameSync(dest, bakDest);
      fs.renameSync(tmpDest, dest);
      swapped = true;
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
    if (swapped) {
      try {
        fs.rmSync(bakDest, { recursive: true, force: true });
      } catch (err) {
        console.warn(`  [warning] Failed to remove backup ${bakDest}: ${err.message}`);
      }
    }
    return true;
  }

  try {
    writeCopyOrLinkTarget(src, tmpDest, dest, method);
    fs.renameSync(tmpDest, dest);
    return true;
  } catch (err) {
    try {
      if (pathExistsLstat(tmpDest)) {
        fs.rmSync(tmpDest, { recursive: true, force: true });
      }
    } catch {}
    throw err;
  }
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
  for (const item of PLUGIN_ITEMS_TO_COPY) {
    if (excluded.has(item) || exclude.some((ex) => item.startsWith(`${ex}/`))) continue;
    const itemSrc = path.join(src, item);
    if (fs.existsSync(itemSrc)) {
      const itemDest = path.join(dest, item);
      copyOrLink(itemSrc, itemDest, { method, force, dryRun });
    }
  }
}

export function removePathSafe(targetPath, label, { recursive = false, dryRun = false } = {}) {
  if (!pathExistsLstat(targetPath)) return false;
  if (dryRun) {
    console.log(`  [dry-run] Remove ${label}: ${targetPath}`);
    return true;
  }
  try {
    fs.rmSync(targetPath, { recursive, force: true });
    console.log(`  [success] Removed ${label}: ${targetPath}`);
    return true;
  } catch (err) {
    if (err && err.code === 'ENOENT') return false;
    throw err;
  }
}

export function removePraxisSkillsFromDir(skillsDir, dryRun = false) {
  if (!pathExistsLstat(skillsDir)) return;
  for (const skill of PRAXIS_SKILL_NAMES) {
    removePathSafe(path.join(skillsDir, skill), 'skill', { recursive: true, dryRun });
  }
  if (!dryRun) {
    cleanEmptyDirectory(skillsDir);
  }
}

export function removePraxisHooksFromDir(hooksDir, dryRun = false) {
  if (!pathExistsLstat(hooksDir)) return;
  for (const hook of PRAXIS_HOOK_FILES) {
    removePathSafe(path.join(hooksDir, hook), 'hook', { recursive: false, dryRun });
  }
  if (!dryRun) {
    cleanEmptyDirectory(hooksDir);
  }
}

export function removePraxisRulesFromDir(rulesDir, dryRun = false) {
  if (!pathExistsLstat(rulesDir)) return;
  for (const rule of PRAXIS_RULE_FILES) {
    const rulePath = path.join(rulesDir, rule);
    if (pathExistsLstat(rulePath)) {
      if (isPraxisManagedRuleFile(rulePath)) {
        removePathSafe(rulePath, 'rule', { recursive: false, dryRun });
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
    if (pathExistsLstat(dir)) {
      const entries = fs.readdirSync(dir);
      if (entries.length === 0) {
        fs.rmdirSync(dir);
      }
    }
  } catch {}
}

export function resolveAdapterCtx(defaultHost, ctx = {}) {
  const host = ctx.host || defaultHost;
  const rootDir = ctx.rootDir || process.cwd();
  const homeDir = ctx.homeDir || os.homedir();
  const scope = normalizeScope(ctx.scope, rootDir);
  const method = normalizeMethod(ctx.method === undefined ? 'copy' : ctx.method);
  const ref = validateRef(ctx.ref);
  const dryRun = Boolean(ctx.dryRun);
  const force = Boolean(ctx.force);
  const praxisSrc = ctx.praxisSrc || PACKAGE_ROOT;
  const destPath = ctx.destPath || resolveTargetPath(host, scope, rootDir, homeDir);
  return { host, rootDir, homeDir, scope, method, ref, dryRun, force, praxisSrc, destPath };
}

export function resolveStatusCtx(defaultHost, statusCtx = {}) {
  const host = statusCtx.host || defaultHost;
  const rootDir = statusCtx.rootDir || process.cwd();
  const homeDir = statusCtx.homeDir || os.homedir();
  const isHome = typeof statusCtx.isHome === 'boolean' ? statusCtx.isHome : isHomeDirectory(rootDir, homeDir);
  const readFileSafeFn = typeof statusCtx.readFileSafe === 'function' ? statusCtx.readFileSafe : readFileSafe;
  return { host, rootDir, homeDir, isHome, readFileSafe: readFileSafeFn };
}

export function genericPluginInstall(defaultHost, rawCtx = {}) {
  const { praxisSrc, destPath, method, force, dryRun } = resolveAdapterCtx(defaultHost, rawCtx);
  copyPluginFiles(praxisSrc, destPath, {
    method: method === 'link' ? 'link' : 'copy',
    force,
    dryRun,
  });
  return true;
}

export function genericPluginUninstall(defaultHost, rawCtx = {}) {
  const { destPath, dryRun } = resolveAdapterCtx(defaultHost, rawCtx);
  if (!removePathSafe(destPath, 'directory/file', { recursive: true, dryRun })) {
    console.log(`  [skip] Path does not exist: ${destPath}`);
  }
  return true;
}
