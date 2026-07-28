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
  const handlers = new Map();
  const appended = [];
  const pi = {
    on(event, handler) {
      handlers.set(event, handler);
    },
    appendEntry(customType, data) {
      appended.push({ customType, data });
    },
  };

  const extension = await loadExtension();
  extension(pi);

  return {
    appended,
    invoke: () =>
      handlers.get('before_agent_start')({}, {
        sessionManager: { getEntries: () => entries },
      }),
  };
};

test('loads the using-praxis bootstrap into a hidden pi message', async () => {
  const { appended, invoke } = await installExtension();

  const result = await invoke();

  assert.match(result.message.content, /\*\*Praxis bootstrap\*\*/);
  assert.match(result.message.content, /# Using Praxis/);
  assert.match(result.message.content, /\*\*Pi note\*\*/);
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

test('does nothing when the bootstrap skill is missing', async (t) => {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'praxis-pi-'));
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  await mkdir(path.join(fixtureRoot, 'extensions'));
  await writeFile(path.join(fixtureRoot, 'package.json'), '{"type":"module"}\n');
  await writeFile(
    path.join(fixtureRoot, 'extensions/praxis.js'),
    await readFile(extensionPath, 'utf8'),
  );

  const handlers = new Map();
  let appendCount = 0;
  const extension = await loadExtension(path.join(fixtureRoot, 'extensions/praxis.js'));
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

test('injects the bootstrap only once per session', async () => {
  const { appended, invoke } = await installExtension([
    { type: 'custom', customType: marker },
  ]);

  const result = await invoke();

  assert.equal(result, undefined);
  assert.deepEqual(appended, []);
});
