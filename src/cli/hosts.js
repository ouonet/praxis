import path from 'node:path';
import os from 'node:os';

const homeDir = os.homedir();

function normBuilderScope(scope) {
  if (!scope) return 'user';
  const s = String(scope).toLowerCase().trim();
  if (s === 'global' || s === 'user') return 'user';
  if (s === 'local') return 'local';
  if (s === 'project' || s === 'workspace') return 'project';
  return s;
}

export function formatCommandStep(step) {
  return [
    step.bin,
    ...step.args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)),
  ].join(' ');
}

export const HOSTS = {
  claude: {
    id: 'claude',
    aliases: ['claudecode'],
    displayName: 'Claude Code',
    cliBinary: 'claude',
    defaultScope: 'user',
    localTarget: '.claude/plugins/praxis',
    projectTarget: '.claude/plugins/praxis',
    userTarget: path.join(homeDir, '.claude', 'plugins', 'praxis'),
    nativeInstallCmd: (ref, scope) => {
      const s = normBuilderScope(scope);
      const mkt = ref ? `ouonet/praxis#${ref}` : 'ouonet/praxis';
      const installArgs = s === 'user'
        ? ['plugins', 'install', 'praxis@praxis']
        : ['plugins', 'install', 'praxis@praxis', '--scope', s];
      return [
        { bin: 'claude', args: ['plugins', 'marketplace', 'add', mkt], allowFailure: true },
        { bin: 'claude', args: installArgs },
      ];
    },
    nativeUninstallCmd: (scope) => {
      const s = normBuilderScope(scope);
      const args = s === 'user'
        ? ['plugins', 'uninstall', 'praxis@praxis']
        : ['plugins', 'uninstall', 'praxis@praxis', '--scope', s];
      return [{ bin: 'claude', args }];
    },
    nativeUpdateCmd: (ref, scope) => {
      if (ref) return null;
      const s = normBuilderScope(scope);
      const args = s === 'user'
        ? ['plugins', 'update', 'praxis@praxis']
        : ['plugins', 'update', 'praxis@praxis', '--scope', s];
      return [{ bin: 'claude', args }];
    },
  },
  codex: {
    id: 'codex',
    aliases: [],
    displayName: 'Codex CLI / App',
    cliBinary: 'codex',
    defaultScope: 'user',
    localTarget: '.codex/plugins/praxis',
    projectTarget: '.codex/plugins/praxis',
    userTarget: path.join(homeDir, '.codex', 'plugins', 'praxis'),
    userAltTargets: [
      path.join(homeDir, '.codex', '.tmp', 'marketplaces', 'praxis-marketplace'),
      path.join(homeDir, '.codex', 'plugins', 'cache', 'praxis-marketplace'),
    ],
    nativeInstallCmd: (ref, scope) => {
      if (ref || normBuilderScope(scope) !== 'user') return null;
      return [
        { bin: 'codex', args: ['plugin', 'marketplace', 'add', 'ouonet/praxis'], allowFailure: true },
        { bin: 'codex', args: ['plugin', 'marketplace', 'upgrade', 'praxis-marketplace'], allowFailure: true },
        { bin: 'codex', args: ['plugin', 'add', 'praxis@praxis-marketplace'] },
      ];
    },
    nativeUninstallCmd: (scope) => {
      if (normBuilderScope(scope) !== 'user') return null;
      return [
        { bin: 'codex', args: ['plugin', 'remove', 'praxis@praxis-marketplace'], allowFailure: true },
        { bin: 'codex', args: ['plugin', 'marketplace', 'remove', 'praxis-marketplace'], allowFailure: true },
      ];
    },
    nativeUpdateCmd: (ref, scope) => {
      if (ref || normBuilderScope(scope) !== 'user') return null;
      return [
        { bin: 'codex', args: ['plugin', 'marketplace', 'upgrade', 'praxis-marketplace'], allowFailure: true },
        { bin: 'codex', args: ['plugin', 'add', 'praxis@praxis-marketplace'] },
      ];
    },
  },
  opencode: {
    id: 'opencode',
    aliases: [],
    displayName: 'OpenCode',
    cliBinary: 'opencode',
    defaultScope: 'user',
    localTarget: '.opencode',
    projectTarget: 'opencode.json',
    userTarget: path.join(homeDir, '.config', 'opencode'),
    nativeInstallCmd: null,
    nativeUninstallCmd: null,
    nativeUpdateCmd: null,
  },
  copilot: {
    id: 'copilot',
    aliases: ['github-copilot'],
    displayName: 'GitHub Copilot CLI',
    cliBinary: 'copilot',
    defaultScope: 'user',
    localTarget: '.copilot/plugins/praxis',
    projectTarget: '.copilot/plugins/praxis',
    userTarget: path.join(homeDir, '.copilot-cli', 'plugins', 'praxis'),
    nativeInstallCmd: (ref, scope) => {
      if (ref || normBuilderScope(scope) !== 'user') return null;
      return [{ bin: 'copilot', args: ['plugin', 'install', 'ouonet/praxis'] }];
    },
    nativeUninstallCmd: (scope) => {
      if (normBuilderScope(scope) !== 'user') return null;
      return [{ bin: 'copilot', args: ['plugin', 'remove', 'praxis'] }];
    },
    nativeUpdateCmd: (ref, scope) => {
      if (ref || normBuilderScope(scope) !== 'user') return null;
      return [{ bin: 'copilot', args: ['plugin', 'update', 'praxis'] }];
    },
  },
  antigravity: {
    id: 'antigravity',
    aliases: ['agy', 'antigravity-ide'],
    displayName: 'Antigravity CLI / AGY',
    cliBinary: 'agy',
    defaultScope: 'user',
    localTarget: '.agents/plugins/praxis',
    projectTarget: '.agents',
    userTarget: path.join(homeDir, '.gemini', 'config', 'plugins', 'praxis'),
    userAltTargets: [
      path.join(homeDir, '.gemini', 'antigravity-ide', 'plugins', 'praxis'),
      path.join(homeDir, '.gemini', 'config', 'skills', 'using-praxis'),
    ],
    nativeInstallCmd: null,
    nativeUninstallCmd: null,
    nativeUpdateCmd: null,
  },
  pi: {
    id: 'pi',
    aliases: [],
    displayName: 'pi CLI',
    cliBinary: 'pi',
    defaultScope: 'user',
    localTarget: '.pi/skills',
    projectTarget: '.pi/skills',
    userTarget: path.join(homeDir, '.pi', 'plugins', 'praxis'),
    userAltTargets: [
      path.join(homeDir, '.pi', 'agent', 'skills', 'using-praxis'),
      path.join(homeDir, '.pi', 'skills', 'using-praxis'),
    ],
    nativeInstallCmd: (ref, scope) => {
      const s = normBuilderScope(scope);
      const pkg = ref ? `git:github.com/ouonet/praxis@${ref}` : 'git:github.com/ouonet/praxis';
      const scopeFlags = s === 'local' ? ['-l'] : s === 'project' ? ['-p'] : [];
      return [{ bin: 'pi', args: ['install', ...scopeFlags, pkg] }];
    },
    nativeUninstallCmd: (scope) => {
      if (normBuilderScope(scope) !== 'user') return null;
      return [{ bin: 'pi', args: ['remove', 'git:github.com/ouonet/praxis'] }];
    },
    nativeUpdateCmd: (ref, scope) => {
      const s = normBuilderScope(scope);
      const pkg = ref ? `git:github.com/ouonet/praxis@${ref}` : 'git:github.com/ouonet/praxis';
      const scopeFlags = s === 'local' ? ['-l'] : s === 'project' ? ['-p'] : [];
      return [{ bin: 'pi', args: ['install', ...scopeFlags, pkg] }];
    },
  },
  omp: {
    id: 'omp',
    aliases: ['oh-my-pi', 'ohmypi'],
    displayName: 'Oh My Pi (omp)',
    cliBinary: 'omp',
    defaultScope: 'user',
    localTarget: '.omp/skills',
    projectTarget: '.omp/skills',
    userTarget: path.join(homeDir, '.omp', 'plugins', 'node_modules', 'praxis'),
    userAltTargets: [
      path.join(homeDir, '.omp', 'plugins', 'node_modules', '@ouonet', 'praxis'),
      path.join(homeDir, '.omp', 'plugins', 'praxis'),
      path.join(homeDir, '.omp', 'skills', 'using-praxis'),
    ],
    nativeInstallCmd: (ref, scope) => {
      const s = normBuilderScope(scope);
      const pkg = ref ? `https://github.com/ouonet/praxis#${ref}` : 'https://github.com/ouonet/praxis';
      const scopeFlags = s === 'local' ? ['-l'] : s === 'project' ? ['--scope=project'] : [];
      return [{ bin: 'omp', args: ['plugin', 'install', pkg, ...scopeFlags] }];
    },
    nativeUninstallCmd: (scope) => {
      if (normBuilderScope(scope) !== 'user') return null;
      return [{ bin: 'omp', args: ['plugin', 'uninstall', '@ouonet/praxis'] }];
    },
    nativeUpdateCmd: (ref, scope) => {
      const s = normBuilderScope(scope);
      const pkg = ref ? `https://github.com/ouonet/praxis#${ref}` : 'https://github.com/ouonet/praxis';
      const scopeFlags = s === 'local' ? ['-l'] : s === 'project' ? ['--scope=project'] : [];
      return [{ bin: 'omp', args: ['plugin', 'install', pkg, ...scopeFlags] }];
    },
  },
  qoder: {
    id: 'qoder',
    aliases: ['qodercli', 'qoderclicn', 'qodercn'],
    displayName: 'Qoder CLI CN',
    cliBinary: ['qoderclicn', 'qodercli', 'qoder'],
    defaultScope: 'user',
    localTarget: '.qoder-plugin',
    projectTarget: '.qoder-plugin',
    userTarget: path.join(homeDir, '.qoder-cn', 'plugins', 'praxis'),
    userAltTargets: [path.join(homeDir, '.qoder-cn', 'praxis'), path.join(homeDir, '.qoder', 'plugins', 'praxis')],
    nativeInstallCmd: null,
    nativeUninstallCmd: null,
    nativeUpdateCmd: null,
  },
  grok: {
    id: 'grok',
    aliases: ['grok-cli', 'xai-grok'],
    displayName: 'Grok CLI',
    cliBinary: 'grok',
    defaultScope: 'user',
    localTarget: '.grok/plugins/praxis',
    projectTarget: '.grok/plugins/praxis',
    userTarget: path.join(homeDir, '.grok', 'plugins', 'praxis'),
    userAltTargets: [
      path.join(homeDir, '.grok', 'rules', 'praxis.md'),
      path.join(homeDir, '.grok', 'skills', 'using-praxis'),
    ],
    nativeInstallCmd: null,
    nativeUninstallCmd: null,
    nativeUpdateCmd: null,
  },
  agents: {
    id: 'agents',
    aliases: ['generic'],
    displayName: 'Generic Agent (.agents)',
    cliBinary: null,
    defaultScope: 'user',
    localTarget: '.agents',
    projectTarget: '.agents',
    userTarget: path.join(homeDir, '.agents'),
    nativeInstallCmd: null,
    nativeUninstallCmd: null,
    nativeUpdateCmd: null,
  },
};

export function resolveHost(input) {
  if (!input) return null;
  const lower = input.trim().toLowerCase();
  for (const [key, host] of Object.entries(HOSTS)) {
    if (key === lower || host.aliases.includes(lower)) {
      return host;
    }
  }
  return null;
}
