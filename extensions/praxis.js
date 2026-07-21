import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = path.resolve(__dirname, '../skills/using-praxis/SKILL.md');
const BOOTSTRAP_MARKER = 'praxis.using-praxis.injected.v1';

let cachedBootstrap;

const stripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return match ? match[2] : content;
};

const loadBootstrap = () => {
  if (cachedBootstrap !== undefined) return cachedBootstrap;
  if (!fs.existsSync(SKILL_PATH)) {
    cachedBootstrap = null;
    return cachedBootstrap;
  }

  const content = stripFrontmatter(fs.readFileSync(SKILL_PATH, 'utf8')).trim();

  cachedBootstrap = `**Praxis bootstrap**

${content}

**Pi note**
- This bootstrap is injected once per session by a pi extension.
- There is no separate Skill tool in pi; load skills by reading skills/<name>/SKILL.md with the native read tool when needed.
- Keep the normal Praxis triage flow and skill discipline unchanged.
`;

  return cachedBootstrap;
};

const hasMarker = (entries) =>
  Array.isArray(entries) && entries.some((entry) => entry?.type === 'custom' && entry?.customType === BOOTSTRAP_MARKER);

export default function (pi) {
  pi.on('before_agent_start', async (_event, ctx) => {
    const bootstrap = loadBootstrap();
    if (!bootstrap) return;

    const entries = ctx.sessionManager?.getEntries?.() ?? [];
    if (hasMarker(entries)) return;

    pi.appendEntry(BOOTSTRAP_MARKER, {
      version: 1,
      source: 'using-praxis',
      path: 'skills/using-praxis/SKILL.md',
    });

    return {
      message: {
        customType: BOOTSTRAP_MARKER,
        content: bootstrap,
        display: false,
      },
    };
  });
}
