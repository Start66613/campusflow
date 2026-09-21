export type CourseType = 'major' | 'general' | 'lab' | 'elective';

export type Course = {
  id: string;
  name: string;
  teacher: string;
  location: string;
  weekday: number;
  startPeriod: number;
  endPeriod: number;
  startTime: string;
  endTime: string;
  weeks: number[];
  color: string;
  type: CourseType;
};

export type Task = {
  id: string;
  title: string;
  dueAt: string;
  courseId?: string;
  completed: boolean;
  source: 'manual' | 'ai' | 'homework';
};

export type ExpenseCategory = '餐饮' | '交通' | '学习' | '娱乐' | '生活' | '其他';

export type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  occurredAt: string;
};

export type CalendarItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  note?: string;
  kind: 'study' | 'life' | 'exam';
};

export type Grade = {
  id: string;
  course: string;
  score: number;
  credit: number;
  gpa: number;
  semester: string;
};

export type Attendance = {
  courseId: string;
  date: string;
  status: 'present' | 'late' | 'absent';
};

export type ThemeMode = 'system' | 'light' | 'dark' | 'eye';
export type VisualMode = 'glass' | 'native';

export type AppSettings = {
  displayName: string;
  schoolName: string;
  termStart: string;
  themeMode: ThemeMode;
  visualMode: VisualMode;
  aiThinking: boolean;
  wakeHour: number;
  wakeMinute: number;
  focusMinutes: number;
  breakMinutes: number;
  studyReminders: boolean;
};

export type AppData = {
  courses: Course[];
  tasks: Task[];
  expenses: Expense[];
  events: CalendarItem[];
  grades: Grade[];
  attendance: Attendance[];
  focusMinutesThisWeek: number;
  settings: AppSettings;
};

export type AssistantCommand =
  | { type: 'expense'; amount: number; category: ExpenseCategory; note: string; occurredAt: string }
  | { type: 'task'; title: string; dueAt: string; courseName?: string }
  | { type: 'event'; title: string; startAt: string; endAt: string; note?: string }
  | { type: 'courses'; courses: Course[] };
