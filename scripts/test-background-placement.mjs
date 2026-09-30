import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('shared wallpaper is rendered by each visible Screen, not behind native navigation', () => {
  const screen = read('components/ui.tsx');
  const root = read('app/_layout.tsx');
  const backdrop = read('components/app-backdrop.tsx');

  assert.match(screen, /<SafeAreaView[^>]*>[\s\S]*?<AppBackdrop\s*\/>/);
  assert.doesNotMatch(root, /<AppBackdrop\s*\/>/);
  assert.match(backdrop, /data\.settings\.backgroundUri/);
  assert.match(backdrop, /glass-wallpaper-v1\.png/);
});
