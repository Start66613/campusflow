import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const source = readFileSync(join(process.cwd(), file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}

const daily = load('src/daily.ts');
const seed = load('src/seed.ts', { './daily': daily });
const migration = load('src/data-migration.ts', { './daily': daily, './seed': seed });
const backup = load('src/backup.ts', { './daily': daily, './data-migration': migration, 'expo-document-picker': {}, 'expo-file-system': {}, 'expo-sharing': {} });
const dispatched = [];
const effects = [];
const persistence = load('src/store-persistence.ts');
const react = {
  createContext: () => ({ Provider: {} }), useCallback: (fn) => fn, useContext: () => null, useEffect: (effect) => effects.push(effect),
  useMemo: (fn) => fn(), useReducer: (_, value) => [structuredClone(value), (action) => dispatched.push(action)],
  useRef: (value) => ({ current: value }), useState: (value) => [value, () => undefined],
};
const store = load('src/store.tsx', {
  './daily': daily, './seed': seed, './data-migration': migration, './widget': { updateNextClassWidget: () => undefined },
  './store-persistence': persistence,
  '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => undefined }, react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
});
const now = '2026-10-19T12:00:00.000Z';
const habit = (patch = {}) => ({ id: 'h1', title: '读书', icon: 'book', color: '#665BE8', category: '学习', mode: 'check', target: 1, unit: '次', weekdays: [1, 2, 3, 4, 5, 6, 7], everyNDays: 1, period: 'any', startDate: '2026-10-12', important: false, archived: false, createdAt: now, order: 0, ...patch });
const data = (...habits) => ({ ...daily.emptyDailyData(), habits });
const app = (dailyData) => ({ ...structuredClone(seed.initialData), daily: dailyData });
const check = (value, id, date, amount = 1) => daily.setDailyHabitProgress(value, id, date, amount, undefined, now);

test('local calendar date validation, leap days and DST shifts are exact', () => {
  assert.equal(daily.dateFromKey('2025-02-29'), null);
  assert.equal(daily.dateFromKey('2026-04-31'), null);
  assert.equal(daily.dateFromKey('2026-2-1'), null);
  assert.equal(daily.shiftDateKey('2024-02-28', 1), '2024-02-29');
  assert.equal(daily.shiftDateKey('2024-02-29', 1), '2024-03-01');
  assert.equal(daily.shiftDateKey('2026-03-07', 2), '2026-03-09');
  assert.equal(daily.shiftDateKey('2026-10-31', 2), '2026-11-02');
  const local = new Date(2026, 9, 19, 0, 5);
  assert.equal(daily.localDateKey(local), '2026-10-19');
});

test('weekend and interval schedules combine, anchored at start and bounded by end', () => {
  const weekend = habit({ weekdays: [6, 7] });
  assert.equal(daily.isHabitDue(weekend, '2026-10-17'), true);
  assert.equal(daily.isHabitDue(weekend, '2026-10-19'), false);
  const interval = habit({ weekdays: [1, 2, 3, 4, 5], everyNDays: 2, endDate: '2026-10-16' });
  assert.equal(daily.isHabitDue(interval, '2026-10-12'), true);
  assert.equal(daily.isHabitDue(interval, '2026-10-13'), false);
  assert.equal(daily.isHabitDue(interval, '2026-10-14'), true);
  assert.equal(daily.isHabitDue(interval, '2026-10-17'), false);
  assert.equal(daily.isHabitDue(interval, '2026-10-20'), false);
  assert.equal(daily.isHabitDue(interval, '2026-10-10'), false);
});

test('check-in awards once even after decrement and redo; day card unlocks only all due complete', () => {
  let value = data(habit(), habit({ id: 'h2', mode: 'count', target: 3 }));
  value = check(value, 'h1', '2026-10-19');
  assert.equal(daily.dailyBalance(value), 5);
  assert.equal(value.cards.length, 0);
  value = check(value, 'h1', '2026-10-19', 0);
  value = check(value, 'h1', '2026-10-19');
  value = check(value, 'h1', '2026-10-19');
  value = check(value, 'h2', '2026-10-19', 2);
  assert.equal(daily.dailyBalance(value), 5);
  assert.equal(daily.dailySummary(value, '2026-10-19').rate, 0.5);
  value = check(value, 'h2', '2026-10-19', 3);
  value = check(value, 'h2', '2026-10-19', 4);
  assert.equal(daily.dailyBalance(value), 10);
  assert.equal(value.cards.length, 1);
  assert.equal(value.logs.length, 2);
  daily.assertDailyData(value);
});

test('future / invalid / unscheduled check-ins rejected, past supplement allowed', () => {
  const value = data(habit({ weekdays: [1, 2, 3, 4, 5] }));
  for (const [date, amount] of [['2026-10-20', 1], ['2026-10-17', 1], ['2026-02-30', 1], ['2026-10-19', NaN], ['2026-10-19', -1]]) {
    assert.equal(check(value, 'h1', date, amount), value);
  }
  const supplemented = check(value, 'h1', '2026-10-16');
  assert.equal(daily.dailyBalance(supplemented), 5);
  assert.equal(daily.habitProgress(supplemented, 'h1', '2026-10-16'), 1);
});

test('rest days do not break scheduled streak and pending today does not erase prior streak', () => {
  const item = habit({ startDate: '2026-10-15', weekdays: [1, 2, 3, 4, 5] });
  let value = check(data(item), 'h1', '2026-10-15');
  value = check(value, 'h1', '2026-10-16');
  assert.deepEqual(daily.habitStats(value, item, '2026-10-19'), { currentStreak: 2, longestStreak: 2, completedDays: 2, completionRate: 2 / 3 });
  assert.equal(daily.habitStats(value, item, '2026-10-20').currentStreak, 0);
});

test('archive and AI undo retain history/earned points, empty created habit can be undone', () => {
  let state = app(check(data(habit(), habit({ id: 'empty' })), 'h1', '2026-10-19'));
  state = store.appReducer(state, { type: 'archiveHabit', id: 'h1', archived: true, date: '2026-10-19' });
  assert.equal(daily.dailySummary(state.daily, '2026-10-19').total, 1);
  assert.equal(state.daily.logs.length, 1);
  assert.equal(daily.dailyBalance(state.daily), 5);
  state = store.appReducer(state, { type: 'undoCreated', records: [{ kind: 'habit', id: 'h1' }, { kind: 'habit', id: 'empty' }] });
  assert.equal(state.daily.habits.length, 1);
  assert.equal(state.daily.habits[0].archived, true);
  daily.assertDailyData(state.daily);
});

test('focus session retry is idempotent and linked minute habit logs once', () => {
  let state = app(data(habit({ mode: 'minutes', target: 25, unit: '分钟' })));
  const action = { type: 'addFocusSession', session: { id: 'stable-focus-session', minutes: 25, completedAt: now, habitId: 'h1', source: 'timer' } };
  state = store.appReducer(state, action);
  state = store.appReducer(state, action);
  assert.equal(state.focusSessions.length, 1);
  assert.equal(state.focusMinutesThisWeek, 25);
  assert.equal(daily.habitProgress(state.daily, 'h1', daily.localDateKey(new Date(now))), 25);
  assert.equal(daily.dailyBalance(state.daily), 5);
});

test('reward reducer prevents overspending, keeps redemption snapshot after reward deletion', () => {
  let state = app(check(data(habit()), 'h1', '2026-10-19'));
  state = store.appReducer(state, { type: 'saveDailyReward', reward: { id: 'r1', title: '一杯茶', cost: 5, createdAt: now } });
  state = store.appReducer(state, { type: 'redeemDailyReward', id: 'r1', redemptionId: 'once', now });
  const redeemed = state;
  state = store.appReducer(state, { type: 'redeemDailyReward', id: 'r1', redemptionId: 'twice', now });
  assert.equal(state, redeemed);
  assert.equal(daily.dailyBalance(state.daily), 0);
  state = store.appReducer(state, { type: 'deleteDailyReward', id: 'r1' });
  assert.equal(state.daily.redemptions[0].title, '一杯茶');
  daily.assertDailyData(state.daily);
});

test('store methods reserve points synchronously before a React render', async () => {
  const context = store.AppProvider({ children: null }).props.value;
  assert.throws(() => context.saveDailyReward({ title: '未加载', cost: 5 }), /尚未读取/);
  effects.splice(0).forEach((effect) => effect());
  await context.retryStorage();
  const today = daily.localDateKey();
  context.saveHabit({ ...habit({ startDate: today }), id: 'h1' });
  context.setHabitProgress('h1', today, 1);
  const reward = context.saveDailyReward({ title: '休息一下', cost: 5 });
  assert.equal(context.redeemDailyReward(reward), true);
  assert.equal(context.redeemDailyReward(reward), false);
});

test('v2 migration preserves courses and all records while adding empty daily data', () => {
  const source = structuredClone(seed.legacyDemoData);
  delete source.daily;
  const hydrated = migration.hydrateStoredData(source);
  assert.equal(hydrated.courses.length, source.courses.length);
  assert.deepEqual(hydrated.tasks, source.tasks);
  assert.deepEqual(hydrated.daily, daily.emptyDailyData());
  assert.throws(() => migration.hydrateStoredData({ ...source, schemaVersion: 3 }), /更新版本/);
});

test('daily backup roundtrip and strict rejection of malformed or duplicate new data', () => {
  const state = app(check(data(habit()), 'h1', '2026-10-19'));
  const roundtrip = backup.parseBackup(backup.serializeBackup(state));
  assert.deepEqual(roundtrip.daily, state.daily);
  for (const change of [
    (next) => { next.daily.logs[0].value = -5; },
    (next) => { next.daily.logs[0].date = '2026-02-30'; },
    (next) => { next.daily.points.push({ ...next.daily.points[0], id: 'duplicate-source' }); },
    (next) => { next.daily.habits[0].weekdays = [8]; },
    (next) => { next.daily.habits[0].target = 0; },
    (next) => { next.daily.cards[0].note = 2; },
    (next) => { delete next.daily.notes; },
    (next) => { next.focusSessions = [{ id: 'f1', minutes: 25, completedAt: now, source: 'nonsense' }]; },
    (next) => { next.schemaVersion = 3; },
  ]) {
    const invalid = structuredClone(state); change(invalid);
    assert.throws(() => backup.parseBackup(backup.serializeBackup(invalid)));
  }
});

test('task completion timestamp toggles and editing keeps unrelated records', () => {
  let state = { ...app(daily.emptyDailyData()), tasks: [{ id: 't1', title: '复习', dueAt: now, source: 'manual', completed: false }] };
  state = store.appReducer(state, { type: 'toggleTask', id: 't1', now });
  assert.equal(state.tasks[0].completedAt, now);
  state = store.appReducer(state, { type: 'toggleTask', id: 't1', now });
  assert.equal(state.tasks[0].completedAt, undefined);
});

test('editing targets and archiving do not rewrite earlier scheduled completions', () => {
  const original = habit({ mode: 'minutes', target: 20, unit: '分钟' });
  let state = app(check(data(original), 'h1', '2026-10-18', 20));
  state = store.appReducer(state, { type: 'saveHabit', habit: { ...original, target: 40 }, date: '2026-10-19' });
  assert.equal(daily.dailySummary(state.daily, '2026-10-18').completed, 1);
  assert.equal(daily.dailySummary(state.daily, '2026-10-19').due[0].target, 40);
  state = store.appReducer(state, { type: 'archiveHabit', id: 'h1', archived: true, date: '2026-10-19' });
  assert.equal(daily.dailySummary(state.daily, '2026-10-18').total, 1);
  assert.equal(daily.dailySummary(state.daily, '2026-10-19').total, 0);
  daily.assertDailyData(state.daily);
});

test('several edits on one day retain the original pre-edit plan; future edits retain each earlier version', () => {
  const original = habit({ mode: 'minutes', target: 10 });
  let revised = daily.reviseHabit(original, { ...original, target: 20 }, '2026-10-18');
  revised = daily.reviseHabit(revised, { ...revised, target: 30 }, '2026-10-18');
  revised = daily.reviseHabit(revised, { ...revised, target: 40 }, '2026-10-19');
  assert.equal(daily.habitOnDate(revised, '2026-10-17').target, 10);
  assert.equal(daily.habitOnDate(revised, '2026-10-18').target, 30);
  assert.equal(daily.habitOnDate(revised, '2026-10-19').target, 40);
  const shortened = daily.reviseHabit(original, { ...original, endDate: '2026-10-16' }, '2026-10-19');
  const persisted = JSON.parse(JSON.stringify(shortened));
  assert.equal(daily.isHabitDue(persisted, '2026-10-18'), true);
});

test('ordered storage preserves latest save and recovers after a rejected write', async () => {
  const queue = persistence.createStorageQueue();
  const order = [];
  const first = queue.run(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); order.push('older'); });
  const failed = queue.run(async () => { throw new Error('disk-full'); });
  const failure = assert.rejects(failed, /disk-full/);
  const latest = queue.run(async () => order.push('latest'));
  await Promise.all([first, failure, latest]);
  assert.deepEqual(order, ['older', 'latest']);
});
