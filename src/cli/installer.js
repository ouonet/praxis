import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { HOSTS } from './hosts.js';

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
  if (!scope) {
    return 'user';
  }
  const s = scope.toLowerCase().trim();
  if (s === 'global' || s === 'user') return 'user';
  if (s === 'local') return 'local';
  if (s === 'project' || s === 'workspace') return 'project';
  return 'user';
}

export function resolveTargetPath(host, scope, rootDir = process.cwd()) {
  const normScope = normalizeScope(scope, rootDir);
  if (normScope === 'user') {
    return host.userTarget;
  }
  if (normScope === 'local') {
    return path.resolve(rootDir, host.localTarget || host.projectTarget);
  }
  return path.resolve(rootDir, host.projectTarget);
}

export function copyOrLink(src, dest, { method = 'copy', force = false, dryRun = false } = {}) {
  if (dryRun) {
    console.log(`  [dry-run] ${method === 'link' ? 'Symlink' : 'Copy'} ${src} -> ${dest}`);
    return;
  }

  if (fs.existsSync(dest)) {
    if (force) {
      fs.rmSync(dest, { recursive: true, force: true });
    } else {
      console.log(`  [skip] Target already exists: ${dest} (use --force to overwrite)`);
      return;
    }
  }

  const parentDir = path.dirname(dest);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if (method === 'link') {
    try {
      const isWin = os.platform() === 'win32';
      const stat = fs.statSync(src);
      const linkType = stat.isDirectory() ? (isWin ? 'junction' : 'dir') : 'file';
      fs.symlinkSync(path.resolve(src), dest, linkType);
      console.log(`  [success] Linked ${src} -> ${dest}`);
      return;
    } catch (err) {
      console.warn(`  [warning] Symlink failed (${err.message}). Falling back to copy.`);
    }
  }

  fs.cpSync(src, dest, { recursive: true });
  console.log(`  [success] Copied ${src} -> ${dest}`);
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
      copyOrLink(src, dest, { method, force, dryRun });
    }
  }
}

export function copyPluginFiles(src, dest, { method = 'copy', force = false, dryRun = false } = {}) {
  const itemsToCopy = [
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
    if (fs.existsSync(rulePath)) {
      if (dryRun) {
        console.log(`  [dry-run] Remove rule: ${rulePath}`);
      } else {
        try {
          fs.rmSync(rulePath, { force: true });
          console.log(`  [success] Removed rule: ${rulePath}`);
        } catch {}
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
  const {
    ref = null,
    method = 'auto',
    dryRun = false,
    force = false,
    praxisSrc = path.resolve(import.meta.dirname, '../..'),
  } = options;

  console.log(`\n📦 Installing Praxis for ${host.displayName} [scope: ${scope}]...`);

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const useNative = (method === 'native' || (method === 'auto' && binaryAvailable)) && Boolean(host.nativeInstallCmd);

  if (useNative) {
    if (host.id === 'codex') {
      const cmds = [
        'codex plugin marketplace add ouonet/praxis',
        'codex plugin marketplace upgrade praxis-marketplace',
        'codex plugin add praxis@praxis-marketplace',
      ];
      if (dryRun) {
        cmds.forEach((c) => console.log(`  [dry-run] Executing CLI command: ${c}`));
        return true;
      }
      for (const c of cmds) {
        console.log(`  Executing: ${c}`);
        try {
          execSync(c, { stdio: 'inherit', cwd: rootDir });
        } catch {
          // ignore expected non-fatal errors (e.g. marketplace already added)
        }
      }
      console.log(`  [success] Successfully installed via codex CLI.`);
      return true;
    }

    const cmd = host.nativeInstallCmd(ref, scope);
    if (dryRun) {
      console.log(`  [dry-run] Executing CLI command: ${cmd}`);
      return true;
    }
    console.log(`  Executing: ${cmd}`);
    try {
      execSync(cmd, { stdio: 'inherit', cwd: rootDir });
      console.log(`  [success] Successfully installed via ${host.cliBinary} CLI.`);
      return true;
    } catch (err) {
      console.warn(`  [warning] CLI command failed: ${err.message}. Falling back to direct file installation.`);
    }
  }

  // Fallback / Direct file installation
  const destPath = resolveTargetPath(host, scope, rootDir);

  if (host.id === 'opencode') {
    // OpenCode: project scope adds to opencode.json + copies files, local scope only copies files, user updates user config
    if (scope === 'project' || scope === 'user') {
      const configFile = scope === 'user'
        ? path.join(os.homedir(), '.config', 'opencode', 'opencode.json')
        : path.join(rootDir, 'opencode.json');

      if (!dryRun) {
        let config = {};
        if (fs.existsSync(configFile)) {
          try {
            config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
          } catch {
            config = {};
          }
        }
        config.plugin = config.plugin || [];
        const pluginEntry = 'praxis@git+https://github.com/ouonet/praxis.git';
        if (!config.plugin.includes(pluginEntry)) {
          config.plugin.push(pluginEntry);
          fs.mkdirSync(path.dirname(configFile), { recursive: true });
          fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
          console.log(`  [success] Added praxis to ${configFile}`);
        }
      } else {
        console.log(`  [dry-run] Update plugin list in ${configFile}`);
      }
    }

    const opencodeDir = scope === 'user'
      ? path.join(os.homedir(), '.config', 'opencode')
      : path.join(rootDir, '.opencode');
    const pluginDest = path.join(opencodeDir, 'plugins', 'praxis.js');
    copyOrLink(path.join(praxisSrc, '.opencode', 'plugins', 'praxis.js'), pluginDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const skillsDest = path.join(opencodeDir, 'skills');
    copyPraxisSkillsToDir(praxisSrc, skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    return true;
  }

  if (host.id === 'antigravity') {
    if (scope === 'user') {
      const globalConfigDest = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, globalConfigDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
      const ideDest = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, ideDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
      const globalRulesDest = path.join(os.homedir(), '.gemini', 'config', 'rules');
      copyPraxisRulesToDir(praxisSrc, globalRulesDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
      const globalSkillsDest = path.join(os.homedir(), '.gemini', 'config', 'skills');
      copyPraxisSkillsToDir(praxisSrc, globalSkillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    } else {
      const agentsDest = path.join(rootDir, '.agents');
      const skillsDest = path.join(agentsDest, 'skills');
      copyPraxisSkillsToDir(praxisSrc, skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
      const rulesDest = path.join(agentsDest, 'rules');
      copyPraxisRulesToDir(praxisSrc, rulesDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
      const pluginDest = path.join(agentsDest, 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, pluginDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
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
    const grokRoot = scope === 'user' ? path.join(os.homedir(), '.grok') : path.join(rootDir, '.grok');
    copyPluginFiles(praxisSrc, destPath, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    copyPraxisSkillsToDir(praxisSrc, path.join(grokRoot, 'skills'), { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    copyPraxisRulesToDir(praxisSrc, path.join(grokRoot, 'rules'), { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    return true;
  }

  if (host.id === 'agents') {
    const skillsDest = path.join(destPath, 'skills');
    copyPraxisSkillsToDir(praxisSrc, skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const rulesDest = path.join(destPath, 'rules');
    copyPraxisRulesToDir(praxisSrc, rulesDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const hooksDest = path.join(destPath, 'hooks');
    copyPraxisHooksToDir(praxisSrc, hooksDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    return true;
  }

  // Standard plugin copy/link (Claude, Codex, Copilot, Gemini, Pi)
  copyPluginFiles(praxisSrc, destPath, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
  return true;
}

export function uninstallHost(host, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const home = os.homedir();
  const {
    method = 'auto',
    dryRun = false,
  } = options;

  const scope = normalizeScope(options.scope, rootDir);

  console.log(`\n🗑️  Uninstalling Praxis from ${host.displayName} [scope: ${scope}]...`);

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const useNative = (method === 'native' || (method === 'auto' && binaryAvailable)) && Boolean(host.nativeUninstallCmd);

  if (useNative) {
    if (host.id === 'codex') {
      const cmds = [
        'codex plugin remove praxis@praxis-marketplace',
        'codex plugin marketplace remove praxis-marketplace',
      ];
      if (dryRun) {
        cmds.forEach((c) => console.log(`  [dry-run] Executing CLI command: ${c}`));
      } else {
        for (const c of cmds) {
          console.log(`  Executing: ${c}`);
          try {
            execSync(c, { stdio: 'inherit', cwd: rootDir });
          } catch {
            // ignore if not configured or already removed
          }
        }
        console.log(`  [success] Successfully uninstalled via codex CLI.`);
      }
    } else {
      const cmd = host.nativeUninstallCmd();
      if (dryRun) {
        console.log(`  [dry-run] Executing CLI command: ${cmd}`);
        return true;
      }
      console.log(`  Executing: ${cmd}`);
      try {
        execSync(cmd, { stdio: 'inherit', cwd: rootDir });
        console.log(`  [success] Successfully uninstalled via ${host.cliBinary} CLI.`);
        return true;
      } catch (err) {
        console.warn(`  [warning] CLI command failed: ${err.message}. Removing files manually.`);
      }
    }
  }

  // File-level non-destructive cleanup
  const destPath = resolveTargetPath(host, scope, rootDir);

  if (host.id === 'grok') {
    const grokRoot = scope === 'user' ? path.join(home, '.grok') : path.join(rootDir, '.grok');
    const pluginDir = path.join(grokRoot, 'plugins', 'praxis');
    if (fs.existsSync(pluginDir)) {
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
    return true;
  }

  if (host.id === 'agents' || host.id === 'antigravity') {
    if (scope === 'user' && host.id === 'antigravity') {
      const globalPlugin = path.join(home, '.gemini', 'config', 'plugins', 'praxis');
      const idePlugin = path.join(home, '.gemini', 'antigravity-ide', 'plugins', 'praxis');
      for (const p of [globalPlugin, idePlugin]) {
        if (fs.existsSync(p)) {
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
      const targetBase = scope === 'user' ? path.join(home, '.agents') : path.join(rootDir, '.agents');
      const pluginDir = path.join(targetBase, 'plugins', 'praxis');
      if (fs.existsSync(pluginDir)) {
        if (!dryRun) {
          fs.rmSync(pluginDir, { recursive: true, force: true });
          console.log(`  [success] Removed ${pluginDir}`);
          cleanEmptyDirectory(path.join(targetBase, 'plugins'));
        } else {
          console.log(`  [dry-run] Remove ${pluginDir}`);
        }
      }
      removePraxisSkillsFromDir(path.join(targetBase, 'skills'), dryRun);
      removePraxisRulesFromDir(path.join(targetBase, 'rules'), dryRun);
      removePraxisHooksFromDir(path.join(targetBase, 'hooks'), dryRun);
      cleanEmptyDirectory(targetBase);
    }
    return true;
  }

  if (host.id === 'opencode') {
    const opencodeDir = scope === 'user'
      ? path.join(home, '.config', 'opencode')
      : path.join(rootDir, '.opencode');
    const pluginFile = path.join(opencodeDir, 'plugins', 'praxis.js');
    if (fs.existsSync(pluginFile)) {
      if (!dryRun) {
        fs.rmSync(pluginFile, { force: true });
        console.log(`  [success] Removed ${pluginFile}`);
        cleanEmptyDirectory(path.join(opencodeDir, 'plugins'));
      } else {
        console.log(`  [dry-run] Remove ${pluginFile}`);
      }
    }
    removePraxisSkillsFromDir(path.join(opencodeDir, 'skills'), dryRun);
    cleanEmptyDirectory(opencodeDir);

    // Clean up opencode.json config
    const configFile = scope === 'user'
      ? path.join(home, '.config', 'opencode', 'opencode.json')
      : path.join(rootDir, 'opencode.json');
    if (fs.existsSync(configFile)) {
      if (!dryRun) {
        try {
          const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));
          if (Array.isArray(cfg.plugin)) {
            const prevLen = cfg.plugin.length;
            cfg.plugin = cfg.plugin.filter((p) => !p.includes('praxis'));
            if (cfg.plugin.length !== prevLen) {
              fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2), 'utf8');
              console.log(`  [success] Removed praxis entry from ${configFile}`);
            }
          }
        } catch {}
      }
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

  // Generic praxis plugin directory cleanup (Claude, Codex, Copilot, etc.)
  if (fs.existsSync(destPath)) {
    if (dryRun) {
      console.log(`  [dry-run] Remove directory/file: ${destPath}`);
    } else {
      fs.rmSync(destPath, { recursive: true, force: true });
      console.log(`  [success] Removed ${destPath}`);
    }
  } else {
    console.log(`  [skip] Path does not exist: ${destPath}`);
  }

  // Deep cleanup for Codex
  if (host.id === 'codex') {
    const codexHome = path.join(home, '.codex');
    const extraPaths = [
      path.join(codexHome, '.tmp', 'marketplaces', 'praxis-marketplace'),
      path.join(codexHome, 'plugins', 'cache', 'praxis-marketplace'),
      path.join(codexHome, 'plugins', 'praxis'),
      path.join(rootDir, '.codex', 'plugins', 'praxis'),
    ];
    for (const p of extraPaths) {
      if (fs.existsSync(p)) {
        try {
          fs.rmSync(p, { recursive: true, force: true });
          console.log(`  [success] Cleaned cache: ${p}`);
        } catch {}
      }
    }
    const configFiles = [
      path.join(codexHome, 'config.toml'),
      path.join(rootDir, '.codex', 'config.toml'),
    ];
    for (const cfg of configFiles) {
      if (fs.existsSync(cfg)) {
        try {
          let content = fs.readFileSync(cfg, 'utf8');
          content = content.replace(/\[marketplaces\.praxis-marketplace\][^\[]*/g, '');
          content = content.replace(/\[plugins\."praxis@praxis-marketplace"\][^\[]*/g, '');
          fs.writeFileSync(cfg, content.trim() + '\n', 'utf8');
        } catch {}
      }
    }
    cleanEmptyDirectory(path.join(rootDir, '.codex', 'plugins'));
    cleanEmptyDirectory(path.join(rootDir, '.codex'));
  }

  return true;
}

export function updateHost(host, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const {
    method = 'auto',
    dryRun = false,
  } = options;

  const scope = normalizeScope(options.scope, rootDir);

  console.log(`\n🔄 Updating Praxis for ${host.displayName} [scope: ${scope}]...`);

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const useNative = (method === 'native' || (method === 'auto' && binaryAvailable)) && Boolean(host.nativeUpdateCmd);

  if (useNative) {
    if (host.id === 'codex') {
      const cmds = [
        'codex plugin marketplace upgrade praxis-marketplace',
        'codex plugin add praxis@praxis-marketplace',
      ];
      if (dryRun) {
        cmds.forEach((c) => console.log(`  [dry-run] Executing CLI command: ${c}`));
        return true;
      }
      for (const c of cmds) {
        console.log(`  Executing: ${c}`);
        try {
          execSync(c, { stdio: 'inherit', cwd: rootDir });
        } catch {}
      }
      console.log(`  [success] Successfully updated via codex CLI.`);
      return true;
    }

    const cmd = host.nativeUpdateCmd();
    if (dryRun) {
      console.log(`  [dry-run] Executing CLI command: ${cmd}`);
      return true;
    }
    console.log(`  Executing: ${cmd}`);
    try {
      execSync(cmd, { stdio: 'inherit', cwd: rootDir });
      console.log(`  [success] Successfully updated via ${host.cliBinary} CLI.`);
      return true;
    } catch (err) {
      console.warn(`  [warning] CLI update failed: ${err.message}. Re-installing files.`);
    }
  }

  return installHost(host, { ...options, scope, force: true });
}

export function getHostStatus(host, rootDir = process.cwd()) {
  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const isHome = isHomeDirectory(rootDir);
  const home = os.homedir();

  // Check user scope
  let userInstalled = false;
  if (host.id === 'agents') {
    userInstalled = fs.existsSync(path.join(home, '.agents', 'skills', 'using-praxis')) || fs.existsSync(path.join(home, '.agents', 'plugins', 'praxis'));
  } else {
    userInstalled = fs.existsSync(host.userTarget);
    if (!userInstalled && host.userAltTargets) {
      userInstalled = host.userAltTargets.some((alt) => fs.existsSync(alt));
    }
  }

  if (!userInstalled) {
    if (host.id === 'claude') {
      const installedFile = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
      if (fs.existsSync(installedFile)) {
        try {
          const j = JSON.parse(fs.readFileSync(installedFile, 'utf8'));
          if (j.plugins && Object.keys(j.plugins).some((k) => k.includes('praxis'))) {
            userInstalled = true;
          }
        } catch {}
      }
      if (!userInstalled) {
        const settingsFile = path.join(home, '.claude', 'settings.json');
        if (fs.existsSync(settingsFile)) {
          try {
            const j = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            if (j.enabledPlugins && Object.keys(j.enabledPlugins).some((k) => k.includes('praxis') && j.enabledPlugins[k] !== false)) {
              userInstalled = true;
            }
          } catch {}
        }
      }
      if (!userInstalled) {
        const cacheDir = path.join(home, '.claude', 'plugins', 'cache');
        if (fs.existsSync(cacheDir)) {
          try {
            const list = fs.readdirSync(cacheDir);
            if (list.some((item) => item.includes('praxis'))) userInstalled = true;
          } catch {}
        }
      }
    } else if (host.id === 'codex') {
      const configToml = path.join(home, '.codex', 'config.toml');
      if (fs.existsSync(configToml)) {
        try {
          const text = fs.readFileSync(configToml, 'utf8');
          if (text.includes('praxis')) {
            userInstalled = true;
          }
        } catch {}
      }
    } else if (host.id === 'opencode') {
      const userCfg = path.join(home, '.config', 'opencode', 'opencode.json');
      if (fs.existsSync(userCfg)) {
        try {
          const j = JSON.parse(fs.readFileSync(userCfg, 'utf8'));
          if (Array.isArray(j.plugin) && j.plugin.some((p) => p.includes('praxis'))) {
            userInstalled = true;
          }
        } catch {}
      }
    } else if (host.id === 'pi') {
      const piCfg = path.join(home, '.pi', 'agent', 'settings.json');
      if (fs.existsSync(piCfg)) {
        try {
          const text = fs.readFileSync(piCfg, 'utf8');
          if (text.includes('praxis')) userInstalled = true;
        } catch {}
      }
    } else if (host.id === 'grok') {
      const registry = path.join(home, '.grok', 'installed-plugins', 'registry.json');
      if (fs.existsSync(registry)) {
        try {
          const j = JSON.parse(fs.readFileSync(registry, 'utf8'));
          if (j.repos && Object.values(j.repos).some((repo) => repo.plugins && Object.keys(repo.plugins).includes('praxis'))) {
            userInstalled = true;
          }
        } catch {}
      }
    } else if (host.id === 'omp') {
      const pkgFile = path.join(home, '.omp', 'plugins', 'package.json');
      if (fs.existsSync(pkgFile)) {
        try {
          const j = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
          if (j.dependencies && Object.keys(j.dependencies).some((k) => k.includes('praxis'))) {
            userInstalled = true;
          }
        } catch {}
      }
      if (!userInstalled) {
        const lockFile = path.join(home, '.omp', 'plugins', 'omp-plugins.lock.json');
        if (fs.existsSync(lockFile)) {
          try {
            const j = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
            if (j.plugins && Object.keys(j.plugins).some((k) => k.includes('praxis'))) {
              userInstalled = true;
            }
          } catch {}
        }
      }
    } else if (host.id === 'agents') {
      userInstalled = fs.existsSync(path.join(home, '.agents', 'skills', 'using-praxis')) || fs.existsSync(path.join(home, '.agents', 'plugins', 'praxis'));
    }
  }

  // Check project scope (tracked in git / project manifest)
  let projectInstalled = false;
  if (!isHome) {
    if (host.id === 'opencode') {
      const projCfg = path.join(rootDir, 'opencode.json');
      if (fs.existsSync(projCfg)) {
        try {
          const j = JSON.parse(fs.readFileSync(projCfg, 'utf8'));
          if (Array.isArray(j.plugin) && j.plugin.some((p) => p.includes('praxis'))) {
            projectInstalled = true;
          }
        } catch {}
      }
    } else if (host.id === 'agents' || host.id === 'antigravity') {
      const agentsSkill = path.join(rootDir, '.agents', 'skills', 'using-praxis');
      const agentsPlugins = path.join(rootDir, '.agents', 'plugins', 'praxis');
      projectInstalled = fs.existsSync(agentsSkill) || fs.existsSync(agentsPlugins);
    } else if (host.id === 'claude') {
      const projSettings = path.join(rootDir, '.claude', 'settings.json');
      if (fs.existsSync(projSettings)) {
        try {
          const j = JSON.parse(fs.readFileSync(projSettings, 'utf8'));
          if (j.enabledPlugins && Object.keys(j.enabledPlugins).some((k) => k.includes('praxis') && j.enabledPlugins[k] !== false)) {
            projectInstalled = true;
          }
        } catch {}
      }
      if (!projectInstalled) {
        projectInstalled = fs.existsSync(path.resolve(rootDir, host.projectTarget));
      }
    } else if (host.id === 'codex') {
      const projConfig = path.join(rootDir, '.codex', 'config.toml');
      if (fs.existsSync(projConfig)) {
        try {
          const text = fs.readFileSync(projConfig, 'utf8');
          if (text.includes('praxis')) projectInstalled = true;
        } catch {}
      }
      if (!projectInstalled) {
        projectInstalled = fs.existsSync(path.resolve(rootDir, host.projectTarget));
      }
    } else if (host.id === 'omp') {
      const ompSkills = path.join(rootDir, '.omp', 'skills', 'using-praxis');
      const ompPlugins = path.join(rootDir, '.omp', 'plugins');
      projectInstalled = fs.existsSync(ompSkills) || fs.existsSync(ompPlugins);
    } else if (host.id === 'qoder') {
      const qoderPlugin = path.join(rootDir, '.qoder-plugin', 'plugin.json');
      const qoderSkill = path.join(rootDir, 'skills', 'using-praxis');
      projectInstalled = fs.existsSync(qoderPlugin) || fs.existsSync(qoderSkill);
    } else if (host.id === 'grok') {
      const grok = path.join(rootDir, '.grok');
      projectInstalled = fs.existsSync(path.join(grok, 'plugins', 'praxis'))
        || fs.existsSync(path.join(grok, 'rules', 'praxis.md'))
        || fs.existsSync(path.join(grok, 'skills', 'using-praxis'));
    } else {
      const projectPath = resolveTargetPath(host, 'project', rootDir);
      projectInstalled = fs.existsSync(projectPath);
    }
  }

  // Check local scope (workspace local installation)
  let localInstalled = false;
  if (!isHome) {
    if (host.id === 'opencode') {
      const localPlugin = path.join(rootDir, '.opencode', 'plugins', 'praxis.js');
      localInstalled = fs.existsSync(localPlugin);
    } else if (host.id === 'antigravity' || host.id === 'agents') {
      const localPlugin = path.join(rootDir, '.agents', 'plugins', 'praxis');
      const localSkill = path.join(rootDir, '.agents', 'skills', 'using-praxis');
      localInstalled = fs.existsSync(localPlugin) || fs.existsSync(localSkill);
    } else if (host.id === 'omp') {
      const localSkill = path.join(rootDir, '.omp', 'skills', 'using-praxis');
      const localPlugin = path.join(rootDir, '.omp', 'plugins');
      localInstalled = fs.existsSync(localSkill) || fs.existsSync(localPlugin);
    } else if (host.id === 'qoder') {
      const localPlugin = path.join(rootDir, '.qoder-plugin', 'plugin.json');
      const localSkill = path.join(rootDir, 'skills', 'using-praxis');
      localInstalled = fs.existsSync(localPlugin) || fs.existsSync(localSkill);
    } else if (host.id === 'grok') {
      const grok = path.join(rootDir, '.grok');
      localInstalled = fs.existsSync(path.join(grok, 'plugins', 'praxis'))
        || fs.existsSync(path.join(grok, 'rules', 'praxis.md'))
        || fs.existsSync(path.join(grok, 'skills', 'using-praxis'));
    } else {
      const localPath = resolveTargetPath(host, 'local', rootDir);
      localInstalled = fs.existsSync(localPath);
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
    localPath: isHome ? null : resolveTargetPath(host, 'local', rootDir),
    projectPath: isHome ? null : resolveTargetPath(host, 'project', rootDir),
    userPath: host.userTarget,
  };
}
