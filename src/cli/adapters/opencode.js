import path from 'node:path';
import { HOSTS } from '../hosts.js';
import {
  cleanEmptyDirectory,
  copyOrLink,
  copyPraxisSkillsToDir,
  hasPraxisOpencodeConfigText,
  isPraxisPluginEntry,
  pathExistsLstat,
  readValidatedOpencodeJson,
  removePathSafe,
  removePraxisSkillsFromDir,
  resolveAdapterCtx,
  resolveStatusCtx,
  writeFileAtomic,
} from '../shared.js';

function upsertOpencodePluginEntry(configFile, { ref, force, dryRun }) {
  let configResult;
  try {
    configResult = readValidatedOpencodeJson(configFile);
  } catch (err) {
    console.error(`  [error] Failed to validate ${configFile}: ${err.message}`);
    return false;
  }
  const config = configResult.config;
  config.plugin = config.plugin || [];

  const targetEntry = ref
    ? `praxis@git+https://github.com/ouonet/praxis.git#${ref}`
    : 'praxis@git+https://github.com/ouonet/praxis.git';

  const existingIndex = config.plugin.findIndex((p) => isPraxisPluginEntry(p));
  let modified = false;

  if (existingIndex !== -1) {
    if (force || ref !== null) {
      if (config.plugin[existingIndex] !== targetEntry) {
        config.plugin[existingIndex] = targetEntry;
        modified = true;
      }
    }
  } else {
    config.plugin.push(targetEntry);
    modified = true;
  }

  if (modified) {
    if (!dryRun) {
      writeFileAtomic(configFile, JSON.stringify(config, null, 2) + '\n');
      console.log(`  [success] Updated ${configFile}`);
    } else {
      console.log(`  [dry-run] Update plugin list in ${configFile}`);
    }
  }
  return true;
}

function stripOpencodePluginEntry(configFile, { dryRun }) {
  if (!pathExistsLstat(configFile)) return true;

  let configResult;
  try {
    configResult = readValidatedOpencodeJson(configFile);
  } catch (err) {
    console.error(`  [error] Failed to validate ${configFile}: ${err.message}`);
    return false;
  }

  const config = configResult.config;
  if (Array.isArray(config.plugin)) {
    const prevLen = config.plugin.length;
    config.plugin = config.plugin.filter((p) => !isPraxisPluginEntry(p));
    if (config.plugin.length !== prevLen) {
      if (!dryRun) {
        writeFileAtomic(configFile, JSON.stringify(config, null, 2) + '\n');
        console.log(`  [success] Removed praxis entry from ${configFile}`);
      } else {
        console.log(`  [dry-run] Remove praxis entry from ${configFile}`);
      }
    }
  }
  return true;
}

function copyOpencodePluginAndSkills(praxisSrc, opencodeDir, { method, force, dryRun }) {
  const effectiveMethod = method === 'link' ? 'link' : 'copy';
  const pluginDest = path.join(opencodeDir, 'plugins', 'praxis.js');
  copyOrLink(path.join(praxisSrc, '.opencode', 'plugins', 'praxis.js'), pluginDest, {
    method: effectiveMethod,
    force,
    dryRun,
  });
  copyPraxisSkillsToDir(praxisSrc, path.join(opencodeDir, 'skills'), {
    method: effectiveMethod,
    force,
    dryRun,
  });
}

export default {
  id: 'opencode',
  alwaysRunFileUninstall: false,

  installFiles(rawCtx) {
    const { rootDir, homeDir, scope, method, ref, dryRun, force, praxisSrc } = resolveAdapterCtx(
      HOSTS.opencode,
      rawCtx,
    );

    if (method === 'native') {
      console.error(`  [error] Native install is not available for OpenCode [scope: ${scope}].`);
      return false;
    }

    const opencodeDir = scope === 'user'
      ? path.join(homeDir, '.config', 'opencode')
      : path.join(rootDir, '.opencode');
    const configFile = scope === 'user'
      ? path.join(homeDir, '.config', 'opencode', 'opencode.json')
      : path.join(rootDir, 'opencode.json');

    if (scope === 'project') {
      if (method === 'copy' || method === 'link') {
        console.error(
          `  [error] OpenCode project scope only supports --method auto (opencode.json). Use --scope local for file installation.`,
        );
        return false;
      }
      return upsertOpencodePluginEntry(configFile, { ref, force, dryRun });
    }

    if (scope === 'local') {
      if (ref !== null) {
        console.error(`  [error] --ref is not supported for OpenCode local scope.`);
        return false;
      }
      copyOpencodePluginAndSkills(praxisSrc, opencodeDir, { method, force, dryRun });
      return true;
    }

    // scope === 'user'
    if (method === 'auto') {
      if (!upsertOpencodePluginEntry(configFile, { ref, force, dryRun })) {
        return false;
      }
      removePathSafe(path.join(opencodeDir, 'plugins', 'praxis.js'), 'legacy plugin', { dryRun });
      if (!dryRun) cleanEmptyDirectory(path.join(opencodeDir, 'plugins'));
      removePraxisSkillsFromDir(path.join(opencodeDir, 'skills'), dryRun);
      if (!dryRun) cleanEmptyDirectory(opencodeDir);
      return true;
    }

    // user + copy/link: validate & strip opencode.json BEFORE writing local plugin files
    if (!stripOpencodePluginEntry(configFile, { dryRun })) {
      return false;
    }
    copyOpencodePluginAndSkills(praxisSrc, opencodeDir, { method, force, dryRun });
    return true;
  },

  uninstallFiles(rawCtx) {
    const { rootDir, homeDir, scope, dryRun } = resolveAdapterCtx(HOSTS.opencode, rawCtx);

    if (scope === 'project' || scope === 'user') {
      const configFile = scope === 'user'
        ? path.join(homeDir, '.config', 'opencode', 'opencode.json')
        : path.join(rootDir, 'opencode.json');
      if (!stripOpencodePluginEntry(configFile, { dryRun })) {
        return false;
      }
    }

    if (scope !== 'project') {
      const opencodeDir = scope === 'user'
        ? path.join(homeDir, '.config', 'opencode')
        : path.join(rootDir, '.opencode');
      removePathSafe(path.join(opencodeDir, 'plugins', 'praxis.js'), 'plugin', { dryRun });
      if (!dryRun) cleanEmptyDirectory(path.join(opencodeDir, 'plugins'));
      removePraxisSkillsFromDir(path.join(opencodeDir, 'skills'), dryRun);
      if (!dryRun) cleanEmptyDirectory(opencodeDir);
    }

    return true;
  },

  getStatus(rawStatusCtx) {
    const { rootDir, homeDir, isHome, readFileSafe } = resolveStatusCtx(HOSTS.opencode, rawStatusCtx);

    const userInstalled =
      pathExistsLstat(path.join(homeDir, '.config', 'opencode', 'plugins', 'praxis.js')) ||
      pathExistsLstat(path.join(homeDir, '.config', 'opencode', 'skills', 'using-praxis')) ||
      hasPraxisOpencodeConfigText(readFileSafe(path.join(homeDir, '.config', 'opencode', 'opencode.json')));

    let projectInstalled = false;
    let localInstalled = false;
    if (!isHome) {
      projectInstalled = hasPraxisOpencodeConfigText(readFileSafe(path.join(rootDir, 'opencode.json')));
      localInstalled =
        pathExistsLstat(path.join(rootDir, '.opencode', 'plugins', 'praxis.js')) ||
        pathExistsLstat(path.join(rootDir, '.opencode', 'skills', 'using-praxis'));
    }

    return { userInstalled, projectInstalled, localInstalled };
  },
};
