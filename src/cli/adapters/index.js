import { resolveHost } from '../hosts.js';
import claude from './claude.js';
import codex from './codex.js';
import opencode from './opencode.js';
import copilot from './copilot.js';
import antigravity from './antigravity.js';
import pi from './pi.js';
import omp from './omp.js';
import qoder from './qoder.js';
import grok from './grok.js';
import agents from './agents.js';

export const HOST_ADAPTERS = Object.freeze({
  claude,
  codex,
  opencode,
  copilot,
  antigravity,
  pi,
  omp,
  qoder,
  grok,
  agents,
});

export function getHostAdapter(hostOrId) {
  const rawId = hostOrId && typeof hostOrId === 'object' ? hostOrId.id : hostOrId;
  if (typeof rawId !== 'string' || !rawId.trim()) {
    throw new Error(`Unknown or missing host adapter: ${String(hostOrId)}`);
  }
  const resolved = resolveHost(rawId);
  const id = resolved ? resolved.id : rawId.trim().toLowerCase();
  const adapter = Object.hasOwn(HOST_ADAPTERS, id) ? HOST_ADAPTERS[id] : null;
  if (!adapter) {
    throw new Error(`Unknown or missing host adapter: ${rawId}`);
  }
  return adapter;
}
