import { initialData, legacyDemoData } from './seed';
import type { AppData } from './types';

const sampleIds = {
  courses: new Set(legacyDemoData.courses.map((item) => item.id)),
  tasks: new Set(legacyDemoData.tasks.map((item) => item.id)),
  expenses: new Set(legacyDemoData.expenses.map((item) => item.id)),
  events: new Set(legacyDemoData.events.map((item) => item.id)),
  grades: new Set(legacyDemoData.grades.map((item) => item.id)),
};

export function hydrateStoredData(saved: Partial<AppData>): AppData {
  const data: AppData = {
    ...initialData,
    ...saved,
    settings: { ...initialData.settings, ...saved.settings },
    focusSessions: Array.isArray(saved.focusSessions) ? saved.focusSessions : [],
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
