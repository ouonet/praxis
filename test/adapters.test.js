import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('pi extension source strips frontmatter and mentions file-read skills', () => {
  const src = fs.readFileSync(path.join(root, 'extensions/praxis.js'), 'utf8');
  assert.match(src, /stripFrontmatter|match\(\/\^---/);
  assert.match(src, /skills\/<name>\/SKILL\.md|native read tool/);
  assert.match(src, /BOOTSTRAP_MARKER|injected/);
});

test('opencode plugin maps tools and registers skills path without dead configDir code', () => {
  const src = fs.readFileSync(path.join(root, '.opencode/plugins/praxis.js'), 'utf8');
  assert.match(src, /todowrite|task tracker/i);
  assert.match(src, /config\.skills\.paths/);
  assert.match(src, /experimental\.chat\.messages\.transform/);
  assert.equal(/OPENCODE_CONFIG_DIR|normalizePath/.test(src), false);
});

test('node can parse adapter modules as syntax-valid ESM text', async () => {
  const { spawnSync } = await import('node:child_process');
  for (const f of ['extensions/praxis.js', '.opencode/plugins/praxis.js']) {
    const r = spawnSync(process.execPath, ['--check', path.join(root, f)], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  }
});

test('opencode plugin resolves installed ../skills layout, strips CRLF frontmatter, avoids null-cache poison, and deduplicates via praxis marker', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-opencode-installed-'));
  try {
    const pluginDir = path.join(tmp, 'opencode', 'plugins');
    fs.mkdirSync(pluginDir, { recursive: true });
    const pluginFile = path.join(pluginDir, 'praxis.js');
    fs.copyFileSync(path.join(root, '.opencode/plugins/praxis.js'), pluginFile);

    const mod = await import(`${pathToFileURL(pluginFile).href}?t=${Date.now()}`);
    const instance1 = await mod.PraxisPlugin({});

    // 1. Missing SKILL.md should not poison cache
    const msgMissing = {
      messages: [{ info: { role: 'user' }, parts: [{ type: 'text', text: 'hello' }] }],
    };
    await instance1['experimental.chat.messages.transform']({}, msgMissing);
    assert.equal(msgMissing.messages[0].parts.length, 1);

    // 2. Now create ../skills/using-praxis/SKILL.md with CRLF frontmatter
    const skillDir = path.join(tmp, 'opencode', 'skills', 'using-praxis');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\r\nname: using-praxis\r\ndescription: test\r\n---\r\n# Using Praxis\r\n\r\nTriage body here.\r\n',
      'utf8',
    );

    const instance2 = await mod.PraxisPlugin({});
    const cfg = {};
    await instance2.config(cfg);
    assert.deepEqual(cfg.skills.paths, [path.join(tmp, 'opencode', 'skills')]);

    // 3. User message containing EXTREMELY_IMPORTANT should still receive Praxis bootstrap
    const output = {
      messages: [
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: 'User note with EXTREMELY_IMPORTANT keyword' }],
        },
      ],
    };
    await instance2['experimental.chat.messages.transform']({}, output);
    assert.equal(output.messages[0].parts.length, 2);
    const injected = output.messages[0].parts[0].text;
    assert.match(injected, /<!-- praxis:using-praxis:v1 -->/);
    assert.match(injected, /Triage body here\./);
    assert.equal(injected.includes('name: using-praxis'), false, 'CRLF frontmatter must be stripped');

    // 4. Second transform call deduplicates via marker
    await instance2['experimental.chat.messages.transform']({}, output);
    assert.equal(output.messages[0].parts.length, 2);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('opencode plugin falls back to repo ../../skills layout when ../skills is absent', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-opencode-repo-'));
  try {
    const pluginDir = path.join(tmp, '.opencode', 'plugins');
    fs.mkdirSync(pluginDir, { recursive: true });
    const pluginFile = path.join(pluginDir, 'praxis.js');
    fs.copyFileSync(path.join(root, '.opencode/plugins/praxis.js'), pluginFile);

    const skillDir = path.join(tmp, 'skills', 'using-praxis');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\r\nname: using-praxis\r\n---\r\n# Repo Layout Body\r\n',
      'utf8',
    );

    const mod = await import(`${pathToFileURL(pluginFile).href}?t=${Date.now()}`);
    const instance = await mod.PraxisPlugin({});
    const cfg = {};
    await instance.config(cfg);
    assert.deepEqual(cfg.skills.paths, [path.join(tmp, 'skills')]);

    const output = {
      messages: [{ info: { role: 'user' }, parts: [{ type: 'text', text: 'hi' }] }],
    };
    await instance['experimental.chat.messages.transform']({}, output);
    assert.equal(output.messages[0].parts.length, 2);
    assert.match(output.messages[0].parts[0].text, /Repo Layout Body/);
    assert.equal(output.messages[0].parts[0].text.includes('name: using-praxis'), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('pi extension strips CRLF frontmatter, avoids null-cache poison, and injects once per session', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'praxis-pi-ext-'));
  try {
    const extDir = path.join(tmp, 'extensions');
    fs.mkdirSync(extDir, { recursive: true });
    const extFile = path.join(extDir, 'praxis.js');
    fs.copyFileSync(path.join(root, 'extensions/praxis.js'), extFile);

    const mod = await import(`${pathToFileURL(extFile).href}?t=${Date.now()}`);
    let handler;
    const entries = [];
    const pi = {
      on(event, fn) {
        if (event === 'before_agent_start') handler = fn;
      },
      appendEntry(customType, data) {
        entries.push({ type: 'custom', customType, data });
      },
    };
    mod.default(pi);
    assert.equal(typeof handler, 'function');

    // 1. Missing SKILL.md returns undefined without poisoning cache
    const ctx = { sessionManager: { getEntries: () => entries } };
    const resMissing = await handler({}, ctx);
    assert.equal(resMissing, undefined);

    // 2. Create CRLF SKILL.md and invoke again
    const skillDir = path.join(tmp, 'skills', 'using-praxis');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\r\nname: using-praxis\r\ndescription: pi test\r\n---\r\n# Pi Body\r\n',
      'utf8',
    );

    const res1 = await handler({}, ctx);
    assert.ok(res1?.message?.content);
    assert.match(res1.message.content, /# Pi Body/);
    assert.equal(res1.message.content.includes('name: using-praxis'), false, 'CRLF frontmatter must be stripped');
    assert.equal(entries.length, 1);

    // 3. Second call skips when marker exists in session entries
    const res2 = await handler({}, ctx);
    assert.equal(res2, undefined);
    assert.equal(entries.length, 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
