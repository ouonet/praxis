import fs from 'node:fs';
import path from 'node:path';
import { HOSTS, resolveHost } from './hosts.js';
import {
  installHost,
  uninstallHost,
  updateHost,
  getHostStatus,
  normalizeScope,
  normalizeMethod,
  validateRef,
  supportsRef,
  resolveBinaryAvailable,
} from './installer.js';

function getVersion() {
  try {
    const pkgPath = path.resolve(import.meta.dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

export function parseArgs(args = []) {
  const options = {
    command: null,
    host: null,
    scope: null,
    ref: null,
    method: null,
    dryRun: false,
    force: false,
    help: false,
    version: false,
  };
  const errors = [];

  const valueFlags = new Map([
    ['--host', 'host'],
    ['-H', 'host'],
    ['--scope', 'scope'],
    ['-s', 'scope'],
    ['--ref', 'ref'],
    ['-r', 'ref'],
    ['--method', 'method'],
    ['-m', 'method'],
  ]);

  const longValueFlags = new Map([
    ['--host=', 'host'],
    ['--scope=', 'scope'],
    ['--ref=', 'ref'],
    ['--method=', 'method'],
  ]);

  let i = 0;
  while (i < args.length) {
    const arg = String(args[i]);
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (valueFlags.has(arg)) {
      const key = valueFlags.get(arg);
      const next = i + 1 < args.length ? String(args[i + 1]) : undefined;
      if (next === undefined || next === '' || next.startsWith('-')) {
        errors.push(`Missing value for ${arg}`);
      } else {
        options[key] = next;
        i++;
      }
    } else if ([...longValueFlags.keys()].some((prefix) => arg.startsWith(prefix))) {
      const prefix = [...longValueFlags.keys()].find((p) => arg.startsWith(p));
      const key = longValueFlags.get(prefix);
      const val = arg.slice(arg.indexOf('=') + 1);
      if (!val) {
        errors.push(`Missing value for ${prefix.slice(0, -1)}`);
      } else {
        options[key] = val;
      }
    } else if (arg.startsWith('-')) {
      errors.push(`Unknown option: ${arg}`);
    } else if (!options.command) {
      options.command = arg;
    } else {
      errors.push(`Unexpected argument: ${arg}`);
    }
    i++;
  }

  return { options, errors };
}

function printHelp() {
  console.log(`
Praxis CLI v${getVersion()} - Multi-host discipline framework installer

USAGE:
  npx @ouonet/praxis <command> [options]
  praxis <command> [options]

COMMANDS:
  install, i       Install Praxis for specified host(s)
  uninstall, rm    Uninstall Praxis from specified host(s)
  update, upgrade  Update Praxis installation for host(s)
  status, list, ls View installation status across all AI agent hosts
  help             Show this help message
  version          Show Praxis CLI version

OPTIONS:
  --host, -H <name>     Target host: grok, codex, claude, opencode, copilot, antigravity (agy), pi, omp, qoder, agents, all
  --scope, -s <scope>   Target scope: user/global (default), project, or local
  --ref, -r <git-ref>   Git branch, tag, or commit to install/pin
  --method, -m <mode>   Installation method: auto (default), native, link, copy
  --dry-run             Simulate actions without writing files or running commands
  --force, -f           Overwrite existing configs or files

EXAMPLES:
  $ npx @ouonet/praxis install --host all
  $ npx @ouonet/praxis install --host claude --scope user
  $ npx @ouonet/praxis install --host opencode --scope project
  $ npx @ouonet/praxis install --host codex --scope local
  $ npx @ouonet/praxis status
  $ npx @ouonet/praxis update --host pi
  $ npx @ouonet/praxis uninstall --host opencode --scope project
`);
}

export function getStringWidth(str) {
  if (!str) return 0;
  const clean = str.replace(/\x1b\[[0-9;]*m/g, '');
  let width = 0;
  for (const char of clean) {
    const code = char.codePointAt(0);
    if (code === 0xfe0f || code === 0xfe0e || code === 0x200d) continue;
    if (
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2329 && code <= 0x232a) ||
      (code >= 0x2e80 && code <= 0x303e) ||
      (code >= 0x3040 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x1f000 && code <= 0x1ffff) ||
      (code >= 0x2600 && code <= 0x27bf)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

export function padEndVisual(str, targetWidth, padChar = ' ') {
  const currentWidth = getStringWidth(str);
  if (currentWidth >= targetWidth) return str;
  return str + padChar.repeat(targetWidth - currentWidth);
}

export async function runCli(args = process.argv.slice(2), { rootDir = process.cwd(), homeDir, checkBinary } = {}) {
  const { options, errors } = parseArgs(args);

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`❌ ${err}`);
    }
    return 1;
  }

  let normScope;
  let normMethod;
  let normRef;
  try {
    normScope = normalizeScope(options.scope, rootDir);
    normMethod = normalizeMethod(options.method);
    normRef = validateRef(options.ref);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    return 1;
  }

  if (options.version || (options.command && ['version', 'v'].includes(options.command.toLowerCase()))) {
    console.log(`praxis v${getVersion()}`);
    return 0;
  }

  if (options.help || !options.command || options.command.toLowerCase() === 'help') {
    printHelp();
    return 0;
  }

  const cmd = options.command.toLowerCase();

  if (['status', 'list', 'ls'].includes(cmd)) {
    console.log(`\n🔍 Praxis Host Status Check [v${getVersion()}]\n`);
    const cols = [
      ['Host', 24],
      ['CLI Available', 16],
      ['Local Scope', 18],
      ['Project Scope', 18],
      ['User Scope', 18],
    ];

    const header = cols.map(([name, w]) => padEndVisual(name, w)).join('');
    console.log(header);
    console.log('-'.repeat(cols.reduce((sum, [, w]) => sum + w, 0)));

    for (const host of Object.values(HOSTS)) {
      const status = getHostStatus(host, rootDir, { homeDir, checkBinary });
      const isHome = status.isHome;
      const cliStr = status.binaryAvailable ? '✅ Yes' : '❌ No';
      const localStr = isHome ? '⚪ N/A (Home)' : (status.localInstalled ? '✅ Installed' : '⚪ Not installed');
      const projStr = isHome ? '⚪ N/A (Home)' : (status.projectInstalled ? '✅ Installed' : '⚪ Not installed');
      const userStr = status.userInstalled ? '✅ Installed' : '⚪ Not installed';
      const row = [host.displayName, cliStr, localStr, projStr, userStr];
      console.log(row.map((val, idx) => padEndVisual(val, cols[idx][1])).join(''));
    }
    console.log('\nUse "npx @ouonet/praxis install --host <host>" to install to a specific platform.\n');
    return 0;
  }

  const isInstall = ['install', 'i'].includes(cmd);
  const isUninstall = ['uninstall', 'remove', 'rm'].includes(cmd);
  const isUpdate = ['update', 'upgrade'].includes(cmd);

  if (!isInstall && !isUninstall && !isUpdate) {
    console.error(`❌ Unknown command: "${options.command}". Run "npx @ouonet/praxis help" for usage.`);
    return 1;
  }

  // Resolve target hosts
  let targetHosts = [];
  if (!options.host || options.host.toLowerCase() === 'all') {
    if (isInstall) {
      targetHosts = Object.values(HOSTS).filter((h) => {
        if (h.id === 'agents') return true;
        return resolveBinaryAvailable(h, { method: normMethod, checkBinary });
      });
      if (targetHosts.length === 0) {
        targetHosts = [HOSTS.agents];
      }
    } else {
      targetHosts = Object.values(HOSTS);
    }
  } else {
    const resolved = resolveHost(options.host);
    if (!resolved) {
      console.error(`❌ Unknown host: "${options.host}". Available hosts: ${Object.keys(HOSTS).join(', ')}`);
      return 1;
    }
    targetHosts = [resolved];
  }

  const action = isInstall ? 'install' : isUninstall ? 'uninstall' : 'update';

  // Upfront --ref compatibility preflight across all target hosts before mutating any host
  if (normRef !== null) {
    for (const host of targetHosts) {
      const binaryAvailable = resolveBinaryAvailable(host, { method: normMethod, checkBinary });
      if (!supportsRef(host, action, normScope, normMethod, { binaryAvailable })) {
        console.error(
          `❌ --ref is not supported for host "${host.id}" (action: ${action}, scope: ${normScope}, method: ${normMethod}).`,
        );
        return 1;
      }
    }
  }

  const execOptions = {
    scope: normScope,
    ref: normRef,
    method: normMethod,
    dryRun: options.dryRun,
    force: options.force,
    rootDir,
    homeDir,
    checkBinary,
  };

  let allOk = true;
  for (const host of targetHosts) {
    const ok = isInstall
      ? installHost(host, execOptions)
      : isUninstall
        ? uninstallHost(host, execOptions)
        : updateHost(host, execOptions);
    if (!ok) allOk = false;
  }

  if (!allOk) {
    return 1;
  }

  console.log('\n✨ Done!');
  return 0;
}
