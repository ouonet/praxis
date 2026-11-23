import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTS } from '../src/cli/hosts.js';
import * as installer from '../src/cli/installer.js';

const {
  PLUGIN_ITEMS_TO_COPY,
  PRAXIS_SKILL_NAMES,
  DEFAULT_PRAXIS_SKILL_NAMES,
  derivePraxisSkillNames,
  HOST_ADAPTERS,
} = installer;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

test('discover skill directory is absent', () => {
  assert.equal(exists('skills/discover'), false);
});

test('manifest versions match package.json', () => {
  const version = JSON.parse(read('package.json')).version;
  const files = [
    'plugin.json',
    'gemini-extension.json',
    '.claude-plugin/plugin.json',
    '.codex-plugin/plugin.json',
    '.copilot-plugin/plugin.json',
    '.qoder-plugin/plugin.json',
  ];
  for (const f of files) {
    const j = JSON.parse(read(f));
    assert.equal(j.version, version, f);
  }
  const market = JSON.parse(read('.claude-plugin/marketplace.json'));
  assert.equal(market.plugins[0].version, version, 'marketplace plugin version');
  const grokMarket = JSON.parse(read('.grok-plugin/marketplace.json'));
  assert.equal(grokMarket.plugins[0].version, version, 'grok marketplace plugin version');
});

test('package.json declares license homepage repository and bugs', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.author, 'ouonet');
  assert.equal(pkg.homepage, 'https://ouonet.github.io/praxis/');
  assert.match(pkg.repository?.url || '', /github\.com\/ouonet\/praxis/);
  assert.match(pkg.bugs?.url || '', /github\.com\/ouonet\/praxis\/issues/);
  assert.equal(pkg.description, JSON.parse(read('plugin.json')).description);
});

test('skills do not hard-require TodoWrite as sole tracker name', () => {
  const ship = read('skills/ship/SKILL.md');
  assert.equal(/TodoWrite/.test(ship), false);
  assert.match(ship, /tracked tasks|task tracker|incomplete tracked/i);
});

test('session-start bootstrap is harness-neutral for skill loading', () => {
  const hook = read('hooks/session-start');
  assert.equal(/Skill tool in Claude Code/.test(hook), false);
  assert.match(hook, /skills\/<name>\/SKILL\.md|native file-read|skill loader/i);
});

test('using-praxis load rule is harness-neutral', () => {
  const u = read('skills/using-praxis/SKILL.md');
  assert.match(u, /skills\/<name>\/SKILL\.md/);
  assert.match(u, /skill loader|file-read tool/i);
  assert.equal(/multiple Skill tool calls/.test(u), false);
});

test('tdd allows manual acceptance path', () => {
  const tdd = read('skills/tdd/SKILL.md');
  assert.match(tdd, /manual/i);
});

test('README multi-module maturity matches experimental protocol', () => {
  const readme = read('README.md');
  assert.equal(/fully supported in Praxis v4\.0\+/.test(readme), false);
  assert.match(readme, /experimental/i);
});

test('package.json defines test script', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts?.test);
  assert.ok(pkg.scripts?.check);
});

test('shared rule files start with ownership marker and have identical normalized content', () => {
  const agentsRule = read('rules/AGENTS.md').replace(/\r\n/g, '\n');
  const praxisRule = read('rules/praxis.md').replace(/\r\n/g, '\n');
  assert.ok(agentsRule.startsWith('<!-- praxis:managed-rule -->\n'), 'rules/AGENTS.md must start with ownership marker');
  assert.ok(praxisRule.startsWith('<!-- praxis:managed-rule -->\n'), 'rules/praxis.md must start with ownership marker');
  assert.equal(agentsRule, praxisRule, 'rules/AGENTS.md and rules/praxis.md must have identical normalized content');
});

test('package.json defines engines, explicit test script, and files allowlist', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.engines?.node, '>=20.11.0');
  assert.equal(pkg.scripts.test.includes('**'), false, 'scripts.test must not use ** glob');
  assert.match(pkg.scripts.test, /test\/adapters\.test\.js/);
  assert.match(pkg.scripts.test, /test\/cli\.test\.js/);
  assert.match(pkg.scripts.test, /test\/invariants\.test\.js/);
  assert.match(pkg.scripts.test, /test\/session-start\.test\.js/);
  assert.ok(Array.isArray(pkg.files), 'package.json must declare files allowlist');
  for (const required of [
    'bin/',
    'src/',
    'skills/',
    'rules/',
    'hooks/',
    'extensions/',
    'assets/',
    '.opencode/plugins/',
    '.opencode/INSTALL.md',
    '.claude-plugin/',
    '.codex-plugin/',
    '.copilot-plugin/',
    '.qoder-plugin/',
    '.grok-plugin/',
    'plugin.json',
    'gemini-extension.json',
    'model-tiers.example.yaml',
    '!**/node_modules',
    '!**/node_modules/**',
  ]) {
    assert.ok(pkg.files.includes(required), `package.json files missing ${required}`);
  }
});

test('all 9+1 manifests align with package.json metadata SSOT', () => {
  const pkg = JSON.parse(read('package.json'));
  const expectedDesc = 'Token-lean discipline skills for coding agents.';
  assert.equal(pkg.description, expectedDesc);

  const rootManifests = [
    'plugin.json',
    'gemini-extension.json',
    '.claude-plugin/plugin.json',
    '.codex-plugin/plugin.json',
    '.copilot-plugin/plugin.json',
    '.qoder-plugin/plugin.json',
  ];
  for (const f of rootManifests) {
    const j = JSON.parse(read(f));
    assert.equal(j.version, pkg.version, `${f} version`);
    assert.equal(j.description, expectedDesc, `${f} description`);
    if ('license' in j) {
      assert.equal(j.license, pkg.license, `${f} license`);
    }
    if ('author' in j) {
      const authorName = typeof j.author === 'string' ? j.author : j.author?.name;
      assert.equal(authorName, pkg.author, `${f} author`);
    }
  }

  for (const f of ['.claude-plugin/marketplace.json', '.grok-plugin/marketplace.json']) {
    const j = JSON.parse(read(f));
    assert.equal(j.owner?.name, pkg.author, `${f} owner.name`);
    const entry = j.plugins?.[0];
    assert.ok(entry, `${f} missing plugins[0]`);
    assert.equal(entry.version, pkg.version, `${f} plugins[0].version`);
    assert.equal(entry.description, expectedDesc, `${f} plugins[0].description`);
    assert.equal(entry.license, pkg.license, `${f} plugins[0].license`);
    assert.equal(entry.author?.name, pkg.author, `${f} plugins[0].author.name`);
  }

  const agentsMkt = JSON.parse(read('.agents/plugins/marketplace.json'));
  assert.equal(agentsMkt.plugins?.[0]?.name, 'praxis');
  assert.equal(agentsMkt.plugins?.[0]?.source?.url, 'https://github.com/ouonet/praxis.git');
});

test('.gitignore ignores untracked .opencode files without masking tracked plugin assets', () => {
  const lines = read('.gitignore').split(/\r?\n/).map((l) => l.trim());
  assert.equal(lines.includes('.opencode'), false, '.gitignore must not blanket-ignore .opencode');
  assert.equal(lines.includes('.opencode/*'), true);
  assert.equal(lines.includes('!.opencode/plugins/'), true);
  assert.equal(lines.includes('!.opencode/plugins/**'), true);
  assert.equal(lines.includes('!.opencode/INSTALL.md'), true);

  if (exists('.git')) {
    const tracked = spawnSync('git', ['check-ignore', '.opencode/plugins/praxis.js', '.opencode/INSTALL.md'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(tracked.status, 1, `Tracked plugin files must not be ignored: ${tracked.stdout}`);
    const untracked = spawnSync(
      'git',
      ['check-ignore', '.opencode/node_modules/x', '.opencode/bun.lock', '.opencode/skills/using-praxis'],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(untracked.status, 0);
  }
});

test('cross-platform CI workflow and publish workflow run full check and test suites', () => {
  assert.equal(exists('.github/workflows/ci.yml'), true, '.github/workflows/ci.yml must exist');
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /ubuntu-latest/);
  assert.match(ci, /macos-latest/);
  assert.match(ci, /windows-latest/);
  assert.match(ci, /\[\s*20\s*,\s*22\s*\]/);
  assert.match(ci, /npm run check/);
  assert.match(ci, /npm test/);

  const publish = read('.github/workflows/publish.yml');
  assert.match(publish, /npm run check/);
  assert.match(publish, /npm test/);
});

test('PRAXIS_SKILL_NAMES dynamically matches skills directory and falls back cleanly', () => {
  const onDisk = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((d) => !d.name.startsWith('.') && (d.isDirectory() || d.isSymbolicLink()))
    .map((d) => d.name)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  assert.equal(Object.isFrozen(PRAXIS_SKILL_NAMES), true);
  assert.deepEqual([...PRAXIS_SKILL_NAMES].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), onDisk);
  assert.deepEqual(derivePraxisSkillNames(path.join(root, 'nonexistent-skills-dir')), DEFAULT_PRAXIS_SKILL_NAMES);
});

test('every skill directory except references defines SKILL.md with name and description frontmatter', () => {
  const dirs = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((d) => !d.name.startsWith('.') && d.name !== 'references' && (d.isDirectory() || d.isSymbolicLink()))
    .map((d) => d.name);

  for (const dir of dirs) {
    const skillPath = path.join('skills', dir, 'SKILL.md');
    assert.equal(exists(skillPath), true, `Missing ${skillPath}`);
    const content = read(skillPath).replace(/\r\n/g, '\n');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    assert.ok(fmMatch, `${skillPath} must start with YAML frontmatter`);
    const fm = fmMatch[1];
    assert.match(fm, new RegExp(`^name:\\s*${dir}\\s*$`, 'm'), `${skillPath} frontmatter name must equal ${dir}`);
    assert.match(fm, /^description:\s*\S+/m, `${skillPath} frontmatter must define non-empty description`);
  }
});

test('HOST_ADAPTERS registry and installer.js public exports match SSOT contracts', () => {
  assert.equal(Object.isFrozen(HOST_ADAPTERS), true);
  assert.deepEqual(Object.keys(HOST_ADAPTERS).sort(), Object.keys(HOSTS).sort());
  for (const id of Object.keys(HOSTS)) {
    const adapter = HOST_ADAPTERS[id];
    assert.equal(adapter.id, id);
    assert.equal(typeof adapter.installFiles, 'function');
    assert.equal(typeof adapter.uninstallFiles, 'function');
    assert.equal(typeof adapter.getStatus, 'function');
  }

  for (const expectedExport of [
    'installHost',
    'uninstallHost',
    'updateHost',
    'getHostStatus',
    'normalizeScope',
    'normalizeMethod',
    'validateRef',
    'supportsRef',
    'stripPraxisCodexToml',
    'hasPraxisCodexToml',
    'hasPraxisOpencodeConfigText',
    'hasPraxisPiSettingsText',
    'isPraxisPluginEntry',
    'isPraxisManagedRuleFile',
    'copyManagedRuleFile',
    'copyOrLink',
    'copyPluginFiles',
    'PLUGIN_ITEMS_TO_COPY',
    'HOST_ADAPTERS',
    'getHostAdapter',
    'derivePraxisSkillNames',
    'DEFAULT_PRAXIS_SKILL_NAMES',
    'resolveBinaryAvailable',
    'diagnoseHost',
    'diagnoseHosts',
    'validateTomlBasic',
    'isDanglingSymlink',
  ]) {
    assert.ok(expectedExport in installer, `installer.js must export ${expectedExport}`);
  }
});

test('src/cli/doctor.js exists and maintains acyclic imports without importing installer.js or index.js', () => {
  assert.equal(exists('src/cli/doctor.js'), true, 'src/cli/doctor.js must exist');
  const src = read('src/cli/doctor.js');
  assert.equal(/['"]\.\/installer\.js['"]/.test(src), false, 'doctor.js must not import ./installer.js');
  assert.equal(/['"]\.\/index\.js['"]/.test(src), false, 'doctor.js must not import ./index.js');
});

test('npm pack dry-run covers PLUGIN_ITEMS_TO_COPY and excludes dev-only paths and nested node_modules', () => {
  const pkg = JSON.parse(read('package.json'));
  const filesSet = new Set(pkg.files);
  const autoIncluded = new Set(['package.json', 'README.md', 'LICENSE']);
  for (const item of PLUGIN_ITEMS_TO_COPY) {
    if (autoIncluded.has(item)) continue;
    assert.ok(
      filesSet.has(item) || filesSet.has(`${item}/`),
      `package.json files must cover PLUGIN_ITEMS_TO_COPY item ${item}`,
    );
  }

  const res = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/c', 'npm', 'pack', '--dry-run', '--json'], { cwd: root, encoding: 'utf8' })
    : spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  const packInfo = JSON.parse(res.stdout)[0];
  const packedPaths = packInfo.files.map((f) => f.path);

  for (const requiredFile of [
    'bin/praxis.js',
    'src/cli/shared.js',
    'src/cli/doctor.js',
    'src/cli/adapters/index.js',
    '.opencode/plugins/praxis.js',
    '.opencode/INSTALL.md',
    'model-tiers.example.yaml',
    'plugin.json',
    'gemini-extension.json',
    'rules/AGENTS.md',
    'rules/praxis.md',
    'skills/using-praxis/SKILL.md',
    'hooks/session-start',
    'extensions/praxis.js',
    'assets/logo-mark.svg',
  ]) {
    assert.ok(packedPaths.includes(requiredFile), `npm tarball must include ${requiredFile}`);
  }

  for (const p of packedPaths) {
    assert.equal(/^test\//.test(p), false, `npm tarball must exclude ${p}`);
    assert.equal(/^docs\//.test(p), false, `npm tarball must exclude ${p}`);
    assert.equal(/^site\//.test(p), false, `npm tarball must exclude ${p}`);
    assert.equal(/^\.github\//.test(p), false, `npm tarball must exclude ${p}`);
    assert.equal(/^\.codegraph\//.test(p), false, `npm tarball must exclude ${p}`);
    assert.equal(/^\.agents\//.test(p), false, `npm tarball must exclude ${p}`);
    assert.equal(p === 'CHANGELOG.md', false, `npm tarball must exclude ${p}`);
    assert.equal(/(?:^|\/)node_modules(?:\/|$)/.test(p), false, `npm tarball must exclude node_modules: ${p}`);
  }
});

function parseTriageTable(content) {
  const rows = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('|')) continue;
    const cells = line.slice(1, -1).split('|').map((c) => c.trim());
    if (cells.length !== 3) continue;
    if (cells[0] === 'scope' || cells[0] === '---') continue;
    rows.push({ scope: cells[0], signal: cells[1], load: cells[2] });
  }
  return rows;
}

test('9-scope triage table and ship/release disambiguation stay synchronized across rules and using-praxis', () => {
  const expectedScopes = [
    ['vague', '`design`'],
    ['trivial', 'none'],
    ['small', '`tdd` (intent unclear? clarify first)'],
    ['standard', '`design`, `plan`, `tdd`, `review`'],
    ['complex', '`design`, `plan`, `worktree`, `subagents`, `review`, `ship`'],
    ['debug', '`debug`'],
    ['onboard', '`onboard`'],
    ['ship', '`ship`, `review`, `archive`'],
    ['release', '`release`'],
  ];

  const tables = ['rules/AGENTS.md', 'rules/praxis.md', 'skills/using-praxis/SKILL.md'].map((relPath) => {
    const text = read(relPath);
    const rows = parseTriageTable(text);
    assert.equal(rows.length, expectedScopes.length, `${relPath} must have ${expectedScopes.length} triage rows`);
    for (let i = 0; i < expectedScopes.length; i++) {
      assert.equal(rows[i].scope, expectedScopes[i][0], `${relPath} row ${i} scope`);
      assert.equal(rows[i].scope.includes('`'), false, `${relPath} scope cell must not be backticked`);
      assert.equal(rows[i].signal.includes('`'), false, `${relPath} signal cell must not be backticked`);
      assert.equal(rows[i].load, expectedScopes[i][1], `${relPath} row ${i} load`);
    }
    assert.match(
      text,
      /`ship` and `release` apply only when the user explicitly requests finishing\/archiving a completed plan \(`ship`\) or versioning\/tagging\/publishing \(`release`\), and take precedence over work-size scopes/i,
      `${relPath} must document explicit ship/release precedence & disambiguation`,
    );
    return rows;
  });

  assert.deepEqual(tables[0], tables[1]);
  assert.deepEqual(tables[0], tables[2]);
});

test('README.md and docs/tech-spec.md align with M7 CLI doctor, 9-scope triage, and modular layout', () => {
  const readme = read('README.md');
  assert.match(readme, /praxis doctor/);
  assert.match(readme, /validate/);
  assert.match(readme, /check/);
  assert.match(readme, /\|\s*all tasks done.*\|\s*ship/i);
  for (const entry of ['src/cli/', 'doctor.js', 'shared.js', 'adapters/', 'rules/', 'AGENTS.md', 'praxis.md']) {
    assert.ok(readme.includes(entry), `README.md must mention ${entry}`);
  }

  const techSpec = read('docs/tech-spec.md');
  const scopeMatch = techSpec.match(/Scope set:\s*(.+)/);
  assert.ok(scopeMatch, 'docs/tech-spec.md must declare Scope set');
  for (const s of ['vague', 'trivial', 'small', 'standard', 'complex', 'debug', 'onboard', 'ship', 'release']) {
    assert.ok(scopeMatch[1].includes(s), `docs/tech-spec.md Scope set must include ${s}`);
  }
  assert.match(techSpec, /doctor.*validate.*check|doctor`.*`validate`.*`check`/i);
  assert.match(techSpec, /src\/cli\/doctor\.js|hosts,shared,doctor,installer|doctor\.js/);
});

test('model-tiers.yaml schema and resolution order are unified across core files without obsolete model IDs', () => {
  const bannedPattern = /claude-3-5|claude-3-7|claude-sonnet-5|claude-opus-5/i;
  const targets = [
    'model-tiers.example.yaml',
    'skills/subagents/SKILL.md',
    'skills/references/reviewers.md',
    'README.md',
    'docs/tech-spec.md',
    'rules/AGENTS.md',
    'rules/praxis.md',
  ];
  for (const rel of targets) {
    assert.equal(bannedPattern.test(read(rel)), false, `${rel} must not contain obsolete/fictional model IDs`);
  }

  const exampleYaml = read('model-tiers.example.yaml');
  for (const tok of [
    'tiers:',
    'fast:',
    'balanced:',
    'strongest:',
    'provider: anthropic',
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-6',
    'claude-opus-4-6',
    'project',
    '~/.praxis/model-tiers.yaml',
    'harness default',
  ]) {
    assert.ok(exampleYaml.includes(tok), `model-tiers.example.yaml must include ${tok}`);
  }

  const subagents = read('skills/subagents/SKILL.md');
  assert.match(subagents, /tiers\.<tier>\.(?:\{provider,\s*model\}|model)|tiers:\s*\n\s*fast:/);
  assert.match(subagents, /project `?\.praxis\/model-tiers\.yaml`?\s*→\s*user `?~\/\.praxis\/model-tiers\.yaml`?\s*→\s*harness default/i);

  const reviewers = read('skills/references/reviewers.md');
  assert.match(reviewers, /tiers\.<tier>\.model/);
  assert.match(reviewers, /project `?\.praxis\/model-tiers\.yaml`?\s*→\s*user `?~\/\.praxis\/model-tiers\.yaml`?\s*→\s*harness default/i);

  const readme = read('README.md');
  assert.match(readme, /tiers:\s*\r?\n\s*fast:/);
  assert.match(readme, /claude-haiku-4-5-20251001/);
  assert.match(readme, /claude-sonnet-4-6/);
  assert.match(readme, /claude-opus-4-6/);
  assert.match(readme, /project `?\.praxis\/model-tiers\.yaml`?\s*→\s*user `?~\/\.praxis\/model-tiers\.yaml`?\s*→\s*harness default/i);

  const techSpec = read('docs/tech-spec.md');
  assert.match(techSpec, /tiers\.<tier>\.\{provider,\s*model\}/);
  assert.match(techSpec, /project root\s*→\s*user home\s*→\s*harness default/i);
});

function walkMarkdownFiles(dir, base = dir) {
  const relPaths = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      relPaths.push(...walkMarkdownFiles(full, base));
    } else if (entry.name.endsWith('.md')) {
      relPaths.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return relPaths.sort();
}

test('4-locale documentation site has exact tree parity, no discover/stubs/banned terms, and synced v4 pages', () => {
  const locales = ['en', 'zh', 'ja', 'ko'];
  const configTs = read('site/.vitepress/config.ts');
  assert.equal(/discover/.test(configTs), false, 'site/.vitepress/config.ts must not reference retired discover');

  const baselineTree = walkMarkdownFiles(path.join(root, 'site', 'en'));
  assert.equal(baselineTree.includes('skills/discover.md'), false, 'site/en/skills/discover.md must be deleted');

  const bannedPhrases = [
    /Documentation coming soon/i,
    /TodoWrite/,
    /`cross-rule`/,
    /`cross-module`/,
    /←\s*stub/,
    /claude-3-5/i,
    /claude-3-7/i,
    /claude-sonnet-5/i,
    /claude-opus-5/i,
    /←\s*plan in detail now/,
    /←\s*现在详细计划/,
    /←\s*今詳細に計画/,
    /←\s*지금 상세 계획/,
  ];

  for (const locale of locales) {
    assert.equal(exists(`site/${locale}/skills/discover.md`), false, `site/${locale}/skills/discover.md must not exist`);
    const tree = walkMarkdownFiles(path.join(root, 'site', locale));
    assert.deepEqual(tree, baselineTree, `site/${locale} file tree must match site/en`);

    for (const rel of tree) {
      const text = read(`site/${locale}/${rel}`);
      for (const re of bannedPhrases) {
        assert.equal(re.test(text), false, `site/${locale}/${rel} matched banned phrase ${re}`);
      }
    }

    const indexMd = read(`site/${locale}/index.md`);
    assert.match(indexMd, /Copilot/i, `site/${locale}/index.md must mention Copilot`);
    assert.match(indexMd, /Grok/i, `site/${locale}/index.md must mention Grok`);

    const gettingStarted = read(`site/${locale}/guide/getting-started.md`);
    for (const reqTok of ['grok', 'copilot', 'doctor', 'validate', 'check', 'praxis@praxis-marketplace', 'tiers:', 'provider:', 'model:']) {
      assert.ok(gettingStarted.includes(reqTok), `site/${locale}/guide/getting-started.md must include ${reqTok}`);
    }

    const howItWorks = read(`site/${locale}/guide/how-it-works.md`);
    for (const reqTok of ['consistency', 'boundary', 'ship', 'release']) {
      assert.ok(howItWorks.includes(reqTok), `site/${locale}/guide/how-it-works.md must include ${reqTok}`);
    }

    const reviewersMd = read(`site/${locale}/skills/reviewers.md`);
    assert.ok(reviewersMd.includes('consistency'), `site/${locale}/skills/reviewers.md must include consistency`);
    assert.ok(reviewersMd.includes('boundary'), `site/${locale}/skills/reviewers.md must include boundary`);

    const designMd = read(`site/${locale}/skills/design.md`);
    assert.ok(designMd.includes('./reviewers'), `site/${locale}/skills/design.md must link ./reviewers`);
    assert.match(designMd, /multi-module|多模块|マルチモジュール|멀티 모듈/i);
  }
});
