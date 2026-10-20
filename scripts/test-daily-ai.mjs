import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}
const dailyHelpers = load('src/daily.ts');
const dailyAI = load('src/daily-ai.ts', { './daily': dailyHelpers });
const assistant = load('src/assistant.ts', {
  './ai-config': { getAIConfig: async () => ({ apiKey: '', model: 'test-model' }) },
  './periods': { periodStarts: [], periodEnds: [] },
  './theme': { courseColors: ['#655CE8'] },
  './daily-ai': dailyAI,
});
const now = new Date(2026, 9, 20, 14, 0);
const baseline = {
  title: '阅读', mode: 'minutes', target: 20, unit: '分钟',
  weekdays: [1, 2, 3, 4, 5, 6, 7], everyNDays: 1,
  startDate: '2026-10-14', period: 'any', category: '学习',
};
const habit = (patch = {}) => ({
  ...dailyAI.sanitizeAIHabit(baseline), id: 'h1', order: 0,
  createdAt: '2026-10-14T06:00:00.000Z', ...patch,
});
const daily = (habits = [habit()], logs = []) => ({
  habits, logs, notes: [{ title: '秘密标题', body: '私密日记正文', mood: 1 }],
  cards: [{ note: '秘密照片路径' }], rewards: [], redemptions: [], points: [],
});

test('daily, weekday, listed weekdays and intervals preserve intended frequency', () => {
  const reader = dailyAI.parseLocalHabit('每天阅读20分钟', now).habit;
  assert.equal(reader.title, '阅读');
  assert.equal(reader.target, 20);
  assert.equal(reader.startDate, '2026-10-20');
  assert.equal(reader.mode, 'minutes');
  assert.deepEqual(dailyAI.parseLocalHabit('工作日背单词30个', now).habit.weekdays, [1, 2, 3, 4, 5]);
  assert.deepEqual(dailyAI.parseLocalHabit('每周一三五跑步', now).habit.weekdays, [1, 3, 5]);
  assert.deepEqual(dailyAI.parseLocalHabit('周末整理书桌', now).habit.weekdays, [6, 7]);
  assert.equal(dailyAI.parseLocalHabit('每3天整理书桌', now).habit.everyNDays, 3);
  assert.equal(dailyAI.parseLocalHabit('每天阅读1.5小时', now).habit.target, 90);
});

test('a configured legacy proxy cannot turn an offline recurring habit into a one-off event', async () => {
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousFetch = globalThis.fetch;
  let calls = 0;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.invalid';
    globalThis.fetch = async () => { calls++; throw new Error('unexpected-network-call'); };
    const legacyAssistant = load('src/assistant.ts', {
      './ai-config': { getAIConfig: async () => ({ apiKey: '', model: 'test-model' }) },
      './periods': { periodStarts: [], periodEnds: [] }, './theme': { courseColors: ['#655CE8'] }, './daily-ai': dailyAI,
    });
    const result = await legacyAssistant.parseAssistantInput('工作日背单词30个');
    assert.equal(result.commands[0].type, 'habit');
    assert.equal(result.usedAI, false);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previousUrl;
  }
});

test('absolute and relative dates use calendar dates and reject impossible ranges', () => {
  const result = dailyAI.parseLocalHabit('从2026-10-20到2026-11-20每天阅读20分钟', now);
  assert.equal(result.habit.endDate, '2026-11-20');
  assert.equal(dailyAI.parseLocalHabit('从明天开始每天阅读20分钟', now).habit.startDate, '2026-10-21');
  assert.equal(dailyAI.parseLocalHabit('2026-10-23开始每周五阅读20分钟', now).habit.startDate, '2026-10-23');
  for (const text of ['从2026-02-30开始每天阅读', '从2026-11-20到2026-10-20每天阅读', '明天每天阅读', '每天阅读到下周']) {
    assert.equal(dailyAI.parseLocalHabit(text, now).habit, undefined, text);
  }
});

test('reminders require explicit intent and valid local clock', () => {
  assert.equal(dailyAI.parseLocalHabit('每天20:00提醒我阅读20分钟', now).habit.reminderTime, '20:00');
  assert.equal(dailyAI.parseLocalHabit('每天晚上8点提醒我阅读20分钟', now).habit.reminderTime, '20:00');
  assert.equal(dailyAI.parseLocalHabit('每天25:00提醒我阅读20分钟', now).habit, undefined);
  assert.equal(dailyAI.parseLocalHabit('每天20:00阅读20分钟', now).habit, undefined);
  assert.equal(dailyAI.parseLocalHabit('每天阅读20分钟', now).habit.reminderTime, undefined);
});

test('unclear recurrence never degrades into a one-off task or event', () => {
  for (const text of ['每周阅读', '每月阅读', '每隔两天跑步', '每周两次跑步', '每天阅读并且跑步', '每天阅读20分钟，跑步30分钟', '删除每天阅读习惯', '每天消费20元', '每天周末阅读']) {
    assert.equal(dailyAI.parseLocalHabit(text, now).recognized, true, text);
    assert.equal(dailyAI.parseLocalHabit(text, now).habit, undefined, text);
    assert.deepEqual(assistant.parseLocally(text), [], text);
  }
  assert.equal(assistant.parseLocally('午饭花了25元')[0].type, 'expense');
  assert.equal(assistant.parseLocally('每天阅读20分钟')[0].type, 'habit');
});

test('untrusted AI habit fields cannot modify identity, history, rewards or archive', () => {
  const sanitized = dailyAI.sanitizeAIHabit({ ...baseline, id: 'existing', order: 99, archived: true, points: 999, createdAt: 'old', logs: [{}] });
  assert.equal(sanitized.id, undefined);
  assert.equal(sanitized.order, undefined);
  assert.equal(sanitized.points, undefined);
  assert.equal(sanitized.logs, undefined);
  assert.equal(sanitized.archived, false);
  assert.deepEqual(assistant.sanitizeCommands([{ type: 'deleteHabit', id: 'existing' }]), []);
  assert.equal(assistant.sanitizeCommands([{ type: 'habit', habit: { ...baseline, id: 'existing' } }])[0].habit.id, undefined);
});

test('AI goals and scheduling data are strictly typed and bounded', () => {
  for (const patch of [
    { target: '20' }, { target: 0 }, { target: Infinity }, { target: 1500 },
    { weekdays: [] }, { weekdays: [0] }, { weekdays: ['1'] }, { everyNDays: 0 },
    { everyNDays: 1.5 }, { startDate: '2026-02-30' }, { endDate: '2026-01-01' },
    { reminderTime: '24:00' }, { mode: 'invalid' }, { title: '' },
    { mode: 'check', target: 2 },
  ]) assert.equal(dailyAI.sanitizeAIHabit({ ...baseline, ...patch }), null, JSON.stringify(patch));
});

test('duplicates compare behavior while allowing deliberate different schedules', () => {
  assert.equal(dailyAI.habitIdentity(habit()), dailyAI.habitIdentity(habit({ title: ' 阅 读 ', color: '#000000' })));
  assert.notEqual(dailyAI.habitIdentity(habit()), dailyAI.habitIdentity(habit({ reminderTime: '20:00' })));
  assert.notEqual(dailyAI.habitIdentity(habit()), dailyAI.habitIdentity(habit({ startDate: '2026-10-21' })));
});

test('review counts only scheduled days and keeps ongoing today separate', () => {
  const snapshot = dailyAI.buildDailyReviewSnapshot(daily([
    habit({ startDate: '2026-10-19', weekdays: [1, 3, 5] }),
    habit({ id: 'archived', archived: true }),
  ], [
    { habitId: 'h1', date: '2026-10-19', value: 20, updatedAt: '2026-10-19T12:00:00Z' },
    { habitId: 'h1', date: '2026-10-19', value: 20, updatedAt: '2026-10-19T13:00:00Z' },
  ]), [], [], now);
  assert.deepEqual(snapshot.totals, { planned: 1, completed: 1, closedDayPlanned: 1, closedDayCompleted: 1 });
  assert.equal(snapshot.from, '2026-10-14');
  assert.equal(snapshot.through, '2026-10-20');
  assert.equal(snapshot.todayIsOngoing, true);
});

test('review excludes future focus and private notes but preserves honest task semantics', () => {
  const snapshot = dailyAI.buildDailyReviewSnapshot(daily([habit()], [
    { habitId: 'h1', date: '2026-10-19', value: 20, note: '私密打卡备注', updatedAt: '2026-10-19T12:00:00Z' },
  ]), [
    { minutes: 25, completedAt: new Date(2026, 9, 19, 12).toISOString() },
    { minutes: 25, completedAt: new Date(2026, 9, 20, 19).toISOString() },
    { minutes: 10, completedAt: 'invalid' },
  ], [
    { title: '隐私待办名', dueAt: new Date(2026, 9, 20, 9).toISOString(), completed: true },
  ], now);
  assert.deepEqual(snapshot.focus, { sessions: 1, minutes: 25 });
  assert.deepEqual(snapshot.tasks, { dueInWindow: 1, currentlyCompleted: 1 });
  const encoded = JSON.stringify(snapshot);
  for (const secret of ['秘密', '私密', '隐私', 'h1', 'notes', 'mood', 'photos']) assert.equal(encoded.includes(secret), false, secret);
  assert.ok(dailyAI.localDailyReview(snapshot).observations.some((text) => text.includes('今天')));
});

test('local review is useful without a key or records', () => {
  const snapshot = dailyAI.buildDailyReviewSnapshot(daily([]), [], [], now);
  const review = dailyAI.localDailyReview(snapshot);
  assert.ok(review.observations[0].includes('还没有'));
  assert.ok(review.actions.length > 0);
  assert.equal(dailyAI.sanitizeDailyReview({ observations: [], actions: ['a'] }), null);
});

test('AI request sends aggregate only to configured model, and never receives private diary', async () => {
  const snapshot = dailyAI.buildDailyReviewSnapshot(daily(), [], [], now);
  let request;
  const result = await dailyAI.requestDailyReview(snapshot, { apiKey: 'test-secret', model: 'chosen-model' }, '保持阅读', {
    fetcher: async (url, options) => {
      request = { url, ...options };
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ observations: ['记录还不多'], actions: ['今天读两页'], encouragement: '慢慢来' }) } }] }) };
    },
  });
  assert.equal(request.url, 'https://api.deepseek.com/chat/completions');
  assert.equal(JSON.parse(request.body).model, 'chosen-model');
  for (const secret of ['私密日记正文', '秘密标题', '秘密照片路径']) assert.equal(request.body.includes(secret), false);
  assert.equal(result.actions[0], '今天读两页');
});

test('AI request supports explicit cancellation and bounded waiting', async () => {
  const snapshot = dailyAI.buildDailyReviewSnapshot(daily([]), [], [], now);
  const controller = new AbortController();
  const stalledFetch = (_, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  const request = dailyAI.requestDailyReview(snapshot, { apiKey: 'test', model: 'test' }, '', { signal: controller.signal, fetcher: stalledFetch });
  controller.abort();
  await assert.rejects(request, /取消/);
  await assert.rejects(dailyAI.requestDailyReview(snapshot, { apiKey: 'test', model: 'test' }, '', { timeoutMs: 5, fetcher: stalledFetch }), /停止请求/);
  await assert.rejects(dailyAI.requestDailyReview(snapshot, { apiKey: '', model: 'test' }, '', { fetcher: () => assert.fail('must not request without key') }), /配置/);
});

test('AI errors remain readable and malformed result never becomes a saved record', async () => {
  const snapshot = dailyAI.buildDailyReviewSnapshot(daily([]), [], [], now);
  await assert.rejects(dailyAI.requestDailyReview(snapshot, { apiKey: 'test', model: 'test' }, '', { fetcher: async () => ({ ok: false, status: 401 }) }), /密钥无效/);
  await assert.rejects(dailyAI.requestDailyReview(snapshot, { apiKey: 'test', model: 'test' }, '', { fetcher: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '{broken' } }] }) }) }), /格式不完整/);
});
