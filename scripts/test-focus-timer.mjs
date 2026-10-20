import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
function load(file, dependencies = {}) {
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}
const focus = load('src/focus-timer.ts');
const daily = load('src/daily.ts');
const notifications = load('src/daily-notifications.ts', {
  'react-native': { Platform: { OS: 'web' } }, './daily': daily, './focus-timer': focus,
});
const start = new Date(2026, 9, 19, 10, 0).getTime();

test('background time uses elapsed wall clock, including an exact completion timestamp', () => {
  const timer = focus.startFocusTimer(focus.createFocusTimer({ focusMinutes: 25 }), start);
  assert.equal(focus.displayedFocusSeconds(timer, start + 5 * 60_000), 1200);
  const complete = focus.completeFocusTimer(timer, start + 40 * 60_000);
  assert.equal(complete.elapsed, 1500);
  assert.equal(complete.completedAt, start + 25 * 60_000);
  assert.equal(focus.displayedFocusSeconds(complete, start + 41 * 60_000), 0);
});
test('pausing and restoring do not count the paused interval or reset the clock', () => {
  let timer = focus.startFocusTimer(focus.createFocusTimer(), start);
  timer = focus.pauseFocusTimer(timer, start + 120_000);
  timer = focus.restoreFocusTimer(JSON.parse(JSON.stringify(timer)));
  assert.equal(focus.elapsedFocusSeconds(timer, start + 600_000), 120);
  timer = focus.startFocusTimer(timer, start + 600_000);
  assert.equal(focus.elapsedFocusSeconds(timer, start + 660_000), 180);
});
test('count-up is capped; rest has a separate id and cycle transitions retain the selected habit', () => {
  const timer = focus.startFocusTimer(focus.createFocusTimer({ mode: 'countup' }), start);
  assert.equal(focus.displayedFocusSeconds(timer, start + 2 * 60_000), 120);
  assert.equal(focus.elapsedFocusSeconds(timer, start + 13 * 3600_000), 43200);
  const original = focus.createFocusTimer({ habitId: 'h1', cycles: 2, breakMinutes: 5 });
  const rest = focus.nextFocusPhase(original);
  assert.notEqual(original.id, rest.id);
  assert.equal(rest.phase, 'rest'); assert.equal(rest.duration, 300); assert.equal(rest.habitId, 'h1');
  const second = focus.nextFocusPhase(rest);
  assert.equal(second.phase, 'focus'); assert.equal(second.cycle, 2);
  assert.equal(focus.nextFocusPhase(focus.nextFocusPhase(second)).cycle, 1);
});
test('corrupted timer snapshots reject rather than overwrite a pending record', () => {
  const timer = focus.createFocusTimer();
  assert.equal(focus.restoreFocusTimer({ ...timer, elapsed: NaN }), null);
  assert.equal(focus.restoreFocusTimer({ ...timer, mode: 'unknown' }), null);
  assert.equal(focus.restoreFocusTimer({ ...timer, status: 'running', startedAt: null }), null);
  assert.equal(focus.restoreFocusTimer({ ...timer, completedAt: 'now' }), null);
});
test('habit reminders obey interval/weekdays/end dates and remove already-completed dates', () => {
  const now = new Date(2026, 9, 19, 9);
  const habit = { id: 'h1', title: '阅读', archived: false, startDate: '2026-10-19', endDate: '2026-10-23', weekdays: [1, 2, 3, 4, 5], everyNDays: 2, reminderTime: '10:00', mode: 'minutes', target: 20, unit: '分钟' };
  let state = { ...daily.emptyDailyData(), habits: [habit] };
  let jobs = notifications.planHabitNotifications(state, now);
  assert.deepEqual(jobs.map((job) => daily.localDateKey(job.date)), ['2026-10-19', '2026-10-21', '2026-10-23']);
  state.logs = [{ habitId: 'h1', date: '2026-10-19', value: 20 }];
  jobs = notifications.planHabitNotifications(state, now);
  assert.equal(jobs.length, 2);
  assert.ok(jobs.every((job) => job.id.startsWith('campusflow.habit.')));
  assert.equal(notifications.planHabitNotifications({ ...state, habits: [{ ...habit, archived: true }] }, now).length, 0);
});
test('large habit lists cap the nearest reminders and never include a passed local time', () => {
  const base = { title: '阅读', archived: false, startDate: '2026-10-19', weekdays: [1, 2, 3, 4, 5, 6, 7], everyNDays: 1, reminderTime: '10:00', mode: 'check', target: 1, unit: '次' };
  const data = { ...daily.emptyDailyData(), habits: Array.from({ length: 80 }, (_, index) => ({ ...base, id: `h-${index}` })) };
  const now = new Date(2026, 9, 19, 11);
  const jobs = notifications.planHabitNotifications(data, now);
  assert.equal(jobs.length, 40);
  assert.ok(jobs.every((job) => job.date.getTime() > now.getTime()));
});
