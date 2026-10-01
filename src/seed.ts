import type { AppData, Course } from './types';

const allWeeks = Array.from({ length: 18 }, (_, index) => index + 1);

export const seedCourses: Course[] = [
  {
    id: 'course-calculus', name: '高等数学', teacher: '周老师', location: '博学楼 A302',
    weekday: 1, startPeriod: 1, endPeriod: 2, startTime: '08:00', endTime: '09:40',
    weeks: allWeeks, color: '#5B67F1', type: 'major',
  },
  {
    id: 'course-programming', name: '程序设计基础', teacher: '陈老师', location: '信息楼 405',
    weekday: 1, startPeriod: 5, endPeriod: 6, startTime: '14:00', endTime: '15:40',
    weeks: allWeeks, color: '#23A89A', type: 'major',
  },
  {
    id: 'course-english', name: '大学英语', teacher: '林老师', location: '博雅楼 B210',
    weekday: 2, startPeriod: 3, endPeriod: 4, startTime: '10:10', endTime: '11:50',
    weeks: allWeeks, color: '#F28A5B', type: 'general',
  },
  {
    id: 'course-physics', name: '大学物理', teacher: '杨老师', location: '致知楼 201',
    weekday: 3, startPeriod: 1, endPeriod: 2, startTime: '08:00', endTime: '09:40',
    weeks: allWeeks, color: '#A35BD8', type: 'major',
  },
  {
    id: 'course-lab', name: '物理实验', teacher: '杨老师', location: '实验中心 307',
    weekday: 4, startPeriod: 5, endPeriod: 7, startTime: '14:00', endTime: '16:35',
    weeks: allWeeks.filter((week) => week % 2 === 0), color: '#E25574', type: 'lab',
  },
  {
    id: 'course-sports', name: '羽毛球', teacher: '李老师', location: '东区体育馆',
    weekday: 5, startPeriod: 3, endPeriod: 4, startTime: '10:10', endTime: '11:50',
    weeks: allWeeks, color: '#4D8ED8', type: 'elective',
  },
];

function atOffset(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const legacyDemoData: AppData = {
  schemaVersion: 2,
  courses: seedCourses,
  tasks: [
    { id: 'task-1', title: '完成高数习题 2.3', dueAt: atOffset(2, 22), courseId: 'course-calculus', completed: false, source: 'homework' },
    { id: 'task-2', title: '提交程序设计实验报告', dueAt: atOffset(4, 18), courseId: 'course-programming', completed: false, source: 'homework' },
    { id: 'task-3', title: '背诵英语 Unit 3 单词', dueAt: atOffset(1, 20), courseId: 'course-english', completed: true, source: 'manual' },
  ],
  expenses: [
    { id: 'expense-1', amount: 13.5, category: '餐饮', note: '早餐', occurredAt: atOffset(0, 8) },
    { id: 'expense-2', amount: 26, category: '餐饮', note: '食堂午饭', occurredAt: atOffset(0, 12) },
    { id: 'expense-3', amount: 8, category: '学习', note: '打印资料', occurredAt: atOffset(-1, 16) },
  ],
  events: [
    { id: 'event-1', title: '小组讨论', startAt: atOffset(1, 15), endAt: atOffset(1, 16, 30), note: '图书馆三楼', kind: 'study' },
  ],
  grades: [
    { id: 'grade-1', course: '数据结构', score: 91, credit: 4, gpa: 4.0, semester: '2025-2026-2', category: 'required' },
    { id: 'grade-2', course: '线性代数', score: 86, credit: 3, gpa: 3.7, semester: '2025-2026-2', category: 'required' },
    { id: 'grade-3', course: '大学英语 II', score: 82, credit: 2, gpa: 3.3, semester: '2025-2026-2', category: 'required' },
    { id: 'grade-4', course: '中国近现代史', score: 94, credit: 2, gpa: 4.0, semester: '2025-2026-2', category: 'required' },
  ],
  attendance: [],
  focusSessions: [],
  focusMinutesThisWeek: 185,
  settings: {
    displayName: '同学',
    schoolName: '我的大学',
    termStart: '2026-09-07',
    themeMode: 'system',
    accentPreset: 'purple',
    backgroundOpacity: 0.42,
    visualMode: 'glass',
    aiThinking: true,
    wakeHour: 7,
    wakeMinute: 0,
    focusMinutes: 25,
    breakMinutes: 5,
    studyReminders: true,
  },
};

// New installations begin with real, empty records. The old demo data is
// retained only to identify and safely migrate records from earlier builds.
export const initialData: AppData = {
  ...legacyDemoData,
  courses: [], tasks: [], expenses: [], events: [], grades: [], attendance: [], focusSessions: [],
  focusMinutesThisWeek: 0,
};
