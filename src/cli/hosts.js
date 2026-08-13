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
    projectTarget: '.claude/plugins/praxis',
    userTarget: path.join(homeDir, '.claude', 'plugins', 'praxis'),
    nativeInstallCmd: (ref) => (ref ? `claude plugins install praxis@${ref}` : 'claude plugins install praxis'),
    nativeUninstallCmd: () => 'claude plugins uninstall praxis',
    nativeUpdateCmd: () => 'claude plugins update praxis',
  },
  codex: {
    id: 'codex',
    aliases: [],
    displayName: 'Codex CLI / App',
    cliBinary: 'codex',
    defaultScope: 'project',
    projectTarget: '.codex/plugins/praxis',
    userTarget: path.join(homeDir, '.codex', 'plugins', 'praxis'),
    nativeInstallCmd: () => 'codex plugin marketplace add ouonet/praxis',
    nativeUninstallCmd: () => 'codex plugin marketplace remove praxis',
    nativeUpdateCmd: () => 'codex plugin marketplace upgrade praxis-marketplace',
  },
  opencode: {
    id: 'opencode',
    aliases: [],
    displayName: 'OpenCode',
    cliBinary: 'opencode',
    defaultScope: 'project',
    projectTarget: '.opencode',
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
    projectTarget: '.copilot/plugins/praxis',
    userTarget: path.join(homeDir, '.copilot-cli', 'plugins', 'praxis'),
    nativeInstallCmd: () => 'copilot plugin install ouonet/praxis',
    nativeUninstallCmd: () => 'copilot plugin remove praxis',
    nativeUpdateCmd: () => 'copilot plugin update praxis',
  },
  antigravity: {
    id: 'antigravity',
    aliases: ['agy'],
    displayName: 'Antigravity CLI / AGY',
    cliBinary: 'agy',
    defaultScope: 'project',
    projectTarget: '.agents/plugins/praxis',
    userTarget: path.join(homeDir, '.gemini', 'antigravity-ide', 'plugins', 'praxis'),
    nativeInstallCmd: (ref) => (ref ? `agy plugin install https://github.com/ouonet/praxis#${ref}` : 'agy plugin install https://github.com/ouonet/praxis'),
    nativeUninstallCmd: () => 'agy plugin uninstall praxis',
    nativeUpdateCmd: () => 'agy plugin update praxis',
  },
  gemini: {
    id: 'gemini',
    aliases: [],
    displayName: 'Gemini CLI',
    cliBinary: 'gemini',
    defaultScope: 'project',
    projectTarget: '.gemini/extensions/praxis',
    userTarget: path.join(homeDir, '.gemini', 'extensions', 'praxis'),
    nativeInstallCmd: (ref) => (ref ? `gemini extensions install https://github.com/ouonet/praxis#${ref}` : 'gemini extensions install https://github.com/ouonet/praxis'),
    nativeUninstallCmd: () => 'gemini extensions uninstall praxis',
    nativeUpdateCmd: () => 'gemini extensions update praxis',
  },
  pi: {
    id: 'pi',
    aliases: [],
    displayName: 'pi CLI',
    cliBinary: 'pi',
    defaultScope: 'project',
    projectTarget: '.pi/skills',
    userTarget: path.join(homeDir, '.pi', 'plugins', 'praxis'),
    nativeInstallCmd: (ref, scope) => {
      const pkg = ref ? `git:github.com/ouonet/praxis@${ref}` : 'git:github.com/ouonet/praxis';
      return scope === 'project' ? `pi install -l ${pkg}` : `pi install ${pkg}`;
    },
    nativeUninstallCmd: () => 'pi remove git:github.com/ouonet/praxis',
    nativeUpdateCmd: () => 'pi update git:github.com/ouonet/praxis',
  },
  qoder: {
    id: 'qoder',
    aliases: [],
    displayName: 'Qoder CLI CN',
    cliBinary: 'qoder',
    defaultScope: 'project',
    projectTarget: '.qoder-plugin',
    userTarget: path.join(homeDir, '.qoder-cn', 'praxis'),
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
