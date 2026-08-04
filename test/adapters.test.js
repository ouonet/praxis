import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('pi extension source strips frontmatter and mentions file-read skills', () => {
  const src = fs.readFileSync(path.join(root, 'extensions/praxis.js'), 'utf8');
  assert.match(src, /stripFrontmatter|match\(\/\^---/);
  assert.match(src, /skills\/<name>\/SKILL\.md|native read tool/);
  assert.match(src, /BOOTSTRAP_MARKER|injected/);
});

test('opencode plugin maps tools and registers skills path', () => {
  const src = fs.readFileSync(path.join(root, '.opencode/plugins/praxis.js'), 'utf8');
  assert.match(src, /todowrite|task tracker/i);
  assert.match(src, /config\.skills\.paths/);
  assert.match(src, /experimental\.chat\.messages\.transform/);
});

test('node can parse adapter modules as syntax-valid ESM text', async () => {
  // Syntax check via dynamic import of file URL may execute — use fs + vm Module check via spawn node --check
  const { spawnSync } = await import('node:child_process');
  for (const f of ['extensions/praxis.js', '.opencode/plugins/praxis.js']) {
    const r = spawnSync(process.execPath, ['--check', path.join(root, f)], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  }
});
