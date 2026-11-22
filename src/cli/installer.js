import os from 'node:os';
import { HOSTS, formatCommandStep } from './hosts.js';
import { HOST_ADAPTERS, getHostAdapter } from './adapters/index.js';
import {
  PACKAGE_ROOT,
  PLUGIN_ITEMS_TO_COPY,
  DEFAULT_PRAXIS_SKILL_NAMES,
  derivePraxisSkillNames,
  PRAXIS_SKILL_NAMES,
  PRAXIS_HOOK_FILES,
  PRAXIS_RULE_FILES,
  checkBinaryAvailable,
  resolveBinaryAvailable,
  isHomeDirectory,
  normalizeScope,
  normalizeMethod,
  validateRef,
  supportsRef,
  runCommandSteps,
  resolveTargetPath,
  pathExistsLstat,
  readFileSafe,
  isPraxisPluginEntry,
  readValidatedOpencodeJson,
  isPraxisManagedRuleFile,
  copyManagedRuleFile,
  writeFileAtomic,
  scanTomlLines,
  hasPraxisCodexToml,
  hasPraxisOpencodeConfigText,
  hasPraxisPiSettingsText,
  stripPraxisCodexToml,
  copyOrLink,
  copyPraxisSkillsToDir,
  copyPraxisHooksToDir,
  copyPraxisRulesToDir,
  copyPluginFiles,
  removePathSafe,
  removePraxisSkillsFromDir,
  removePraxisHooksFromDir,
  removePraxisRulesFromDir,
  cleanEmptyDirectory,
} from './shared.js';

export {
  PACKAGE_ROOT,
  PLUGIN_ITEMS_TO_COPY,
  DEFAULT_PRAXIS_SKILL_NAMES,
  derivePraxisSkillNames,
  PRAXIS_SKILL_NAMES,
  PRAXIS_HOOK_FILES,
  PRAXIS_RULE_FILES,
  HOST_ADAPTERS,
  getHostAdapter,
  checkBinaryAvailable,
  resolveBinaryAvailable,
  isHomeDirectory,
  normalizeScope,
  normalizeMethod,
  validateRef,
  supportsRef,
  resolveTargetPath,
  pathExistsLstat,
  readFileSafe,
  isPraxisPluginEntry,
  readValidatedOpencodeJson,
  isPraxisManagedRuleFile,
  copyManagedRuleFile,
  writeFileAtomic,
  scanTomlLines,
  hasPraxisCodexToml,
  hasPraxisOpencodeConfigText,
  hasPraxisPiSettingsText,
  stripPraxisCodexToml,
  copyOrLink,
  copyPraxisSkillsToDir,
  copyPraxisHooksToDir,
  copyPraxisRulesToDir,
  copyPluginFiles,
  removePathSafe,
  removePraxisSkillsFromDir,
  removePraxisHooksFromDir,
  removePraxisRulesFromDir,
  cleanEmptyDirectory,
};

function runInstallOrUpdate(host, options = {}, { action, forceDefault, verb, pastVerb, icon }) {
  const adapter = getHostAdapter(host);
  const resolvedHost = host && typeof host === 'object' ? host : HOSTS[adapter.id];
  const rootDir = options.rootDir || process.cwd();
  const homeDir = options.homeDir || os.homedir();
  const scope = normalizeScope(options.scope, rootDir);
  const method = normalizeMethod(options.method);
  const ref = validateRef(options.ref);
  const dryRun = Boolean(options.dryRun);
  const force = action === 'update' ? true : Boolean(forceDefault);
  const praxisSrc = options.praxisSrc || PACKAGE_ROOT;

  console.log(`\n${icon} ${verb} Praxis for ${resolvedHost.displayName} [scope: ${scope}]...`);

  const binaryAvailable = resolveBinaryAvailable(resolvedHost, {
    method,
    binaryAvailable: options.binaryAvailable,
    checkBinary: options.checkBinary,
  });

  if (ref !== null && !supportsRef(resolvedHost, action, scope, method, { binaryAvailable })) {
    console.error(
      `  [error] --ref is not supported for ${resolvedHost.displayName} (${action}, scope: ${scope}, method: ${method}).`,
    );
    return false;
  }

  const nativeBuilder = action === 'update' ? resolvedHost.nativeUpdateCmd : resolvedHost.nativeInstallCmd;
  const nativeSteps = typeof nativeBuilder === 'function' ? nativeBuilder(ref, scope) : null;

  if (method === 'native') {
    if (!nativeSteps || !binaryAvailable) {
      console.error(`  [error] Native ${action} is not available for ${resolvedHost.displayName} [scope: ${scope}].`);
      return false;
    }
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir }, formatCommandStep);
    if (ok && !dryRun) {
      console.log(`  [success] Successfully ${pastVerb} via ${resolvedHost.cliBinary} CLI.`);
    }
    return ok;
  }

  const useNative = method === 'auto' && binaryAvailable && Boolean(nativeSteps);
  if (useNative) {
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir }, formatCommandStep);
    if (ok) {
      if (!dryRun) {
        console.log(`  [success] Successfully ${pastVerb} via ${resolvedHost.cliBinary} CLI.`);
      }
      return true;
    }
    if (ref !== null) {
      console.error(
        `  [error] Native ${action} with --ref failed for ${resolvedHost.displayName}; refusing file-copy fallback.`,
      );
      return false;
    }
    console.warn(
      action === 'update'
        ? `  [warning] CLI update failed. Re-installing files.`
        : `  [warning] Falling back to direct file installation.`,
    );
  }

  try {
    const destPath = resolveTargetPath(resolvedHost, scope, rootDir, homeDir);
    return Boolean(
      adapter.installFiles({
        host: resolvedHost,
        scope,
        method,
        ref,
        dryRun,
        force,
        rootDir,
        homeDir,
        praxisSrc,
        destPath,
      }),
    );
  } catch (err) {
    console.error(`  [error] ${err.message}`);
    return false;
  }
}

export function installHost(host, options = {}) {
  return runInstallOrUpdate(host, options, {
    action: 'install',
    forceDefault: options.force,
    verb: 'Installing',
    pastVerb: 'installed',
    icon: '📦',
  });
}

export function updateHost(host, options = {}) {
  return runInstallOrUpdate(host, options, {
    action: 'update',
    forceDefault: true,
    verb: 'Updating',
    pastVerb: 'updated',
    icon: '🔄',
  });
}

export function uninstallHost(host, options = {}) {
  const adapter = getHostAdapter(host);
  const resolvedHost = host && typeof host === 'object' ? host : HOSTS[adapter.id];
  const rootDir = options.rootDir || process.cwd();
  const homeDir = options.homeDir || os.homedir();
  const scope = normalizeScope(options.scope, rootDir);
  const method = normalizeMethod(options.method);
  const ref = validateRef(options.ref);
  const dryRun = Boolean(options.dryRun);
  const force = Boolean(options.force);

  console.log(`\n🗑️  Uninstalling Praxis from ${resolvedHost.displayName} [scope: ${scope}]...`);

  if (ref !== null) {
    console.error(`  [error] --ref is not supported for uninstall.`);
    return false;
  }

  const binaryAvailable = resolveBinaryAvailable(resolvedHost, {
    method,
    binaryAvailable: options.binaryAvailable,
    checkBinary: options.checkBinary,
  });

  const nativeSteps = typeof resolvedHost.nativeUninstallCmd === 'function' ? resolvedHost.nativeUninstallCmd(scope) : null;

  if (method === 'native') {
    if (!nativeSteps || !binaryAvailable) {
      console.error(`  [error] Native uninstall is not available for ${resolvedHost.displayName} [scope: ${scope}].`);
      return false;
    }
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir }, formatCommandStep);
    if (ok && !dryRun) {
      console.log(`  [success] Successfully uninstalled via ${resolvedHost.cliBinary} CLI.`);
    }
    return ok;
  }

  const useNative = method === 'auto' && binaryAvailable && Boolean(nativeSteps);
  if (useNative) {
    const ok = runCommandSteps(nativeSteps, { dryRun, rootDir }, formatCommandStep);
    if (!adapter.alwaysRunFileUninstall) {
      if (ok) {
        if (!dryRun) {
          console.log(`  [success] Successfully uninstalled via ${resolvedHost.cliBinary} CLI.`);
        }
        return true;
      }
      console.warn(`  [warning] Removing files manually.`);
    } else if (ok && !dryRun) {
      console.log(`  [success] Successfully uninstalled via ${resolvedHost.cliBinary} CLI.`);
    }
  }

  try {
    const destPath = resolveTargetPath(resolvedHost, scope, rootDir, homeDir);
    return Boolean(
      adapter.uninstallFiles({
        host: resolvedHost,
        scope,
        method,
        ref,
        dryRun,
        force,
        rootDir,
        homeDir,
        destPath,
      }),
    );
  } catch (err) {
    console.error(`  [error] ${err.message}`);
    return false;
  }
}

export function getHostStatus(host, rootDir = process.cwd(), options = {}) {
  const adapter = getHostAdapter(host);
  const resolvedHost = host && typeof host === 'object' ? host : HOSTS[adapter.id];
  const homeDir = options.homeDir || os.homedir();
  const isHome = isHomeDirectory(rootDir, homeDir);
  const binaryAvailable = resolveBinaryAvailable(resolvedHost, options);

  const raw = adapter.getStatus({
    host: resolvedHost,
    rootDir,
    homeDir,
    isHome,
    readFileSafe,
  });

  const projectInstalled = isHome ? false : Boolean(raw?.projectInstalled);
  const localInstalled = isHome ? false : Boolean(raw?.localInstalled);

  return {
    id: resolvedHost.id,
    displayName: resolvedHost.displayName,
    cliBinary: resolvedHost.cliBinary,
    binaryAvailable,
    isHome,
    localInstalled,
    projectInstalled,
    userInstalled: Boolean(raw?.userInstalled),
    localPath: isHome ? null : resolveTargetPath(resolvedHost, 'local', rootDir, homeDir),
    projectPath: isHome ? null : resolveTargetPath(resolvedHost, 'project', rootDir, homeDir),
    userPath: resolveTargetPath(resolvedHost, 'user', rootDir, homeDir),
  };
}
