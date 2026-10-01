import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('light control fill contrasts with its page and card surfaces', () => {
  const theme = read('src/theme.ts');
  assert.match(theme, /background: '#F2F2F7'/);
  assert.match(theme, /surfaceAlt: 'rgba\(118,118,128,0\.12\)'/);
  assert.match(theme, /card: 28/);
});

test('screen bottom reserve follows tab height and safe-area inset', () => {
  const ui = read('components/ui.tsx');
  assert.match(ui, /FLOATING_TAB_BAR_HEIGHT \+ Math\.max\(insets\.bottom, 8\) \+ FLOATING_TAB_CONTENT_GAP/);
  assert.match(ui, /borderRadius: radii\.card/);
});

test('optional native motion leaves Expo Go on supported APIs', () => {
  const native = read('src/native-motion.tsx');
  assert.match(native, /Constants\.executionEnvironment !== ExecutionEnvironment\.StoreClient/);
  assert.match(native, /Haptics\.selectionAsync\(\)/);
  assert.doesNotMatch(native, /^import .*@renegades\/react-native-tickle/m);
});

test('small glass labels keep opaque text and cheap platform fallbacks', () => {
  const ui = read('components/ui.tsx');
  const assistant = read('app/(tabs)/assistant.tsx');
  const schedule = read('app/(tabs)/schedule.tsx');
  assert.match(ui, /const color = glass \? theme\.text/);
  assert.match(ui, /<GlassBackdrop radius=\{999\}[^>]*readable lightweight/);
  assert.match(ui, /lightweight\s*\? <View/);
  assert.match(assistant, /GlassBackdrop radius=\{99\}[^>]*readable lightweight/);
  assert.match(assistant, /GlassBackdrop radius=\{13\}[^>]*readable lightweight/);
  assert.match(schedule, /GlassBackdrop radius=\{17\}[^>]*readable lightweight/);
  assert.match(schedule, /GlassBackdrop radius=\{13\}[^>]*readable lightweight/);
});
