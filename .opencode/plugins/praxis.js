/**
 * Praxis plugin for OpenCode.ai
 *
 * Injects praxis bootstrap context via message transform.
 * Auto-registers skills directory via config hook (no symlinks needed).
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOTSTRAP_MARKER = '<!-- praxis:using-praxis:v1 -->';

const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of frontmatterStr.split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

const resolveSkillsDir = () => {
  const candidates = [
    path.resolve(__dirname, '../skills'),
    path.resolve(__dirname, '../../skills'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'using-praxis', 'SKILL.md'))) {
      return dir;
    }
  }
  return candidates[0];
};

// Cache bootstrap content once SKILL.md is successfully read.
let _bootstrapCache;

export const PraxisPlugin = async () => {
  const getBootstrapContent = () => {
    if (_bootstrapCache !== undefined) return _bootstrapCache;

    const skillPath = path.join(resolveSkillsDir(), 'using-praxis', 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      return null;
    }

    const fullContent = fs.readFileSync(skillPath, 'utf8');
    const { content } = extractAndStripFrontmatter(fullContent);

    const toolMapping = `**Harness note (OpenCode):**
Skills use harness-neutral wording. On OpenCode:
- task tracker → \`todowrite\`
- subagents → OpenCode subagent system (@mention)
- skill loader → native \`skill\` tool (or read skills/<name>/SKILL.md)
- file/shell tools → your native tools

Use OpenCode's native \`skill\` tool to list and load skills.`;

    _bootstrapCache = `<EXTREMELY_IMPORTANT>
${BOOTSTRAP_MARKER}
You have Praxis.

**IMPORTANT: The using-praxis skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-praxis" again - that would be redundant.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;

    return _bootstrapCache;
  };

  return {
    // Register praxis skills directory so OpenCode discovers all skills
    // without requiring manual symlinks or config file edits.
    config: async (config) => {
      const activeSkillsDir = resolveSkillsDir();
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(activeSkillsDir)) {
        config.skills.paths.push(activeSkillsDir);
      }
    },

    // Inject bootstrap into the first user message of each session.
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find((m) => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;

      if (firstUser.parts.some((p) => p.type === 'text' && p.text.includes(BOOTSTRAP_MARKER))) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    },
  };
};
