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
    return isHomeDirectory(rootDir) ? 'user' : 'project';
  }
  const s = scope.toLowerCase().trim();
  if (s === 'global' || s === 'user') return 'user';
  if (s === 'local') return 'local';
  if (s === 'project' || s === 'workspace') return 'project';
  return 'project';
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

export function installHost(host, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const scope = normalizeScope(options.scope || host.defaultScope, rootDir);
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
    copyOrLink(path.join(praxisSrc, 'skills'), skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    return true;
  }

  if (host.id === 'antigravity') {
    if (scope === 'user') {
      const globalConfigDest = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, globalConfigDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
      const ideDest = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, ideDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    } else {
      const agentsDest = path.join(rootDir, '.agents');
      const skillsDest = path.join(agentsDest, 'skills');
      copyOrLink(path.join(praxisSrc, 'skills'), skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
      const pluginDest = path.join(agentsDest, 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, pluginDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    }
    return true;
  }

  if (host.id === 'qoder') {
    const skillsDest = scope === 'user' ? path.join(destPath, 'skills') : path.join(rootDir, 'skills');
    copyOrLink(path.join(praxisSrc, 'skills'), skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const manifestDest = scope === 'user' ? path.join(destPath, 'plugin.json') : path.join(rootDir, '.qoder-plugin', 'plugin.json');
    copyOrLink(path.join(praxisSrc, '.qoder-plugin', 'plugin.json'), manifestDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    return true;
  }

  if (host.id === 'agents') {
    const skillsDest = path.join(destPath, 'skills');
    copyOrLink(path.join(praxisSrc, 'skills'), skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const hooksDest = path.join(destPath, 'hooks');
    copyOrLink(path.join(praxisSrc, 'hooks'), hooksDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    return true;
  }

  // Standard plugin copy/link (Claude, Codex, Copilot, Gemini, Pi)
  copyPluginFiles(praxisSrc, destPath, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
  return true;
}

export function copyPluginFiles(src, dest, { method = 'copy', force = false, dryRun = false } = {}) {
  const itemsToCopy = [
    'skills',
    'hooks',
    'extensions',
    '.claude-plugin',
    '.codex-plugin',
    '.copilot-plugin',
    '.qoder-plugin',
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

export function uninstallHost(host, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const scope = normalizeScope(options.scope || host.defaultScope, rootDir);
  const {
    method = 'auto',
    dryRun = false,
  } = options;

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

  // File-level cleanup
  const destPath = resolveTargetPath(host, scope, rootDir);
  if (dryRun) {
    console.log(`  [dry-run] Remove directory/file: ${destPath}`);
    return true;
  }

  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
    console.log(`  [success] Removed ${destPath}`);
  } else {
    console.log(`  [skip] Path does not exist: ${destPath}`);
  }

  // Deep cleanup for Codex
  if (host.id === 'codex') {
    const codexHome = path.join(os.homedir(), '.codex');
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
  }

  return true;
}

export function updateHost(host, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const scope = normalizeScope(options.scope || host.defaultScope, rootDir);
  const {
    method = 'auto',
    dryRun = false,
  } = options;

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

  return installHost(host, { ...options, force: true });
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
