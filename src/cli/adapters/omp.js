import path from 'node:path';
import { HOSTS } from '../hosts.js';
import {
  cleanEmptyDirectory,
  copyPluginFiles,
  copyPraxisSkillsToDir,
  pathExistsLstat,
  removePathSafe,
  removePraxisSkillsFromDir,
  resolveAdapterCtx,
  resolveStatusCtx,
} from '../shared.js';

function hasOmpPluginInDir(pluginsDir, readFileSafe) {
  if (
    pathExistsLstat(path.join(pluginsDir, 'node_modules', 'praxis')) ||
    pathExistsLstat(path.join(pluginsDir, 'node_modules', '@ouonet', 'praxis')) ||
    pathExistsLstat(path.join(pluginsDir, 'praxis'))
  ) {
    return true;
  }

  const pkgText = readFileSafe(path.join(pluginsDir, 'package.json'));
  if (pkgText) {
    try {
      const j = JSON.parse(pkgText);
      if (j.dependencies && Object.keys(j.dependencies).some((k) => k.includes('praxis'))) {
        return true;
      }
    } catch {}
  }

  const lockText = readFileSafe(path.join(pluginsDir, 'omp-plugins.lock.json'));
  if (lockText) {
    try {
      const j = JSON.parse(lockText);
      if (j.plugins && Object.keys(j.plugins).some((k) => k.includes('praxis'))) {
        return true;
      }
    } catch {}
  }

  return false;
}

export default {
  id: 'omp',
  alwaysRunFileUninstall: false,

  installFiles(rawCtx) {
    const { scope, method, force, dryRun, praxisSrc, destPath } = resolveAdapterCtx(HOSTS.omp, rawCtx);
    const effectiveMethod = method === 'link' ? 'link' : 'copy';

    if (scope === 'user') {
      copyPluginFiles(praxisSrc, destPath, { method: effectiveMethod, force, dryRun });
    } else {
      copyPraxisSkillsToDir(praxisSrc, destPath, { method: effectiveMethod, force, dryRun });
    }
    return true;
  },

  uninstallFiles(rawCtx) {
    const { rootDir, homeDir, scope, dryRun } = resolveAdapterCtx(HOSTS.omp, rawCtx);

    if (scope === 'user') {
      for (const p of [
        path.join(homeDir, '.omp', 'plugins', 'node_modules', 'praxis'),
        path.join(homeDir, '.omp', 'plugins', 'praxis'),
      ]) {
        removePathSafe(p, 'plugin', { recursive: true, dryRun });
      }
      removePraxisSkillsFromDir(path.join(homeDir, '.omp', 'skills'), dryRun);
    } else {
      removePraxisSkillsFromDir(path.join(rootDir, '.omp', 'skills'), dryRun);
      removePathSafe(path.join(rootDir, '.omp', 'plugins', 'praxis'), 'plugin', { recursive: true, dryRun });
      if (!dryRun) cleanEmptyDirectory(path.join(rootDir, '.omp'));
    }
    return true;
  },

  getStatus(rawStatusCtx) {
    const { rootDir, homeDir, isHome, readFileSafe } = resolveStatusCtx(HOSTS.omp, rawStatusCtx);

    const userInstalled =
      pathExistsLstat(path.join(homeDir, '.omp', 'skills', 'using-praxis')) ||
      hasOmpPluginInDir(path.join(homeDir, '.omp', 'plugins'), readFileSafe);

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      const workspaceInstalled =
        pathExistsLstat(path.join(rootDir, '.omp', 'skills', 'using-praxis')) ||
        hasOmpPluginInDir(path.join(rootDir, '.omp', 'plugins'), readFileSafe);
      projectInstalled = workspaceInstalled;
      localInstalled = workspaceInstalled;
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
