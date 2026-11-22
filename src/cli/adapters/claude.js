import fs from 'node:fs';
import path from 'node:path';
import { HOSTS } from '../hosts.js';
import {
  genericPluginInstall,
  genericPluginUninstall,
  pathExistsLstat,
  resolveStatusCtx,
  resolveTargetPath,
} from '../shared.js';

function hasEnabledPraxisInSettings(settingsText) {
  if (!settingsText) return false;
  try {
    const j = JSON.parse(settingsText);
    return Boolean(
      j.enabledPlugins &&
      Object.keys(j.enabledPlugins).some((k) => k.includes('praxis') && j.enabledPlugins[k] !== false),
    );
  } catch {
    return false;
  }
}

export default {
  id: 'claude',
  alwaysRunFileUninstall: false,

  installFiles(ctx) {
    return genericPluginInstall(HOSTS.claude, ctx);
  },

  uninstallFiles(ctx) {
    return genericPluginUninstall(HOSTS.claude, ctx);
  },

  getStatus(rawStatusCtx) {
    const { host, rootDir, homeDir, isHome, readFileSafe } = resolveStatusCtx(HOSTS.claude, rawStatusCtx);

    let userInstalled = pathExistsLstat(resolveTargetPath(host, 'user', rootDir, homeDir));
    if (!userInstalled) {
      const instText = readFileSafe(path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json'));
      if (instText) {
        try {
          const j = JSON.parse(instText);
          if (j.plugins && Object.keys(j.plugins).some((k) => k.includes('praxis'))) {
            userInstalled = true;
          }
        } catch {}
      }
    }
    if (!userInstalled) {
      userInstalled = hasEnabledPraxisInSettings(readFileSafe(path.join(homeDir, '.claude', 'settings.json')));
    }
    if (!userInstalled) {
      const cacheDir = path.join(homeDir, '.claude', 'plugins', 'cache');
      if (pathExistsLstat(cacheDir)) {
        try {
          if (fs.readdirSync(cacheDir).some((item) => item.includes('praxis'))) {
            userInstalled = true;
          }
        } catch {}
      }
    }

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      const projInstalled =
        hasEnabledPraxisInSettings(readFileSafe(path.join(rootDir, '.claude', 'settings.json'))) ||
        pathExistsLstat(path.resolve(rootDir, host.projectTarget));
      projectInstalled = projInstalled;
      localInstalled = projInstalled;
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
