import path from 'node:path';
import { HOSTS } from '../hosts.js';
import {
  cleanEmptyDirectory,
  copyManagedRuleFile,
  copyPraxisHooksToDir,
  copyPraxisSkillsToDir,
  isPraxisManagedRuleFile,
  pathExistsLstat,
  removePraxisHooksFromDir,
  removePraxisRulesFromDir,
  removePraxisSkillsFromDir,
  resolveAdapterCtx,
  resolveStatusCtx,
} from '../shared.js';

export default {
  id: 'agents',
  alwaysRunFileUninstall: false,

  installFiles(rawCtx) {
    const { rootDir, homeDir, scope, method, force, dryRun, praxisSrc } = resolveAdapterCtx(HOSTS.agents, rawCtx);
    const effectiveMethod = method === 'link' ? 'link' : 'copy';
    const targetBase = scope === 'user' ? path.join(homeDir, '.agents') : path.join(rootDir, '.agents');

    copyPraxisSkillsToDir(praxisSrc, path.join(targetBase, 'skills'), { method: effectiveMethod, force, dryRun });
    copyPraxisHooksToDir(praxisSrc, path.join(targetBase, 'hooks'), { method: effectiveMethod, force, dryRun });

    const agentsRulePath = path.join(targetBase, 'rules', 'AGENTS.md');
    const praxisRulePath = path.join(targetBase, 'rules', 'praxis.md');
    if (!isPraxisManagedRuleFile(agentsRulePath)) {
      copyManagedRuleFile(path.join(praxisSrc, 'rules', 'praxis.md'), praxisRulePath, {
        method: effectiveMethod,
        force,
        dryRun,
      });
    }
    return true;
  },

  uninstallFiles(rawCtx) {
    const { rootDir, homeDir, scope, dryRun } = resolveAdapterCtx(HOSTS.agents, rawCtx);
    const targetBase = scope === 'user' ? path.join(homeDir, '.agents') : path.join(rootDir, '.agents');

    removePraxisHooksFromDir(path.join(targetBase, 'hooks'), dryRun);

    const hasAntigravityPlugin = pathExistsLstat(path.join(targetBase, 'plugins', 'praxis'));
    if (!hasAntigravityPlugin) {
      removePraxisSkillsFromDir(path.join(targetBase, 'skills'), dryRun);
      removePraxisRulesFromDir(path.join(targetBase, 'rules'), dryRun);
      if (!dryRun) cleanEmptyDirectory(targetBase);
    }
    return true;
  },

  getStatus(rawStatusCtx) {
    const { rootDir, homeDir, isHome } = resolveStatusCtx(HOSTS.agents, rawStatusCtx);

    const userInstalled =
      pathExistsLstat(path.join(homeDir, '.agents', 'skills', 'using-praxis')) ||
      pathExistsLstat(path.join(homeDir, '.agents', 'plugins', 'praxis')) ||
      isPraxisManagedRuleFile(path.join(homeDir, '.agents', 'rules', 'AGENTS.md')) ||
      isPraxisManagedRuleFile(path.join(homeDir, '.agents', 'rules', 'praxis.md'));

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      const workspaceInstalled =
        pathExistsLstat(path.join(rootDir, '.agents', 'skills', 'using-praxis')) ||
        pathExistsLstat(path.join(rootDir, '.agents', 'plugins', 'praxis')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'praxis.md')) ||
        isPraxisManagedRuleFile(path.join(rootDir, '.agents', 'rules', 'AGENTS.md'));
      projectInstalled = workspaceInstalled;
      localInstalled = workspaceInstalled;
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
