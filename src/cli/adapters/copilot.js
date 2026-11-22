import { HOSTS } from '../hosts.js';
import {
  genericPluginInstall,
  genericPluginUninstall,
  pathExistsLstat,
  resolveStatusCtx,
  resolveTargetPath,
} from '../shared.js';

export default {
  id: 'copilot',
  alwaysRunFileUninstall: false,

  installFiles(ctx) {
    return genericPluginInstall(HOSTS.copilot, ctx);
  },

  uninstallFiles(ctx) {
    return genericPluginUninstall(HOSTS.copilot, ctx);
  },

  getStatus(rawStatusCtx) {
    const { host, rootDir, homeDir, isHome } = resolveStatusCtx(HOSTS.copilot, rawStatusCtx);
    const userInstalled = pathExistsLstat(resolveTargetPath(host, 'user', rootDir, homeDir));
    const projectInstalled = !isHome && pathExistsLstat(resolveTargetPath(host, 'project', rootDir, homeDir));
    const localInstalled = !isHome && pathExistsLstat(resolveTargetPath(host, 'local', rootDir, homeDir));
    return { userInstalled, projectInstalled, localInstalled };
  },
};
