import path from 'node:path';
import { HOSTS } from '../hosts.js';
import {
  copyOrLink,
  copyPraxisSkillsToDir,
  pathExistsLstat,
  removePathSafe,
  removePraxisSkillsFromDir,
  resolveAdapterCtx,
  resolveStatusCtx,
  resolveTargetPath,
} from '../shared.js';

export default {
  id: 'qoder',
  alwaysRunFileUninstall: false,

  installFiles(rawCtx) {
    const { rootDir, scope, method, force, dryRun, praxisSrc, destPath } = resolveAdapterCtx(HOSTS.qoder, rawCtx);
    const effectiveMethod = method === 'link' ? 'link' : 'copy';

    const skillsDest = scope === 'user' ? path.join(destPath, 'skills') : path.join(rootDir, 'skills');
    copyPraxisSkillsToDir(praxisSrc, skillsDest, { method: effectiveMethod, force, dryRun });

    const manifestDest = scope === 'user'
      ? path.join(destPath, 'plugin.json')
      : path.join(rootDir, '.qoder-plugin', 'plugin.json');
    copyOrLink(path.join(praxisSrc, '.qoder-plugin', 'plugin.json'), manifestDest, {
      method: effectiveMethod,
      force,
      dryRun,
    });
    return true;
  },

  uninstallFiles(rawCtx) {
    const { rootDir, homeDir, scope, dryRun } = resolveAdapterCtx(HOSTS.qoder, rawCtx);

    if (scope === 'user') {
      for (const p of [
        path.join(homeDir, '.qoder-cn', 'plugins', 'praxis'),
        path.join(homeDir, '.qoder', 'plugins', 'praxis'),
      ]) {
        removePathSafe(p, 'plugin', { recursive: true, dryRun });
      }
      return true;
    }

    const qoderPluginFile = path.join(rootDir, '.qoder-plugin', 'plugin.json');
    if (pathExistsLstat(qoderPluginFile)) {
      removePathSafe(path.join(rootDir, '.qoder-plugin'), 'directory', { recursive: true, dryRun });
    }
    removePraxisSkillsFromDir(path.join(rootDir, 'skills'), dryRun);
    return true;
  },

  getStatus(rawStatusCtx) {
    const { host, rootDir, homeDir, isHome } = resolveStatusCtx(HOSTS.qoder, rawStatusCtx);

    const userInstalled =
      pathExistsLstat(resolveTargetPath(host, 'user', rootDir, homeDir)) ||
      pathExistsLstat(path.join(homeDir, '.qoder-cn', 'praxis')) ||
      pathExistsLstat(path.join(homeDir, '.qoder', 'plugins', 'praxis'));

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      const workspaceInstalled =
        pathExistsLstat(path.join(rootDir, '.qoder-plugin', 'plugin.json')) ||
        pathExistsLstat(path.join(rootDir, 'skills', 'using-praxis'));
      projectInstalled = workspaceInstalled;
      localInstalled = workspaceInstalled;
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
