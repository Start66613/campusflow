import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { initialData } from './seed';
import { hydrateStoredData } from './data-migration';
import type { AppData, AppSettings, CalendarItem, Course, CreatedRecord, Expense, Grade, GradeCategory, FocusSession, Task } from './types';
import { updateNextClassWidget } from './widget';

const STORAGE_KEY = 'campusflow.data.v1';
const LEGACY_BACKUP_KEY = 'campusflow.pre-migration.v1';
const RESTORE_BACKUP_KEY = 'campusflow.pre-restore.v1';

type Action =
  | { type: 'hydrate'; data: AppData }
  | { type: 'addTask'; task: Task }
  | { type: 'toggleTask'; id: string }
  | { type: 'addExpense'; expense: Expense }
  | { type: 'addEvent'; event: CalendarItem }
  | { type: 'replaceCourses'; courses: Course[] }
  | { type: 'mergeSchoolCourses'; courses: Course[] }
  | { type: 'addCourse'; course: Course }
  | { type: 'addCourses'; courses: Course[] }
  | { type: 'deleteCourse'; id: string }
  | { type: 'updateCourse'; course: Course }
  | { type: 'addGrade'; grade: Grade }
  | { type: 'replaceGrades'; grades: Grade[] }
  | { type: 'gradeCategory'; id: string; category: GradeCategory }
  | { type: 'addFocusSession'; session: FocusSession }
  | { type: 'undoCreated'; records: CreatedRecord[] }
  | { type: 'restore'; data: AppData }
  | { type: 'settings'; settings: Partial<AppSettings> }
  | { type: 'reset' };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'hydrate': return action.data;
    case 'addTask': return { ...state, tasks: [action.task, ...state.tasks] };
    case 'toggleTask': return { ...state, tasks: state.tasks.map((item) => item.id === action.id ? { ...item, completed: !item.completed } : item) };
    case 'addExpense': return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'addEvent': return { ...state, events: [action.event, ...state.events] };
    case 'replaceCourses': return { ...state, courses: action.courses };
    case 'mergeSchoolCourses': {
      const customized = new Map(state.courses.filter((course) => course.customized).map((course) => [course.id, course]));
      const incoming = action.courses.map((course) => customized.get(course.id) ?? course);
      const incomingIds = new Set(incoming.map((course) => course.id));
      return { ...state, courses: [...incoming, ...state.courses.filter((course) => course.customized && !incomingIds.has(course.id))] };
    }
    case 'addCourse': return { ...state, courses: [...state.courses, { ...action.course, customized: true }] };
    case 'addCourses': {
      const existing = new Set(state.courses.map((course) => `${course.name.trim()}|${course.weekday}|${course.startPeriod}|${course.endPeriod}|${course.weeks.join(',')}`));
      const incoming = action.courses.filter((course) => {
        const key = `${course.name.trim()}|${course.weekday}|${course.startPeriod}|${course.endPeriod}|${course.weeks.join(',')}`;
        if (existing.has(key)) return false;
        existing.add(key);
        return true;
      });
      return { ...state, courses: [...state.courses, ...incoming.map((course) => ({ ...course, customized: true }))] };
    }
    case 'deleteCourse': return { ...state, courses: state.courses.filter((course) => course.id !== action.id) };
    case 'updateCourse': return { ...state, courses: state.courses.map((course) => course.id === action.course.id ? { ...action.course, customized: true } : course) };
    case 'addGrade': return { ...state, grades: [action.grade, ...state.grades] };
    case 'replaceGrades': {
      const manualCategories = new Map(state.grades
        .filter((grade) => grade.categoryManual)
        .map((grade) => [`${grade.semester}|${grade.course}`, grade.category]));
      return { ...state, grades: action.grades.map((grade) => {
        const manualCategory = manualCategories.get(`${grade.semester}|${grade.course}`);
        return manualCategory ? { ...grade, category: manualCategory, categoryManual: true } : grade;
      }) };
    }
    case 'gradeCategory': return { ...state, grades: state.grades.map((grade) => grade.id === action.id ? { ...grade, category: action.category, categoryManual: true } : grade) };
    case 'addFocusSession': return { ...state, focusSessions: [...state.focusSessions, action.session], focusMinutesThisWeek: state.focusMinutesThisWeek + action.session.minutes };
    case 'undoCreated': {
      const ids = (kind: CreatedRecord['kind']) => new Set(action.records.filter((item) => item.kind === kind).map((item) => item.id));
      const tasks = ids('task'); const expenses = ids('expense'); const events = ids('event'); const courses = ids('course');
      return { ...state,
        tasks: state.tasks.filter((item) => !tasks.has(item.id)),
        expenses: state.expenses.filter((item) => !expenses.has(item.id)),
        events: state.events.filter((item) => !events.has(item.id)),
        courses: state.courses.filter((item) => !courses.has(item.id)),
      };
    }
    case 'restore': return action.data;
    case 'settings': return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'reset': return initialData;
    default: return state;
  }
}

type AppContextValue = {
  data: AppData;
  hydrated: boolean;
  addTask: (task: Omit<Task, 'id'>) => string;
  toggleTask: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => string;
  addEvent: (event: Omit<CalendarItem, 'id'>) => string;
  replaceCourses: (courses: Course[]) => void;
  mergeSchoolCourses: (courses: Course[]) => void;
  addCourse: (course: Omit<Course, 'id'>) => void;
  addCourses: (courses: Course[]) => string[];
  deleteCourse: (id: string) => void;
  updateCourse: (course: Course) => void;
  addGrade: (grade: Omit<Grade, 'id'>) => void;
  replaceGrades: (grades: Grade[]) => void;
  updateGradeCategory: (id: string, category: GradeCategory) => void;
  addFocus: (minutes: number) => void;
  undoCreated: (records: CreatedRecord[]) => void;
  restoreBackup: (data: AppData) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function AppProvider({ children }: PropsWithChildren) {
  const [data, dispatch] = useReducer(reducer, initialData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (saved) => {
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AppData>;
          if (parsed.schemaVersion !== 2) {
            try { await AsyncStorage.setItem(LEGACY_BACKUP_KEY, saved); }
            catch { dispatch({ type: 'hydrate', data: { ...initialData, ...parsed, settings: { ...initialData.settings, ...parsed.settings }, focusSessions: [], schemaVersion: 2 } }); return; }
          }
          dispatch({ type: 'hydrate', data: hydrateStoredData(parsed) });
        }
      })
      .then(() => setHydrated(true))
      // A damaged saved value must never be overwritten with empty defaults.
      .catch(() => setHydrated(false));
  }, []);

  useEffect(() => {
    if (hydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => undefined);
      updateNextClassWidget(data.courses);
    }
  }, [data, hydrated]);

  const value = useMemo<AppContextValue>(() => ({
    data,
    hydrated,
    addTask: (task) => { const id = makeId('task'); dispatch({ type: 'addTask', task: { ...task, id } }); return id; },
    toggleTask: (id) => dispatch({ type: 'toggleTask', id }),
    addExpense: (expense) => { const id = makeId('expense'); dispatch({ type: 'addExpense', expense: { ...expense, id } }); return id; },
    addEvent: (event) => { const id = makeId('event'); dispatch({ type: 'addEvent', event: { ...event, id } }); return id; },
    replaceCourses: (courses) => dispatch({ type: 'replaceCourses', courses }),
    mergeSchoolCourses: (courses) => dispatch({ type: 'mergeSchoolCourses', courses }),
    addCourse: (course) => dispatch({ type: 'addCourse', course: { ...course, id: makeId('course') } }),
    addCourses: (courses) => { const created = courses.map((course) => ({ ...course, id: makeId('course') })); dispatch({ type: 'addCourses', courses: created }); return created.map((course) => course.id); },
    deleteCourse: (id) => dispatch({ type: 'deleteCourse', id }),
    updateCourse: (course) => dispatch({ type: 'updateCourse', course }),
    addGrade: (grade) => dispatch({ type: 'addGrade', grade: { ...grade, id: makeId('grade') } }),
    replaceGrades: (grades) => dispatch({ type: 'replaceGrades', grades }),
    updateGradeCategory: (id, category) => dispatch({ type: 'gradeCategory', id, category }),
    addFocus: (minutes) => dispatch({ type: 'addFocusSession', session: { id: makeId('focus'), minutes, completedAt: new Date().toISOString() } }),
    undoCreated: (records) => dispatch({ type: 'undoCreated', records }),
    restoreBackup: async (nextData) => {
      await AsyncStorage.setItem(RESTORE_BACKUP_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      dispatch({ type: 'restore', data: nextData });
    },
    updateSettings: (settings) => dispatch({ type: 'settings', settings }),
    resetData: () => dispatch({ type: 'reset' }),
  }), [data, hydrated]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
