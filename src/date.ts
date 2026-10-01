import type { Course } from './types';

export const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function startOfWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
export function dateForWeekday(weekday: number, base = new Date()) {
  const date = startOfWeek(base);
  date.setDate(date.getDate() + weekday - 1);
  return date;
}

export function formatMonthDay(value: string | Date) {
  const date = new Date(value);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatDateTime(value: string | Date) {
  const date = new Date(value);
  const day = date.getDay() || 7;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[day - 1]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

function timeOnDate(date: Date, value: string) {
  const [hour, minute] = value.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

export function nextCourse(courses: Course[], from = new Date(), termStart?: string) {
  const candidates = courses.flatMap((course) => {
    const occurrences: { course: Course; start: Date; end: Date }[] = [];
    for (let offset = 0; offset < 14; offset += 1) {
      const day = new Date(from);
      day.setDate(day.getDate() + offset);
      if ((day.getDay() || 7) !== course.weekday) continue;
      if (termStart && (day < new Date(`${termStart}T00:00:00`) || !course.weeks.includes(currentWeek(termStart, day)))) continue;
      const start = timeOnDate(day, course.startTime);
      const end = timeOnDate(day, course.endTime);
      if (end >= from) occurrences.push({ course, start, end });
    }
    return occurrences;
  });
  return candidates.sort((a, b) => a.start.getTime() - b.start.getTime())[0];
}

export function currentWeek(termStart: string, now = new Date()) {
  const start = new Date(`${termStart}T00:00:00`);
  const difference = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(difference / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export function relativeDue(value: string) {
  const date = new Date(value);
  const difference = date.getTime() - Date.now();
  const hours = Math.ceil(difference / 3_600_000);
  if (hours < 0) return '已逾期';
  if (hours < 24) return `${hours} 小时后`;
  return `${Math.ceil(hours / 24)} 天后`;
}
