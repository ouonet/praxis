import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { HOSTS } from './hosts.js';

export function checkBinaryAvailable(binaryName) {
  if (!binaryName) return false;
  const isWin = os.platform() === 'win32';
  const cmd = isWin ? `where ${binaryName}` : `command -v ${binaryName}`;
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function resolveTargetPath(host, scope, rootDir = process.cwd()) {
  if (scope === 'user') {
    return host.userTarget;
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
  const {
    scope = host.defaultScope || 'project',
    ref = null,
    method = 'auto',
    dryRun = false,
    force = false,
    rootDir = process.cwd(),
    praxisSrc = path.resolve(import.meta.dirname, '../..'),
  } = options;

  console.log(`\n📦 Installing Praxis for ${host.displayName} [scope: ${scope}]...`);

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const useNative = (method === 'native' || (method === 'auto' && binaryAvailable)) && Boolean(host.nativeInstallCmd);

  if (useNative) {
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
    // Special handling for OpenCode: update opencode.json + link/copy plugins
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

    const pluginDest = path.join(destPath, 'plugins', 'praxis.js');
    copyOrLink(path.join(praxisSrc, '.opencode', 'plugins', 'praxis.js'), pluginDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const skillsDest = path.join(destPath, 'skills');
    copyOrLink(path.join(praxisSrc, 'skills'), skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    return true;
  }

  if (host.id === 'qoder') {
    const skillsDest = scope === 'user' ? path.join(destPath, 'skills') : path.join(rootDir, 'skills');
    copyOrLink(path.join(praxisSrc, 'skills'), skillsDest, { method: method === 'link' ? 'link' : 'copy', force, dryRun });
    const manifestDest = path.join(rootDir, '.qoder-plugin', 'plugin.json');
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

// Standard plugin copy/link (Claude, Codex, Copilot, Antigravity, Gemini, Pi)
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
  const {
    scope = host.defaultScope || 'project',
    method = 'auto',
    dryRun = false,
    rootDir = process.cwd(),
  } = options;

  console.log(`\n🗑️  Uninstalling Praxis from ${host.displayName} [scope: ${scope}]...`);

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const useNative = (method === 'native' || (method === 'auto' && binaryAvailable)) && Boolean(host.nativeUninstallCmd);

  if (useNative) {
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
  return true;
}

export function updateHost(host, options = {}) {
  const {
    scope = host.defaultScope || 'project',
    method = 'auto',
    dryRun = false,
    rootDir = process.cwd(),
  } = options;

  console.log(`\n🔄 Updating Praxis for ${host.displayName} [scope: ${scope}]...`);

  const binaryAvailable = checkBinaryAvailable(host.cliBinary);
  const useNative = (method === 'native' || (method === 'auto' && binaryAvailable)) && Boolean(host.nativeUpdateCmd);

  if (useNative) {
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
  const projectPath = resolveTargetPath(host, 'project', rootDir);
  const userPath = resolveTargetPath(host, 'user', rootDir);
  const projectInstalled = fs.existsSync(projectPath);
  const userInstalled = fs.existsSync(userPath);

  return {
    id: host.id,
    displayName: host.displayName,
    cliBinary: host.cliBinary,
    binaryAvailable,
    projectInstalled,
    userInstalled,
    projectPath,
    userPath,
  };
}
