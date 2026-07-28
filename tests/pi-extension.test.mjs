import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const extensionPath = path.resolve('extensions/praxis.js');
const marker = 'praxis.using-praxis.injected.v1';

const loadExtension = (file = extensionPath) =>
  import(`${pathToFileURL(file).href}?test=${crypto.randomUUID()}`).then(
    ({ default: extension }) => extension,
  );

const installExtension = async (entries = []) => {
  const sessionEntries = [...entries];
  const handlers = new Map();
  const appended = [];
  const pi = {
    on(event, handler) {
      handlers.set(event, handler);
    },
    appendEntry(customType, data) {
      appended.push({ customType, data });
      sessionEntries.push({ type: 'custom', customType, data });
    },
  };

  const extension = await loadExtension();
  extension(pi);

  return {
    appended,
    invoke: () =>
      handlers.get('before_agent_start')({}, {
        sessionManager: { getEntries: () => sessionEntries },
      }),
  };
};

const installFixture = async (t, skillContent) => {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'praxis-pi-'));
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  await mkdir(path.join(fixtureRoot, 'extensions'), { recursive: true });
  await writeFile(path.join(fixtureRoot, 'package.json'), '{"type":"module"}\n');
  await writeFile(
    path.join(fixtureRoot, 'extensions/praxis.js'),
    await readFile(extensionPath, 'utf8'),
  );

  if (skillContent !== undefined) {
    await mkdir(path.join(fixtureRoot, 'skills/using-praxis'), { recursive: true });
    await writeFile(
      path.join(fixtureRoot, 'skills/using-praxis/SKILL.md'),
      skillContent,
    );
  }

  return {
    extension: await loadExtension(path.join(fixtureRoot, 'extensions/praxis.js')),
  };
};

test('loads the using-praxis bootstrap into a hidden pi message', async () => {
  const { appended, invoke } = await installExtension();

  const result = await invoke();

  assert.match(result.message.content, /\*\*Praxis bootstrap\*\*/);
  assert.match(result.message.content, /# Using Praxis/);
  assert.match(result.message.content, /\*\*Pi note\*\*/);
  assert.match(
    result.message.content,
    /read the installed path advertised by pi for each required Praxis skill/i,
  );
  assert.doesNotMatch(
    result.message.content,
    /skills\/<name>\/SKILL\.md/,
  );
  assert.equal(result.message.customType, marker);
  assert.equal(result.message.display, false);
  assert.deepEqual(appended, [
    {
      customType: marker,
      data: {
        version: 1,
        source: 'using-praxis',
        path: 'skills/using-praxis/SKILL.md',
      },
    },
  ]);
});

test('strips YAML frontmatter from the injected skill', async () => {
  const { invoke } = await installExtension();

  const result = await invoke();

  assert.doesNotMatch(result.message.content, /^---/);
  assert.doesNotMatch(result.message.content, /\nname: using-praxis\n/);
  assert.doesNotMatch(result.message.content, /\ndescription: Use at session start/);
});

test('strips CRLF YAML frontmatter from the injected skill', async (t) => {
  const { extension } = await installFixture(
    t,
    '---\r\nname: fixture\r\ndescription: CRLF fixture\r\n---\r\n# Fixture skill\r\n',
  );
  const handlers = new Map();
  extension({
    on: (event, handler) => handlers.set(event, handler),
    appendEntry: () => {},
  });

  const result = await handlers.get('before_agent_start')({}, {});

  assert.match(result.message.content, /# Fixture skill/);
  assert.doesNotMatch(result.message.content, /name: fixture/);
  assert.doesNotMatch(result.message.content, /description: CRLF fixture/);
});

test('does nothing when the bootstrap skill is missing', async (t) => {
  const { extension } = await installFixture(t);
  const handlers = new Map();
  let appendCount = 0;
  extension({
    on: (event, handler) => handlers.set(event, handler),
    appendEntry: () => {
      appendCount += 1;
    },
  });

  const result = await handlers.get('before_agent_start')({}, {});

  assert.equal(result, undefined);
  assert.equal(appendCount, 0);
});

test('persists the marker and injects the bootstrap only once per session', async () => {
  const { appended, invoke } = await installExtension();

  const firstResult = await invoke();
  const secondResult = await invoke();

  assert.equal(firstResult.message.customType, marker);
  assert.equal(secondResult, undefined);
  assert.equal(appended.length, 1);
});

test('declares a dependency-free mechanical quality command', async () => {
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));

  assert.equal(
    manifest.scripts?.quality,
    'node --check extensions/praxis.js && node --test tests/pi-extension.test.mjs',
  );
});
