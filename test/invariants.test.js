import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
