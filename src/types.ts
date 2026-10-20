import type { DailyData, HabitInput } from './daily-types';

export type CourseType = 'major' | 'general' | 'lab' | 'elective';
export type CourseIcon = 'book' | 'flask' | 'code' | 'atom' | 'art' | 'sport' | 'calendar' | 'sparkles';

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
  icon?: CourseIcon;
  backgroundUri?: string;
  customized?: boolean;
};

export type Task = {
  id: string;
  title: string;
  dueAt: string;
  courseId?: string;
  completed: boolean;
  completedAt?: string;
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

export type GradeCategory = 'required' | 'elective' | 'unknown';
export type GradeCategorySource = 'school-grade' | 'school-course';

export type Grade = {
  id: string;
  course: string;
  score: number;
  credit: number;
  gpa: number;
  semester: string;
  courseNature?: string;
  category?: GradeCategory;
  categorySource?: GradeCategorySource;
  categoryManual?: boolean;
};

export type Attendance = {
  courseId: string;
  date: string;
  status: 'present' | 'late' | 'absent';
};

export type FocusSession = {
  id: string;
  minutes: number;
  completedAt: string;
  habitId?: string;
  taskId?: string;
  note?: string;
  source?: 'timer' | 'manual';
};

export type ThemeMode = 'system' | 'light' | 'dark' | 'eye';
export type VisualMode = 'glass' | 'native';
export type AccentPreset = 'purple' | 'blue' | 'mint' | 'sky' | 'black' | 'coral' | 'rainbow';

export type AppSettings = {
  displayName: string;
  schoolName: string;
  major?: string;
  studyGoal?: string;
  avatarUri?: string;
  backgroundUri?: string;
  backgroundOpacity?: number;
  accentPreset?: AccentPreset;
  termStart: string;
  themeMode: ThemeMode;
  visualMode: VisualMode;
  jiahaoMode?: boolean;
  aiThinking: boolean;
  wakeHour: number;
  wakeMinute: number;
  focusMinutes: number;
  breakMinutes: number;
  focusSound?: 'none' | 'rain' | 'wind';
  focusVolume?: number;
  focusCompletionSound?: boolean;
  studyReminders: boolean;
};

export type AppData = {
  schemaVersion: 2;
  courses: Course[];
  tasks: Task[];
  expenses: Expense[];
  events: CalendarItem[];
  grades: Grade[];
  attendance: Attendance[];
  focusSessions: FocusSession[];
  focusMinutesThisWeek: number;
  daily: DailyData;
  settings: AppSettings;
};

export type AssistantCommand =
  | { type: 'expense'; amount: number; category: ExpenseCategory; note: string; occurredAt: string }
  | { type: 'task'; title: string; dueAt: string; courseName?: string }
  | { type: 'event'; title: string; startAt: string; endAt: string; note?: string }
  | { type: 'habit'; habit: HabitInput }
  | { type: 'courses'; courses: Course[] };

export type CreatedRecord = { kind: 'task' | 'expense' | 'event' | 'course' | 'habit'; id: string };
