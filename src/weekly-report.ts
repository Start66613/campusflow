import { startOfWeek } from './date';
import type { AppData } from './types';

function inRange(value: string, from: number, until: number) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= from && time < until;
}

export function summarizeWeek(data: AppData, now = new Date()) {
  const start = startOfWeek(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const from = start.getTime();
  const until = end.getTime();
  const expenses = data.expenses.filter((item) => inRange(item.occurredAt, from, until));
  const dueTasks = data.tasks.filter((item) => inRange(item.dueAt, from, until));
  const focusSessions = data.focusSessions.filter((item) => inRange(item.completedAt, from, until));
  const attendance = data.attendance.filter((item) => inRange(item.date, from, until));
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const focusMinutes = focusSessions.reduce((sum, item) => sum + item.minutes, 0);
  const completedTasks = dueTasks.filter((item) => item.completed).length;
  const attendedClasses = attendance.filter((item) => item.status !== 'absent').length;
  const categories = Object.entries(expenses.reduce<Record<string, number>>((totals, item) => {
    totals[item.category] = (totals[item.category] ?? 0) + item.amount;
    return totals;
  }, {})).sort((a, b) => b[1] - a[1]);
  return {
    start, end, expenses, expenseTotal, dueTasks, completedTasks, focusSessions, focusMinutes,
    attendance, attendedClasses, categories,
    hasRecords: expenses.length > 0 || dueTasks.length > 0 || focusSessions.length > 0 || attendance.length > 0,
  };
}
