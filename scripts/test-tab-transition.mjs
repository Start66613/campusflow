import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const tabs = readFileSync(new URL('../app/(tabs)/_layout.tsx', import.meta.url), 'utf8');

test('main tabs animate whole scenes without fading native glass', () => {
  assert.match(tabs, /animation: reduceMotion \? 'none' : 'shift'/);
  assert.match(tabs, /sceneStyleInterpolator: \(\{ current \}\) =>/);
  assert.match(tabs, /inputRange: \[-1, 0, 1\]/);
  assert.match(tabs, /outputRange: \[-width, 0, width\]/);
  const sceneInterpolator = tabs.slice(tabs.indexOf('sceneStyleInterpolator:'), tabs.indexOf('tabBarHideOnKeyboard:'));
  assert.doesNotMatch(sceneInterpolator, /opacity:/);
});
