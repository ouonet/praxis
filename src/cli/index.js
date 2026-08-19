import fs from 'node:fs';
import path from 'node:path';
import { HOSTS, resolveHost } from './hosts.js';
import { installHost, uninstallHost, updateHost, getHostStatus } from './installer.js';

function getVersion() {
  try {
    const pkgPath = path.resolve(import.meta.dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

function parseArgs(args) {
  const parsed = {
    command: null,
    host: null,
    scope: null,
    ref: null,
    method: 'auto',
    dryRun: false,
    force: false,
    help: false,
    version: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--version' || arg === '-v') {
      parsed.version = true;
    } else if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      parsed.force = true;
    } else if (arg === '--host' || arg === '-H') {
      parsed.host = args[++i];
    } else if (arg.startsWith('--host=')) {
      parsed.host = arg.split('=')[1];
    } else if (arg === '--scope' || arg === '-s') {
      parsed.scope = args[++i];
    } else if (arg.startsWith('--scope=')) {
      parsed.scope = arg.split('=')[1];
    } else if (arg === '--ref' || arg === '-r') {
      parsed.ref = args[++i];
    } else if (arg.startsWith('--ref=')) {
      parsed.ref = arg.split('=')[1];
    } else if (arg === '--method' || arg === '-m') {
      parsed.method = args[++i];
    } else if (arg.startsWith('--method=')) {
      parsed.method = arg.split('=')[1];
    } else if (!parsed.command && !arg.startsWith('-')) {
      parsed.command = arg;
    }
    i++;
  }

  return parsed;
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
    if (code === 0xFE0F || code === 0xFE0E || code === 0x200D) continue;
    if (
      (code >= 0x1100 && code <= 0x115F) ||
      (code >= 0x2329 && code <= 0x232A) ||
      (code >= 0x2E80 && code <= 0x303E) ||
      (code >= 0x3040 && code <= 0xA4CF) ||
      (code >= 0xAC00 && code <= 0xD7A3) ||
      (code >= 0xF900 && code <= 0xFAFF) ||
      (code >= 0xFE10 && code <= 0xFE19) ||
      (code >= 0xFE30 && code <= 0xFE6F) ||
      (code >= 0xFF00 && code <= 0xFF60) ||
      (code >= 0xFFE0 && code <= 0xFFE6) ||
      (code >= 0x1F000 && code <= 0x1FFFF) ||
      (code >= 0x2600 && code <= 0x27BF)
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

export async function runCli(args = process.argv.slice(2), { rootDir = process.cwd() } = {}) {
  const options = parseArgs(args);

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
      const status = getHostStatus(host, rootDir);
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

  // Resolve target hosts
  let targetHosts = [];
  if (!options.host || options.host.toLowerCase() === 'all') {
    if (cmd === 'install') {
      // Find hosts with available CLIs or include agents
      targetHosts = Object.values(HOSTS).filter((h) => {
        if (h.id === 'agents') return true;
        const status = getHostStatus(h, rootDir);
        return status.binaryAvailable;
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

  const execOptions = {
    scope: options.scope,
    ref: options.ref,
    method: options.method,
    dryRun: options.dryRun,
    force: options.force,
    rootDir,
  };

  if (['install', 'i'].includes(cmd)) {
    for (const host of targetHosts) {
      installHost(host, execOptions);
    }
    console.log('\n✨ Done!');
    return 0;
  }

  if (['uninstall', 'remove', 'rm'].includes(cmd)) {
    for (const host of targetHosts) {
      uninstallHost(host, execOptions);
    }
    console.log('\n✨ Done!');
    return 0;
  }

  if (['update', 'upgrade'].includes(cmd)) {
    for (const host of targetHosts) {
      updateHost(host, execOptions);
    }
    console.log('\n✨ Done!');
    return 0;
  }

  console.error(`❌ Unknown command: "${options.command}". Run "npx @ouonet/praxis help" for usage.`);
  return 1;
}
