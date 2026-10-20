import { initialData, legacyDemoData } from './seed';
import type { AppData, FocusSession } from './types';
import { assertDailyData, emptyDailyData } from './daily';

const sampleIds = {
  courses: new Set(legacyDemoData.courses.map((item) => item.id)),
  tasks: new Set(legacyDemoData.tasks.map((item) => item.id)),
  expenses: new Set(legacyDemoData.expenses.map((item) => item.id)),
  events: new Set(legacyDemoData.events.map((item) => item.id)),
  grades: new Set(legacyDemoData.grades.map((item) => item.id)),
};

export function assertFocusSessions(value: unknown): asserts value is FocusSession[] {
  if (!Array.isArray(value)) throw new Error('专注记录格式不正确');
  const ids = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)
      || typeof item.id !== 'string' || !item.id || ids.has(item.id)
      || !Number.isFinite(item.minutes) || item.minutes <= 0 || item.minutes > 1440
      || typeof item.completedAt !== 'string' || !Number.isFinite(Date.parse(item.completedAt))
      || (item.habitId !== undefined && (typeof item.habitId !== 'string' || !item.habitId))
      || (item.taskId !== undefined && (typeof item.taskId !== 'string' || !item.taskId))
      || (item.note !== undefined && (typeof item.note !== 'string' || item.note.length > 5000))
      || (item.source !== undefined && item.source !== 'timer' && item.source !== 'manual')) throw new Error('专注记录不完整、重复或时长无效');
    ids.add(item.id);
  }
}

export function hydrateStoredData(saved: Partial<Omit<AppData, 'schemaVersion'>> & { schemaVersion?: number }): AppData {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('本机数据格式不正确，原数据未修改');
  if (saved.schemaVersion !== undefined && saved.schemaVersion !== 1 && saved.schemaVersion !== 2) throw new Error('此数据来自更新版本，请先升级应用，原数据未修改');
  for (const key of ['courses', 'tasks', 'expenses', 'events', 'grades', 'attendance'] as const) {
    if (saved[key] !== undefined && (!Array.isArray(saved[key]) || !saved[key].every((item) => item && typeof item === 'object' && !Array.isArray(item)))) throw new Error(`本机 ${key} 记录格式不正确，原数据未修改`);
  }
  if (saved.settings !== undefined && (!saved.settings || typeof saved.settings !== 'object' || Array.isArray(saved.settings))) throw new Error('本机设置格式不正确，原数据未修改');
  if (saved.focusMinutesThisWeek !== undefined && (!Number.isFinite(saved.focusMinutesThisWeek) || saved.focusMinutesThisWeek < 0)) throw new Error('专注累计记录无效');
  if (saved.focusSessions !== undefined) assertFocusSessions(saved.focusSessions);
  if (saved.daily !== undefined) assertDailyData(saved.daily);
  const data: AppData = {
    ...initialData,
    ...saved,
    settings: { ...initialData.settings, ...saved.settings },
    focusSessions: Array.isArray(saved.focusSessions) ? saved.focusSessions : [],
    daily: saved.daily ?? emptyDailyData(),
    schemaVersion: 2,
  };
  if (saved.schemaVersion === 2) return data;
  // Preserve edited demo courses; all other known demo IDs were never real
  // imported records. The complete pre-migration JSON is kept separately.
  return {
    ...data,
    courses: data.courses.filter((item) => !sampleIds.courses.has(item.id) || item.customized),
    tasks: data.tasks.filter((item) => !sampleIds.tasks.has(item.id)),
    expenses: data.expenses.filter((item) => !sampleIds.expenses.has(item.id)),
    events: data.events.filter((item) => !sampleIds.events.has(item.id)),
    grades: data.grades.filter((item) => !sampleIds.grades.has(item.id)),
    focusMinutesThisWeek: data.focusMinutesThisWeek === legacyDemoData.focusMinutesThisWeek ? 0 : data.focusMinutesThisWeek,
  };
}
