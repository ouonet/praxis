import path from 'node:path';
import { HOSTS } from '../hosts.js';
import {
  cleanEmptyDirectory,
  copyPluginFiles,
  copyPraxisSkillsToDir,
  hasPraxisPiSettingsText,
  pathExistsLstat,
  removePathSafe,
  removePraxisSkillsFromDir,
  resolveAdapterCtx,
  resolveStatusCtx,
} from '../shared.js';

export default {
  id: 'pi',
  alwaysRunFileUninstall: false,

  installFiles(rawCtx) {
    const { scope, method, force, dryRun, praxisSrc, destPath } = resolveAdapterCtx(HOSTS.pi, rawCtx);
    const effectiveMethod = method === 'link' ? 'link' : 'copy';

    if (scope === 'user') {
      copyPluginFiles(praxisSrc, destPath, { method: effectiveMethod, force, dryRun });
    } else {
      copyPraxisSkillsToDir(praxisSrc, destPath, { method: effectiveMethod, force, dryRun });
    }
    return true;
  },

  uninstallFiles(rawCtx) {
    const { rootDir, homeDir, scope, dryRun } = resolveAdapterCtx(HOSTS.pi, rawCtx);

    if (scope === 'user') {
      removePathSafe(path.join(homeDir, '.pi', 'plugins', 'praxis'), 'plugin', { recursive: true, dryRun });
      removePraxisSkillsFromDir(path.join(homeDir, '.pi', 'skills'), dryRun);
      removePraxisSkillsFromDir(path.join(homeDir, '.pi', 'agent', 'skills'), dryRun);
    } else {
      removePraxisSkillsFromDir(path.join(rootDir, '.pi', 'skills'), dryRun);
      if (!dryRun) cleanEmptyDirectory(path.join(rootDir, '.pi'));
    }
    return true;
  },

  getStatus(rawStatusCtx) {
    const { rootDir, homeDir, isHome, readFileSafe } = resolveStatusCtx(HOSTS.pi, rawStatusCtx);

    const userInstalled =
      pathExistsLstat(path.join(homeDir, '.pi', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(homeDir, '.pi', 'agent', 'skills', 'using-praxis')) ||
      pathExistsLstat(path.join(homeDir, '.pi', 'skills', 'using-praxis')) ||
      hasPraxisPiSettingsText(readFileSafe(path.join(homeDir, '.pi', 'agent', 'settings.json')));

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      const workspaceInstalled =
        pathExistsLstat(path.join(rootDir, '.pi', 'skills', 'using-praxis')) ||
        hasPraxisPiSettingsText(readFileSafe(path.join(rootDir, '.pi', 'settings.json')));
      projectInstalled = workspaceInstalled;
      localInstalled = workspaceInstalled;
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
