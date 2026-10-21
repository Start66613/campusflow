import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('daily is a real tab and its public /daily route has no duplicate stack screen', () => {
  assert.ok(existsSync(new URL('../app/(tabs)/daily.tsx', import.meta.url)));
  assert.ok(!existsSync(new URL('../app/daily.tsx', import.meta.url)));
  assert.match(read('app/(tabs)/_layout.tsx'), /<Tabs.Screen name="daily" options=\{\{ title: '日常' \}\} \/>/);
  assert.match(read('app/(tabs)/_layout.tsx'), /daily: \{ title: '日常', icon: \{ ios: 'leaf.fill'/);
  assert.doesNotMatch(read('app/_layout.tsx'), /<Stack.Screen name="daily"/);
  assert.match(read('app/(tabs)/daily.tsx'), /<DailyPage tabRoot title="我的日常"/);
});

test('daily tab hides its back button and reserves the floating bar plus the safe area', () => {
  const shared = read('components/daily/shared.tsx');
  assert.match(shared, /FLOATING_TAB_BAR_HEIGHT \+ Math\.max\(insets\.bottom, 8\) \+ FLOATING_TAB_CONTENT_GAP/);
  assert.match(shared, /!tabRoot \? <MotionPressable accessibilityLabel="返回"/);
  assert.match(shared, /paddingBottom: bottomSpace/);
  assert.match(shared, /edges=\{tabRoot \? \['top'\] : \['top', 'bottom'\]\}/);
});

test('all six main destinations remain reachable with touch targets over 44pt at 320pt', () => {
  const layout = read('app/(tabs)/_layout.tsx');
  const routes = [...layout.matchAll(/<Tabs.Screen name="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(routes, ['index', 'schedule', 'assistant', 'daily', 'insights', 'profile']);
  assert.ok((320 - 14 * 2 - 10) / routes.length >= 44);
  assert.match(layout, /iconKey === 'daily' \? 'study'/);
});

test('Windows preview can run independently without disabling security or killing other servers', () => {
  const script = read('scripts/start-iphone-background.mjs');
  assert.match(script, /Start-Process[^\n]+-WindowStyle Hidden/);
  assert.match(script, /owner === 'start66613'/);
  assert.match(script, /createConnection\(\{ host: '127.0.0.1', port \}\)/);
  assert.doesNotMatch(script, /Stop-Process|ExecutionPolicy|EXPO_OFFLINE\s*=/i);
});
