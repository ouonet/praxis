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
  praxis <command> [options]
  npx praxis <command> [options]

COMMANDS:
  install, i       Install Praxis for specified host(s)
  uninstall, rm    Uninstall Praxis from specified host(s)
  update, upgrade  Update Praxis installation for host(s)
  status, list, ls View installation status across all AI agent hosts
  help             Show this help message
  version          Show Praxis CLI version

OPTIONS:
  --host, -H <name>     Target host: codex, claude, opencode, copilot, antigravity, gemini, pi, qoder, agents, all
  --scope, -s <scope>   Target scope: project (default) or user
  --ref, -r <git-ref>   Git branch, tag, or commit to install/pin
  --method, -m <mode>   Installation method: auto (default), native, link, copy
  --dry-run             Simulate actions without writing files or running commands
  --force, -f           Overwrite existing configs or files

EXAMPLES:
  $ praxis install --host codex --scope project
  $ praxis install --host claude --scope user
  $ npx praxis install --host all
  $ praxis status
  $ praxis update --host pi
  $ praxis uninstall --host opencode --scope project
`);
}

export async function runCli(args = process.argv.slice(2), { rootDir = process.cwd() } = {}) {
  const options = parseArgs(args);

  if (options.version) {
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
    console.log(`${'Host'.padEnd(22)} ${'CLI Available'.padEnd(15)} ${'Project Scope'.padEnd(15)} ${'User Scope'.padEnd(15)}`);
    console.log('-'.repeat(68));

    for (const host of Object.values(HOSTS)) {
      const status = getHostStatus(host, rootDir);
      const cliStr = status.binaryAvailable ? '✅ Yes' : '❌ No';
      const projStr = status.projectInstalled ? '✅ Installed' : '⚪ Not installed';
      const userStr = status.userInstalled ? '✅ Installed' : '⚪ Not installed';
      console.log(`${host.displayName.padEnd(22)} ${cliStr.padEnd(15)} ${projStr.padEnd(15)} ${userStr.padEnd(15)}`);
    }
    console.log('\nUse "praxis install --host <host>" to install to a specific platform.\n');
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

  console.error(`❌ Unknown command: "${options.command}". Run "praxis help" for usage.`);
  return 1;
}
