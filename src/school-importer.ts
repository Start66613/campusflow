import { courseColors } from './theme';
import { classifyGradeNature, xtuGradePoint } from './grades';
import type { Course, CourseType, Grade } from './types';

export type SchoolPageSnapshot = {
  url: string;
  title: string;
  tables: { headers: string[]; rows: string[][] }[];
  scheduleCells: { id: string; text: string; rowSpan: number }[];
};

export type ZfRow = Record<string, unknown>;

const periodTimes: Record<number, [string, string]> = {
  1: ['08:00', '08:45'], 2: ['08:55', '09:40'], 3: ['10:10', '10:55'], 4: ['11:05', '11:50'],
  5: ['14:00', '14:45'], 6: ['14:55', '15:40'], 7: ['16:10', '16:55'], 8: ['17:05', '17:50'],
  9: ['19:00', '19:45'], 10: ['19:55', '20:40'], 11: ['20:50', '21:35'], 12: ['21:45', '22:30'],
};

function clean(value: unknown = '') {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/^[-–—·]+|[-–—·]+$/g, '').trim();
}

function field(row: ZfRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && clean(value)) return clean(value);
  }
  return '';
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function findColumn(headers: string[], patterns: RegExp[]) {
  return headers.findIndex((header) => patterns.some((pattern) => pattern.test(clean(header))));
}

function parseNumber(value: unknown) {
  const match = clean(value).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function scoreNumber(value: unknown) {
  const text = clean(value);
  const aliases: Record<string, number> = { 优秀: 95, 良好: 85, 中等: 75, 及格: 65, 合格: 80, 不及格: 50, 不合格: 50 };
  return aliases[text] ?? parseNumber(text);
}

function parseWeeks(text: string) {
  const oddOnly = /单/.test(text) && !/单双/.test(text);
  const evenOnly = /双/.test(text) && !/单双/.test(text);
  const source = text.replace(/第|周次|周|\[|\]|\(|\)|（|）|单|双/g, ' ');
  const weeks = new Set<number>();
  for (const part of source.split(/[，,、;；\s]+/).filter(Boolean)) {
    const range = part.match(/(\d+)\s*[-~～至]\s*(\d+)/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      for (let week = start; week <= end; week += 1) {
        if ((!oddOnly || week % 2 === 1) && (!evenOnly || week % 2 === 0)) weeks.add(week);
      }
    } else if (/^\d+$/.test(part)) {
      const week = Number(part);
      if ((!oddOnly || week % 2 === 1) && (!evenOnly || week % 2 === 0)) weeks.add(week);
    }
  }
  return [...weeks].filter((week) => week >= 1 && week <= 30).sort((a, b) => a - b);
}

function parsePeriods(value: string) {
  const values = [...value.matchAll(/\d+/g)].map((match) => Number(match[0])).filter((period) => period >= 1 && period <= 20);
  if (!values.length) return { startPeriod: 1, endPeriod: 2 };
  return { startPeriod: Math.min(...values), endPeriod: Math.max(...values) };
}

function parseWeekday(value: string) {
  const names: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
  const named = value.match(/[一二三四五六日天]/)?.[0];
  if (named) return names[named];
  const weekday = parseNumber(value);
  return weekday >= 1 && weekday <= 7 ? weekday : 1;
}

function courseType(value: string): CourseType {
  if (/实验|实践|实训/.test(value)) return 'lab';
  if (/选修/.test(value)) return 'elective';
  if (/通识|公共/.test(value)) return 'general';
  return 'major';
}

export function parseZfCourseRows(rows: ZfRow[]) {
  const courses = rows.map((row): Course | null => {
    const name = field(row, 'kcmc', 'courseName', 'KCMC');
    if (!name) return null;
    const weekday = parseWeekday(field(row, 'xqj', 'xqjmc', 'weekday'));
    const periods = parsePeriods(field(row, 'jcs', 'jc', 'jcor', 'sections'));
    const weeks = parseWeeks(field(row, 'zcd', 'qsjsz', 'weeks'));
    const teacher = field(row, 'xm', 'jsxm', 'jsxx', 'teacher');
    const location = field(row, 'cdmc', 'jxdd', 'location');
    const startTime = field(row, 'kssj', 'startTime') || periodTimes[periods.startPeriod]?.[0] || '';
    const endTime = field(row, 'jssj', 'endTime') || periodTimes[periods.endPeriod]?.[1] || '';
    const identity = [name, teacher, location, weekday, periods.startPeriod, periods.endPeriod, weeks.join(',')].join('|');
    const colorIndex = parseInt(stableHash(name).slice(-5), 36) % courseColors.length;
    return {
      id: `xtu-course-${stableHash(identity)}`,
      name, teacher, location, weekday, ...periods, startTime, endTime,
      weeks: weeks.length ? weeks : Array.from({ length: 20 }, (_, index) => index + 1),
      color: courseColors[colorIndex],
      type: courseType(field(row, 'kclbmc', 'kcxzmc', 'kclxmc')),
    };
  }).filter((course): course is Course => Boolean(course));
  return [...new Map(courses.map((course) => [course.id, course])).values()];
}

export function parseZfGradeRows(rows: ZfRow[], fallbackSemester = '湘潭大学教务') {
  const grades = rows.map((row): Grade | null => {
    const course = field(row, 'kcmc', 'courseName', 'KCMC');
    const rawScore = field(row, 'bfzcj', 'cj', 'zzcj', 'score');
    if (!course || !rawScore) return null;
    const score = scoreNumber(rawScore);
    const credit = parseNumber(field(row, 'xf', 'credit'));
    const rawGpa = field(row, 'jd', 'gradePoint', 'gpa');
    const rawQualityPoints = field(row, 'xfjd');
    // 正方的「学分绩点」是学分 × 单课绩点，不可再乘一次学分。
    const gpa = rawGpa ? parseNumber(rawGpa) : rawQualityPoints && credit > 0
      ? parseNumber(rawQualityPoints) / credit : xtuGradePoint(score);
    const courseNature = field(row, 'kcxzmc', 'kclbmc', 'kclxmc', 'courseNature');
    const natureSignals = [courseNature, field(row, 'kcxz', 'kclb', 'courseCategory')].filter(Boolean).join(' ');
    const category = classifyGradeNature(natureSignals);
    const year = field(row, 'xnmmc', 'xnmc', 'xnm', 'academicYear');
    const term = field(row, 'xqmmc', 'xqmc', 'xqm', 'semester');
    const semester = [year, term].filter(Boolean).join(' · ') || fallbackSemester;
    const identity = [semester, course, field(row, 'kch_id', 'kch'), rawScore].join('|');
    return { id: `xtu-grade-${stableHash(identity)}`, course, score, credit, gpa, semester, courseNature, category };
  }).filter((grade): grade is Grade => Boolean(grade));
  return [...new Map(grades.map((grade) => [`${grade.semester}|${grade.course}`, grade])).values()];
}

function gradeFromRow(headers: string[], row: string[], index: number): Grade | null {
  const courseIndex = findColumn(headers, [/课程名称/, /^课程$/, /科目/]);
  const scoreIndex = findColumn(headers, [/^成绩$/, /总评/]);
  if (courseIndex < 0 || scoreIndex < 0) return null;
  const course = clean(row[courseIndex]);
  const rawScore = row[scoreIndex] || '';
  if (!course || !clean(rawScore)) return null;
  const creditIndex = findColumn(headers, [/学分/]);
  const gpaIndex = findColumn(headers, [/绩点/]);
  const natureIndex = findColumn(headers, [/课程性质/, /课程类别/, /课程属性/, /修读性质/]);
  const yearIndex = findColumn(headers, [/学年/]);
  const termIndex = findColumn(headers, [/学期/]);
  const semester = [yearIndex >= 0 ? clean(row[yearIndex]) : '', termIndex >= 0 ? clean(row[termIndex]) : ''].filter(Boolean).join('-') || '湘潭大学教务';
  const score = scoreNumber(rawScore);
  const courseNature = natureIndex >= 0 ? clean(row[natureIndex]) : '';
  return {
    id: `xtu-grade-${stableHash(`${semester}|${course}|${index}`)}`,
    course, score,
    credit: creditIndex >= 0 ? parseNumber(row[creditIndex]) : 0,
    gpa: gpaIndex >= 0 && clean(row[gpaIndex]) ? parseNumber(row[gpaIndex]) : xtuGradePoint(score),
    semester,
    courseNature,
    category: classifyGradeNature(courseNature),
  };
}

function courseFromCell(cell: SchoolPageSnapshot['scheduleCells'][number], index: number): Course | null {
  const coordinate = cell.id.match(/(?:^|[^0-9])([1-7])[-_:]([1-9]|1[0-2])(?:$|[^0-9])/);
  if (!coordinate) return null;
  const rawLines = cell.text.split(/\n+/).map(clean).filter(Boolean).filter((line) => !/^(查看|详情|选中)$/.test(line));
  if (!rawLines.length) return null;
  const weekLine = rawLines.find((line) => /\d+.*周|周次/.test(line)) ?? '';
  const teacherLine = rawLines.find((line) => /教师|老师/.test(line)) ?? rawLines.find((line) => /^[\u4e00-\u9fa5·]{2,8}$/.test(line)) ?? '';
  const locationLine = rawLines.find((line) => /教室|教学楼|楼|馆|区|室/.test(line)) ?? '';
  const name = rawLines.find((line) => line !== weekLine && line !== teacherLine && line !== locationLine && !/^(星期|第\d+节)/.test(line));
  if (!name) return null;
  const startPeriod = Number(coordinate[2]);
  const endPeriod = Math.min(12, startPeriod + Math.max(1, cell.rowSpan) - 1);
  const weeks = parseWeeks(weekLine);
  return {
    id: `xtu-course-${stableHash(`${name}|${coordinate[1]}|${startPeriod}|${index}`)}`,
    name: clean(name),
    teacher: clean(teacherLine.replace(/^(教师|老师)[:：]?/, '')),
    location: clean(locationLine.replace(/^(教室|地点)[:：]?/, '')),
    weekday: Number(coordinate[1]), startPeriod, endPeriod,
    startTime: periodTimes[startPeriod]?.[0] || '', endTime: periodTimes[endPeriod]?.[1] || '',
    weeks: weeks.length ? weeks : Array.from({ length: 20 }, (_, week) => week + 1),
    color: courseColors[index % courseColors.length], type: 'major',
  };
}

export function parseSchoolSnapshot(snapshot: SchoolPageSnapshot) {
  const grades = snapshot.tables.flatMap((table, tableIndex) => table.rows
    .map((row, rowIndex) => gradeFromRow(table.headers, row, tableIndex * 1000 + rowIndex))
    .filter((grade): grade is Grade => Boolean(grade)));
  const uniqueGrades = [...new Map(grades.map((grade) => [`${grade.semester}-${grade.course}`, grade])).values()];
  const courses = snapshot.scheduleCells.map(courseFromCell).filter((course): course is Course => Boolean(course));
  const uniqueCourses = [...new Map(courses.map((course) => [`${course.weekday}-${course.startPeriod}-${course.name}`, course])).values()];
  return { courses: uniqueCourses, grades: uniqueGrades };
}
