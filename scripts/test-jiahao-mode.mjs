import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('Jiahao icon keys use distinct generated assets that are bundled', () => {
  const source = read('src/jiahao-icons.ts');
  const pairs = [...source.matchAll(/(\w+): require\('\.\.\/assets\/images\/(jiahao-[\w-]+\.png)'\)/g)];
  assert.ok(pairs.length >= 30);
  const names = pairs.map(([, , file]) => file);
  assert.equal(new Set(names).size, names.length, 'each icon must have a separate asset');
  for (const name of names) assert.ok(existsSync(new URL(`../assets/images/${name}`, import.meta.url)), `${name} is missing`);
});

test('Jiahao AI affects presentation, not structured writes', () => {
  const assistant = read('src/assistant.ts');
  const ui = read('app/(tabs)/assistant.tsx');
  assert.match(assistant, /Presentation style only/);
  assert.match(assistant, /Never alter any extracted command fields/);
  assert.match(ui, /setPending\(\{ commands: result\.commands/);
  assert.match(ui, /committingRef\.current/);
  assert.match(ui, /jiahaoIcons\.camera/);
  assert.match(ui, /jiahaoIcons\.web/);
});
