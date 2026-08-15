import path from 'node:path';
import os from 'node:os';

const homeDir = os.homedir();

export const HOSTS = {
  claude: {
    id: 'claude',
    aliases: ['claudecode'],
    displayName: 'Claude Code',
    cliBinary: 'claude',
    defaultScope: 'project',
    localTarget: '.claude/plugins/praxis',
    projectTarget: '.claude/plugins/praxis',
    userTarget: path.join(homeDir, '.claude', 'plugins', 'praxis'),
    nativeInstallCmd: (ref, scope) => {
      const pkg = ref ? `praxis@${ref}` : 'praxis';
      return scope === 'user' ? `claude plugins install ${pkg}` : `claude plugins install ${pkg} --scope project`;
    },
    nativeUninstallCmd: () => 'claude plugins uninstall praxis',
    nativeUpdateCmd: () => 'claude plugins update praxis',
  },
  codex: {
    id: 'codex',
    aliases: [],
    displayName: 'Codex CLI / App',
    cliBinary: 'codex',
    defaultScope: 'project',
    localTarget: '.codex/plugins/praxis',
    projectTarget: '.codex/plugins/praxis',
    userTarget: path.join(homeDir, '.codex', 'plugins', 'praxis'),
    userAltTargets: [
      path.join(homeDir, '.codex', '.tmp', 'marketplaces', 'praxis-marketplace'),
      path.join(homeDir, '.codex', 'plugins', 'cache', 'praxis-marketplace'),
    ],
    nativeInstallCmd: () => 'codex plugin marketplace add ouonet/praxis && codex plugin add praxis@praxis-marketplace',
    nativeUninstallCmd: () => 'codex plugin remove praxis@praxis-marketplace && codex plugin marketplace remove praxis-marketplace',
    nativeUpdateCmd: () => 'codex plugin marketplace upgrade praxis-marketplace && codex plugin add praxis@praxis-marketplace',
  },
  opencode: {
    id: 'opencode',
    aliases: [],
    displayName: 'OpenCode',
    cliBinary: 'opencode',
    defaultScope: 'project',
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
    defaultScope: 'project',
    localTarget: '.copilot/plugins/praxis',
    projectTarget: '.copilot/plugins/praxis',
    userTarget: path.join(homeDir, '.copilot-cli', 'plugins', 'praxis'),
    nativeInstallCmd: () => 'copilot plugin install ouonet/praxis',
    nativeUninstallCmd: () => 'copilot plugin remove praxis',
    nativeUpdateCmd: () => 'copilot plugin update praxis',
  },
  antigravity: {
    id: 'antigravity',
    aliases: ['agy', 'antigravity-ide'],
    displayName: 'Antigravity CLI / AGY',
    cliBinary: 'agy',
    defaultScope: 'project',
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
    defaultScope: 'project',
    localTarget: '.pi/skills',
    projectTarget: '.pi/skills',
    userTarget: path.join(homeDir, '.pi', 'plugins', 'praxis'),
    userAltTargets: [
      path.join(homeDir, '.pi', 'agent', 'skills', 'using-praxis'),
      path.join(homeDir, '.pi', 'skills', 'using-praxis'),
    ],
    nativeInstallCmd: (ref, scope) => {
      const pkg = ref ? `git:github.com/ouonet/praxis@${ref}` : 'git:github.com/ouonet/praxis';
      if (scope === 'local') return `pi install -l ${pkg}`;
      if (scope === 'project') return `pi install -p ${pkg}`;
      return `pi install ${pkg}`;
    },
    nativeUninstallCmd: () => 'pi remove git:github.com/ouonet/praxis',
    nativeUpdateCmd: () => 'pi update git:github.com/ouonet/praxis',
  },
  omp: {
    id: 'omp',
    aliases: ['oh-my-pi', 'ohmypi'],
    displayName: 'Oh My Pi (omp)',
    cliBinary: 'omp',
    defaultScope: 'project',
    localTarget: '.omp/skills',
    projectTarget: '.omp/skills',
    userTarget: path.join(homeDir, '.omp', 'plugins', 'node_modules', 'praxis'),
    userAltTargets: [
      path.join(homeDir, '.omp', 'plugins'),
      path.join(homeDir, '.omp', 'skills', 'using-praxis'),
    ],
    nativeInstallCmd: (ref, scope) => {
      const pkg = ref ? `https://github.com/ouonet/praxis#${ref}` : 'https://github.com/ouonet/praxis';
      if (scope === 'local') return `omp plugin install ${pkg} -l`;
      if (scope === 'project') return `omp plugin install ${pkg} --scope=project`;
      return `omp plugin install ${pkg}`;
    },
    nativeUninstallCmd: () => 'omp plugin uninstall praxis',
    nativeUpdateCmd: () => 'omp plugin upgrade praxis',
  },
  qoder: {
    id: 'qoder',
    aliases: ['qodercli', 'qoderclicn', 'qodercn'],
    displayName: 'Qoder CLI CN',
    cliBinary: ['qoderclicn', 'qodercli', 'qoder'],
    defaultScope: 'project',
    localTarget: '.qoder-plugin',
    projectTarget: '.qoder-plugin',
    userTarget: path.join(homeDir, '.qoder-cn', 'plugins', 'praxis'),
    userAltTargets: [path.join(homeDir, '.qoder-cn', 'praxis'), path.join(homeDir, '.qoder', 'plugins', 'praxis')],
    nativeInstallCmd: null,
    nativeUninstallCmd: null,
    nativeUpdateCmd: null,
  },
  agents: {
    id: 'agents',
    aliases: ['generic'],
    displayName: 'Generic Agent (.agents)',
    cliBinary: null,
    defaultScope: 'project',
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
