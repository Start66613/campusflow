import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('tab lens scrubs continuously and commits navigation on release', () => {
  const tabs = read('app/(tabs)/_layout.tsx');
  assert.match(tabs, /activeOffsetX\(\[-3, 3\]\)/);
  assert.match(tabs, /travel\.value = position \* itemWidth/);
  assert.match(tabs, /Math\.abs\(travel\.value \/ itemWidth - Math\.round/);
  const update = tabs.slice(tabs.indexOf('.onUpdate((event) => {'), tabs.indexOf('.onEnd(() => {'));
  assert.doesNotMatch(update, /selectTab|navigation\.navigate/);
});

test('current-time marker is explained and sits behind course content', () => {
  const schedule = read('app/(tabs)/schedule.tsx');
  assert.match(schedule, /细线表示今天的当前时间，仅本周上课时段显示/);
  assert.match(schedule, /CurrentTimeLine color=\{theme\.primary\}/);
  assert.ok(schedule.indexOf('CurrentTimeLine color={theme.primary}') < schedule.indexOf('data.courses.filter'));
  assert.doesNotMatch(schedule, /CurrentTimeLine columnWidth=\{columnWidth\} color=\{theme\.red\}/);
});
