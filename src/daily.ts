import type { DailyData, DailyNoteInput, Habit, HabitInput, HabitSchedule } from './daily-types';

const DAY_MS = 86_400_000;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const text = (value: unknown): value is string => typeof value === 'string';
const timestamp = (value: unknown): value is string => text(value) && value.length > 0 && Number.isFinite(Date.parse(value));
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Parse at local noon so calendar arithmetic survives DST and never uses UTC dates. */
export function dateFromKey(key: string): Date | null {
  const match = DATE.exec(key);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (year < 1900 || year > 9999) return null;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function localDateKey(date = new Date()): string {
  if (!Number.isFinite(date.getTime())) throw new Error('日期无效');
  return `${date.getFullYear().toString().padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftDateKey(key: string, days: number): string {
  const date = dateFromKey(key);
  if (!date || !Number.isInteger(days)) throw new Error('日期无效');
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function calendarDay(key: string): number {
  const date = dateFromKey(key);
  if (!date) return NaN;
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

/** Keep past targets and repetition rules unchanged when today's settings change. */
export function habitOnDate(habit: Habit, dateKey: string): Habit {
  const previous = habit.history?.find((entry) => dateKey < entry.before);
  // JSON omits an undefined endDate; it must not inherit a newer schedule's end date.
  return previous ? { ...habit, ...previous, endDate: previous.endDate } : habit;
}

export function reviseHabit(previous: Habit, next: Habit, effectiveDate: string): Habit {
  const schedule = (value: Habit): HabitSchedule => ({
    mode: value.mode, target: value.target, unit: value.unit, weekdays: [...value.weekdays],
    everyNDays: value.everyNDays, startDate: value.startDate, endDate: value.endDate, archived: value.archived,
  });
  const history = previous.history ?? [];
  if (JSON.stringify(schedule(previous)) === JSON.stringify(schedule(next))) return { ...next, history };
  // Preserve the first pre-edit schedule when editing several times on one day.
  if (history.some((entry) => entry.before === effectiveDate)) return { ...next, history };
  return { ...next, history: [...history, { ...schedule(previous), before: effectiveDate }].sort((a, b) => a.before.localeCompare(b.before)) };
}

export function isHabitDue(current: Habit, dateKey: string): boolean {
  const habit = habitOnDate(current, dateKey);
  const date = dateFromKey(dateKey);
  if (!date || habit.archived || dateKey < habit.startDate || (habit.endDate && dateKey > habit.endDate)) return false;
  const weekday = date.getDay() || 7;
  return habit.weekdays.includes(weekday) && (calendarDay(dateKey) - calendarDay(habit.startDate)) % habit.everyNDays === 0;
}

export function emptyDailyData(): DailyData {
  return { habits: [], logs: [], notes: [], cards: [], rewards: [], redemptions: [], points: [] };
}

export function habitProgress(daily: DailyData, habitId: string, dateKey: string): number {
  return daily.logs.find((log) => log.habitId === habitId && log.date === dateKey)?.value ?? 0;
}

export function dailySummary(daily: DailyData, dateKey: string) {
  const due = daily.habits.filter((habit) => isHabitDue(habit, dateKey)).map((habit) => habitOnDate(habit, dateKey)).sort((a, b) => a.order - b.order);
  const completed = due.filter((habit) => habitProgress(daily, habit.id, dateKey) >= habit.target).length;
  return { due, completed, total: due.length, rate: due.length ? completed / due.length : 0 };
}

/** Streaks count scheduled days, so a rest day never breaks a streak. Today can still be pending. */
export function habitStats(daily: DailyData, habit: Habit, todayKey = localDateKey()) {
  const start = [habit.startDate, ...(habit.history ?? []).map((entry) => entry.startDate)].sort()[0];
  if (!dateFromKey(todayKey) || !dateFromKey(start) || start > todayKey) return { currentStreak: 0, longestStreak: 0, completedDays: 0, completionRate: 0 };
  const progress = new Map(daily.logs.filter((log) => log.habitId === habit.id).map((log) => [log.date, log.value]));
  let currentStreak = 0; let longestStreak = 0; let completedDays = 0; let dueDays = 0;
  for (let key = start; key <= todayKey; key = shiftDateKey(key, 1)) {
    if (!isHabitDue(habit, key)) continue;
    const scheduled = habitOnDate(habit, key);
    dueDays += 1;
    if ((progress.get(key) ?? 0) >= scheduled.target) {
      completedDays += 1; currentStreak += 1; longestStreak = Math.max(longestStreak, currentStreak);
    } else if (key !== todayKey) currentStreak = 0;
  }
  return { currentStreak, longestStreak, completedDays, completionRate: dueDays ? completedDays / dueDays : 0 };
}

export function dailyBalance(daily: DailyData): number {
  return daily.points.reduce((sum, entry) => sum + entry.points, 0) - daily.redemptions.reduce((sum, entry) => sum + entry.cost, 0);
}

export function validateHabitInput(input: HabitInput): void {
  if (!text(input.title) || !input.title.trim() || input.title.length > 120 || !text(input.icon) || input.icon.length > 80 || !/^#[\da-f]{6}$/i.test(input.color)
    || !text(input.category) || input.category.length > 80 || !['check', 'count', 'minutes'].includes(input.mode)
    || !finite(input.target) || input.target <= 0 || input.target > 1_000_000 || (input.mode === 'check' && input.target !== 1)
    || !text(input.unit) || input.unit.length > 30 || !Array.isArray(input.weekdays) || !input.weekdays.length
    || input.weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7) || new Set(input.weekdays).size !== input.weekdays.length
    || !Number.isInteger(input.everyNDays) || input.everyNDays < 1 || input.everyNDays > 365
    || !['any', 'morning', 'afternoon', 'evening'].includes(input.period) || !dateFromKey(input.startDate)
    || (input.endDate !== undefined && (!dateFromKey(input.endDate) || input.endDate < input.startDate))
    || (input.reminderTime !== undefined && !TIME.test(input.reminderTime)) || typeof input.important !== 'boolean' || typeof input.archived !== 'boolean'
    || (input.id !== undefined && (!text(input.id) || !input.id)) || (input.order !== undefined && (!Number.isInteger(input.order) || input.order < 0))) {
    throw new Error('习惯设置不完整，请检查日期、目标和重复周期');
  }
}

export function validateDailyNote(input: DailyNoteInput): void {
  if (!dateFromKey(input.date) || !text(input.title) || input.title.length > 120 || !text(input.body) || input.body.length > 20_000
    || !Number.isInteger(input.mood) || input.mood < 1 || input.mood > 5 || (input.id !== undefined && (!text(input.id) || !input.id))) throw new Error('日记格式不正确');
}

/** Pure mutation: an earned point entry is immutable even after undoing a check-in. */
export function setDailyHabitProgress(daily: DailyData, id: string, date: string, value: number, note: string | undefined, now: string): DailyData {
  const current = daily.habits.find((item) => item.id === id);
  const habit = current ? habitOnDate(current, date) : undefined;
  const today = localDateKey(new Date(now));
  if (!habit || !dateFromKey(date) || date > today || !isHabitDue(habit, date) || !finite(value) || value < 0 || value > 1_000_000
    || (note !== undefined && (!text(note) || note.length > 5000))) return daily;
  const old = daily.logs.find((item) => item.habitId === id && item.date === date);
  const normalized = habit.mode === 'check' ? Math.min(1, value) : value;
  const log = { id: old?.id ?? `log:${id}:${date}`, habitId: id, date, value: normalized, note: note ?? old?.note ?? '', updatedAt: now };
  let next = { ...daily, logs: old ? daily.logs.map((item) => item.id === old.id ? log : item) : [...daily.logs, log] };
  const sourceKey = `habit:${id}:${date}`;
  if (normalized >= habit.target && !daily.points.some((entry) => entry.sourceKey === sourceKey)) {
    next = { ...next, points: [...daily.points, { id: `point:${id}:${date}`, sourceKey, points: 5, createdAt: now }] };
  }
  const summary = dailySummary(next, date);
  if (summary.total > 0 && summary.completed === summary.total && !next.cards.some((card) => card.date === date)) {
    next = { ...next, cards: [...next.cards, { date, note: '', earnedAt: now }] };
  }
  return next;
}

/** Reject damaged new fields instead of silently dropping journals, rewards or history. */
export function assertDailyData(value: unknown): asserts value is DailyData {
  if (!object(value)) throw new Error('日常数据格式不正确');
  for (const key of ['habits', 'logs', 'notes', 'cards', 'rewards', 'redemptions', 'points']) {
    if (!Array.isArray(value[key]) || !(value[key] as unknown[]).every(object)) throw new Error(`日常 ${key} 记录格式不正确`);
  }
  const daily = value as unknown as DailyData;
  const seen = (items: { id: string }[]) => items.every((item) => text(item.id) && item.id.length > 0) && new Set(items.map((item) => item.id)).size === items.length;
  for (const items of [daily.habits, daily.logs, daily.notes, daily.rewards, daily.redemptions, daily.points]) if (!seen(items)) throw new Error('日常数据存在缺失或重复编号');
  for (const habit of daily.habits) {
    validateHabitInput(habit);
    if (!timestamp(habit.createdAt) || !Number.isInteger(habit.order) || habit.order < 0) throw new Error('习惯记录不完整');
    if (habit.history !== undefined) {
      if (!Array.isArray(habit.history)) throw new Error('习惯历史格式不正确');
      let last = '';
      for (const entry of habit.history) {
        if (!object(entry) || !dateFromKey(entry.before) || entry.before <= last) throw new Error('习惯历史日期无效或重复');
        for (const key of ['mode', 'target', 'unit', 'weekdays', 'everyNDays', 'startDate', 'archived']) if (!(key in entry)) throw new Error('习惯历史设置不完整');
        validateHabitInput({ ...habit, ...entry });
        last = entry.before;
      }
    }
  }
  const habits = new Set(daily.habits.map((habit) => habit.id));
  const logKeys = new Set<string>();
  for (const log of daily.logs) {
    const key = `${log.habitId}|${log.date}`;
    if (!habits.has(log.habitId) || !dateFromKey(log.date) || !finite(log.value) || log.value < 0 || log.value > 1_000_000 || !text(log.note) || log.note.length > 5000 || !timestamp(log.updatedAt) || logKeys.has(key)) throw new Error('打卡记录不完整或重复');
    logKeys.add(key);
  }
  for (const note of daily.notes) {
    validateDailyNote(note);
    if (!timestamp(note.createdAt) || !timestamp(note.updatedAt)) throw new Error('日记时间无效');
  }
  const cardDates = new Set<string>();
  for (const card of daily.cards) {
    if (!dateFromKey(card.date) || !text(card.note) || card.note.length > 5000 || !timestamp(card.earnedAt) || cardDates.has(card.date)) throw new Error('日签记录不完整或重复');
    cardDates.add(card.date);
  }
  for (const reward of [...daily.rewards, ...daily.redemptions]) {
    if (!text(reward.title) || !reward.title.trim() || reward.title.length > 120 || !Number.isInteger(reward.cost) || reward.cost < 1 || reward.cost > 1_000_000 || !timestamp(reward.createdAt)) throw new Error('奖励记录不完整');
  }
  if (daily.redemptions.some((item) => !text(item.rewardId) || !item.rewardId)) throw new Error('兑换记录缺少奖励编号');
  const pointKeys = new Set<string>();
  for (const entry of daily.points) {
    const match = /^habit:(.+):(\d{4}-\d{2}-\d{2})$/.exec(entry.sourceKey);
    if (!match || !habits.has(match[1]) || !dateFromKey(match[2]) || entry.points !== 5 || !timestamp(entry.createdAt) || pointKeys.has(entry.sourceKey)) throw new Error('积分记录不完整或重复');
    pointKeys.add(entry.sourceKey);
  }
  if (dailyBalance(daily) < 0) throw new Error('奖励余额不能为负数');
}
