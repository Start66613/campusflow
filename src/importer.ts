import { courseColors } from './theme';
import type { Course, CourseType } from './types';

const aliases: Record<string, CourseType> = { 专业课: 'major', 公共课: 'general', 实验: 'lab', 选修课: 'elective' };

export function parseCourseCsv(input: string): Course[] {
  const rows = input.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).map((row) => row.split(',').map((cell) => cell.trim()));
  if (rows.length < 2) throw new Error('CSV 中没有课程数据');
  const header = rows[0];
  const get = (row: string[], name: string) => row[header.indexOf(name)] ?? '';
  const courses = rows.slice(1).map((row, index) => {
    const weekdayText = get(row, '星期') || get(row, 'weekday');
    const weekday = Number(weekdayText.replace(/[^1-7]/g, '')) || '一二三四五六日'.indexOf(weekdayText.replace(/[周星期]/g, '')) + 1;
    const weeksText = get(row, '周次') || get(row, 'weeks') || '1-18';
    const range = weeksText.match(/(\d+)\s*-\s*(\d+)/);
    const weeks = range
      ? Array.from({ length: Number(range[2]) - Number(range[1]) + 1 }, (_, offset) => Number(range[1]) + offset)
      : weeksText.split(/[、;；\s]+/).map(Number).filter(Boolean);
    const typeText = get(row, '类型') || '专业课';
    return {
      id: `import-${Date.now()}-${index}`,
      name: get(row, '课程') || get(row, 'name') || `课程 ${index + 1}`,
      teacher: get(row, '老师') || get(row, 'teacher'),
      location: get(row, '教室') || get(row, 'location'),
      weekday,
      startPeriod: Number(get(row, '开始节次') || get(row, 'startPeriod') || 1),
      endPeriod: Number(get(row, '结束节次') || get(row, 'endPeriod') || 2),
      startTime: get(row, '开始时间') || get(row, 'startTime') || '08:00',
      endTime: get(row, '结束时间') || get(row, 'endTime') || '09:40',
      weeks,
      color: courseColors[index % courseColors.length],
      type: aliases[typeText] || 'major',
    } satisfies Course;
  });
  if (courses.some((course) => course.weekday < 1 || course.weekday > 7)) throw new Error('CSV 的“星期”列无法识别');
  return courses;
}
