import fs from 'node:fs';
import path from 'node:path';
import { HOSTS } from '../hosts.js';
import {
  cleanEmptyDirectory,
  genericPluginInstall,
  hasPraxisCodexToml,
  pathExistsLstat,
  removePathSafe,
  resolveAdapterCtx,
  resolveStatusCtx,
  stripPraxisCodexToml,
  writeFileAtomic,
} from '../shared.js';

export default {
  id: 'codex',
  alwaysRunFileUninstall: true,

  installFiles(ctx) {
    return genericPluginInstall(HOSTS.codex, ctx);
  },

  uninstallFiles(rawCtx) {
    const { rootDir, homeDir, scope, dryRun } = resolveAdapterCtx(HOSTS.codex, rawCtx);
    const codexBase = scope === 'user' ? path.join(homeDir, '.codex') : path.join(rootDir, '.codex');
    const cfgFile = path.join(codexBase, 'config.toml');
    const targetDirs = scope === 'user'
      ? [
          path.join(codexBase, 'plugins', 'praxis'),
          path.join(codexBase, '.tmp', 'marketplaces', 'praxis-marketplace'),
          path.join(codexBase, 'plugins', 'cache', 'praxis-marketplace'),
        ]
      : [path.join(codexBase, 'plugins', 'praxis')];

    try {
      if (pathExistsLstat(cfgFile)) {
        const raw = fs.readFileSync(cfgFile, 'utf8');
        const stripped = stripPraxisCodexToml(raw);
        if (stripped.changed) {
          if (dryRun) {
            console.log(`  [dry-run] Remove Praxis sections from ${cfgFile}`);
          } else {
            writeFileAtomic(cfgFile, stripped.content);
            console.log(`  [success] Cleaned Praxis sections from ${cfgFile}`);
          }
        }
      }

      for (const p of targetDirs) {
        removePathSafe(p, 'directory/file', { recursive: true, dryRun });
      }

      if (!dryRun && scope !== 'user') {
        cleanEmptyDirectory(path.join(rootDir, '.codex', 'plugins'));
        cleanEmptyDirectory(path.join(rootDir, '.codex'));
      }
      return true;
    } catch (err) {
      console.error(`  [error] Failed to uninstall Codex artifacts: ${err.message}`);
      return false;
    }
  },

  getStatus(rawStatusCtx) {
    const { rootDir, homeDir, isHome, readFileSafe } = resolveStatusCtx(HOSTS.codex, rawStatusCtx);

    const userInstalled =
      pathExistsLstat(path.join(homeDir, '.codex', 'plugins', 'praxis')) ||
      pathExistsLstat(path.join(homeDir, '.codex', '.tmp', 'marketplaces', 'praxis-marketplace')) ||
      pathExistsLstat(path.join(homeDir, '.codex', 'plugins', 'cache', 'praxis-marketplace')) ||
      hasPraxisCodexToml(readFileSafe(path.join(homeDir, '.codex', 'config.toml')));

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      const workspaceInstalled =
        pathExistsLstat(path.join(rootDir, '.codex', 'plugins', 'praxis')) ||
        hasPraxisCodexToml(readFileSafe(path.join(rootDir, '.codex', 'config.toml')));
      projectInstalled = workspaceInstalled;
      localInstalled = workspaceInstalled;
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
