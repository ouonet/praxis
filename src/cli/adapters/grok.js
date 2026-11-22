import path from 'node:path';
import { HOSTS } from '../hosts.js';
import {
  cleanEmptyDirectory,
  copyManagedRuleFile,
  copyPluginFiles,
  copyPraxisSkillsToDir,
  isPraxisManagedRuleFile,
  pathExistsLstat,
  removePathSafe,
  removePraxisRulesFromDir,
  removePraxisSkillsFromDir,
  resolveAdapterCtx,
  resolveStatusCtx,
} from '../shared.js';

export default {
  id: 'grok',
  alwaysRunFileUninstall: false,

  installFiles(rawCtx) {
    const { rootDir, homeDir, scope, method, force, dryRun, praxisSrc } = resolveAdapterCtx(HOSTS.grok, rawCtx);
    const effectiveMethod = method === 'link' ? 'link' : 'copy';
    const grokRoot = scope === 'user' ? path.join(homeDir, '.grok') : path.join(rootDir, '.grok');

    copyPluginFiles(praxisSrc, path.join(grokRoot, 'plugins', 'praxis'), {
      method: effectiveMethod,
      force,
      dryRun,
      exclude: ['rules'],
    });
    copyPraxisSkillsToDir(praxisSrc, path.join(grokRoot, 'skills'), { method: effectiveMethod, force, dryRun });
    copyManagedRuleFile(path.join(praxisSrc, 'rules', 'praxis.md'), path.join(grokRoot, 'rules', 'praxis.md'), {
      method: effectiveMethod,
      force,
      dryRun,
    });

    if (force) {
      const legacyAgentsRule = path.join(grokRoot, 'rules', 'AGENTS.md');
      if (isPraxisManagedRuleFile(legacyAgentsRule)) {
        removePathSafe(legacyAgentsRule, 'legacy rule', { dryRun });
      }
    }
    return true;
  },

  uninstallFiles(rawCtx) {
    const { rootDir, homeDir, scope, dryRun } = resolveAdapterCtx(HOSTS.grok, rawCtx);
    const grokRoot = scope === 'user' ? path.join(homeDir, '.grok') : path.join(rootDir, '.grok');

    removePathSafe(path.join(grokRoot, 'plugins', 'praxis'), 'plugin', { recursive: true, dryRun });
    if (!dryRun) cleanEmptyDirectory(path.join(grokRoot, 'plugins'));
    removePraxisSkillsFromDir(path.join(grokRoot, 'skills'), dryRun);
    removePraxisRulesFromDir(path.join(grokRoot, 'rules'), dryRun);
    if (!dryRun) cleanEmptyDirectory(grokRoot);
    return true;
  },

  getStatus(rawStatusCtx) {
    const { rootDir, homeDir, isHome, readFileSafe } = resolveStatusCtx(HOSTS.grok, rawStatusCtx);

    let regHasPraxis = false;
    const regText = readFileSafe(path.join(homeDir, '.grok', 'installed-plugins', 'registry.json'));
    if (regText) {
      try {
        const j = JSON.parse(regText);
        if (j.repos && Object.values(j.repos).some((repo) => repo.plugins && Object.keys(repo.plugins).includes('praxis'))) {
          regHasPraxis = true;
        }
      } catch {}
    }

    const userInstalled =
      pathExistsLstat(path.join(homeDir, '.grok', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(homeDir, '.grok', 'skills', 'using-praxis')) ||
      isPraxisManagedRuleFile(path.join(homeDir, '.grok', 'rules', 'praxis.md')) ||
      isPraxisManagedRuleFile(path.join(homeDir, '.grok', 'rules', 'AGENTS.md')) ||
      regHasPraxis;

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      const workspaceInstalled =
        pathExistsLstat(path.join(rootDir, '.grok', 'plugins', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.grok', 'skills', 'using-praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.grok', 'rules', 'praxis.md'));
      projectInstalled = workspaceInstalled;
      localInstalled = workspaceInstalled;
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
