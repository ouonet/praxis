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
  id: 'antigravity',
  alwaysRunFileUninstall: false,

  installFiles(rawCtx) {
    const { rootDir, homeDir, scope, method, force, dryRun, praxisSrc } = resolveAdapterCtx(
      HOSTS.antigravity,
      rawCtx,
    );
    const effectiveMethod = method === 'link' ? 'link' : 'copy';

    if (scope === 'user') {
      const globalConfigDest = path.join(homeDir, '.gemini', 'config', 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, globalConfigDest, { method: effectiveMethod, force, dryRun, exclude: ['rules'] });
      const ideDest = path.join(homeDir, '.gemini', 'antigravity-ide', 'plugins', 'praxis');
      copyPluginFiles(praxisSrc, ideDest, { method: effectiveMethod, force, dryRun, exclude: ['rules'] });

      const destAgentsRule = path.join(homeDir, '.gemini', 'config', 'rules', 'AGENTS.md');
      copyManagedRuleFile(path.join(praxisSrc, 'rules', 'AGENTS.md'), destAgentsRule, {
        method: effectiveMethod,
        force,
        dryRun,
      });

      if (force) {
        const legacyPraxisRule = path.join(homeDir, '.gemini', 'config', 'rules', 'praxis.md');
        if (isPraxisManagedRuleFile(legacyPraxisRule)) {
          removePathSafe(legacyPraxisRule, 'legacy rule', { dryRun });
        }
        removePraxisSkillsFromDir(path.join(homeDir, '.gemini', 'config', 'skills'), dryRun);
      }
      return true;
    }

    const agentsDest = path.join(rootDir, '.agents');
    copyPluginFiles(praxisSrc, path.join(agentsDest, 'plugins', 'praxis'), {
      method: effectiveMethod,
      force,
      dryRun,
      exclude: ['rules'],
    });
    copyPraxisSkillsToDir(praxisSrc, path.join(agentsDest, 'skills'), { method: effectiveMethod, force, dryRun });
    copyManagedRuleFile(path.join(praxisSrc, 'rules', 'AGENTS.md'), path.join(agentsDest, 'rules', 'AGENTS.md'), {
      method: effectiveMethod,
      force,
      dryRun,
    });

    if (force) {
      const legacyPraxisRule = path.join(agentsDest, 'rules', 'praxis.md');
      if (isPraxisManagedRuleFile(legacyPraxisRule)) {
        removePathSafe(legacyPraxisRule, 'legacy rule', { dryRun });
      }
    }
    return true;
  },

  uninstallFiles(rawCtx) {
    const { rootDir, homeDir, scope, dryRun } = resolveAdapterCtx(HOSTS.antigravity, rawCtx);

    if (scope === 'user') {
      const globalPlugin = path.join(homeDir, '.gemini', 'config', 'plugins', 'praxis');
      const idePlugin = path.join(homeDir, '.gemini', 'antigravity-ide', 'plugins', 'praxis');
      for (const p of [globalPlugin, idePlugin]) {
        removePathSafe(p, 'plugin', { recursive: true, dryRun });
      }
      removePraxisSkillsFromDir(path.join(homeDir, '.gemini', 'config', 'skills'), dryRun);
      removePraxisRulesFromDir(path.join(homeDir, '.gemini', 'config', 'rules'), dryRun);
      return true;
    }

    const targetBase = path.join(rootDir, '.agents');
    removePathSafe(path.join(targetBase, 'plugins', 'praxis'), 'plugin', { recursive: true, dryRun });
    if (!dryRun) cleanEmptyDirectory(path.join(targetBase, 'plugins'));

    const hasAgentsHook = pathExistsLstat(path.join(targetBase, 'hooks', 'session-start'));
    if (!hasAgentsHook) {
      removePraxisSkillsFromDir(path.join(targetBase, 'skills'), dryRun);
      removePraxisRulesFromDir(path.join(targetBase, 'rules'), dryRun);
      if (!dryRun) cleanEmptyDirectory(targetBase);
    }
    return true;
  },

  getStatus(rawStatusCtx) {
    const { rootDir, homeDir, isHome } = resolveStatusCtx(HOSTS.antigravity, rawStatusCtx);

    const userInstalled =
      pathExistsLstat(path.join(homeDir, '.gemini', 'config', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(homeDir, '.gemini', 'antigravity-ide', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(homeDir, '.gemini', 'config', 'skills', 'using-praxis')) ||
      isPraxisManagedRuleFile(path.join(homeDir, '.gemini', 'config', 'rules', 'AGENTS.md')) ||
      isPraxisManagedRuleFile(path.join(homeDir, '.gemini', 'config', 'rules', 'praxis.md'));

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      const workspaceInstalled =
        pathExistsLstat(path.join(rootDir, '.agents', 'plugins', 'praxis')) ||
        pathExistsLstat(path.join(rootDir, '.agents', 'skills', 'using-praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'AGENTS.md'));
      projectInstalled = workspaceInstalled;
      localInstalled = workspaceInstalled;
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
