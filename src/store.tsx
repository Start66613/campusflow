import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { initialData } from './seed';
import type { AppData, AppSettings, CalendarItem, Course, Expense, Grade, GradeCategory, Task } from './types';
import { updateNextClassWidget } from './widget';

const STORAGE_KEY = 'campusflow.data.v1';

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
  | { type: 'addFocus'; minutes: number }
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
    case 'addFocus': return { ...state, focusMinutesThisWeek: state.focusMinutesThisWeek + action.minutes };
    case 'settings': return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'reset': return initialData;
    default: return state;
  }
}

type AppContextValue = {
  data: AppData;
  hydrated: boolean;
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addEvent: (event: Omit<CalendarItem, 'id'>) => void;
  replaceCourses: (courses: Course[]) => void;
  mergeSchoolCourses: (courses: Course[]) => void;
  addCourse: (course: Omit<Course, 'id'>) => void;
  addCourses: (courses: Course[]) => void;
  deleteCourse: (id: string) => void;
  updateCourse: (course: Course) => void;
  addGrade: (grade: Omit<Grade, 'id'>) => void;
  replaceGrades: (grades: Grade[]) => void;
  updateGradeCategory: (id: string, category: GradeCategory) => void;
  addFocus: (minutes: number) => void;
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
      .then((saved) => {
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AppData>;
          dispatch({
            type: 'hydrate',
            data: {
              ...initialData,
              ...parsed,
              settings: { ...initialData.settings, ...parsed.settings },
            },
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
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
    addTask: (task) => dispatch({ type: 'addTask', task: { ...task, id: makeId('task') } }),
    toggleTask: (id) => dispatch({ type: 'toggleTask', id }),
    addExpense: (expense) => dispatch({ type: 'addExpense', expense: { ...expense, id: makeId('expense') } }),
    addEvent: (event) => dispatch({ type: 'addEvent', event: { ...event, id: makeId('event') } }),
    replaceCourses: (courses) => dispatch({ type: 'replaceCourses', courses }),
    mergeSchoolCourses: (courses) => dispatch({ type: 'mergeSchoolCourses', courses }),
    addCourse: (course) => dispatch({ type: 'addCourse', course: { ...course, id: makeId('course') } }),
    addCourses: (courses) => dispatch({ type: 'addCourses', courses: courses.map((course) => ({ ...course, id: makeId('course') })) }),
    deleteCourse: (id) => dispatch({ type: 'deleteCourse', id }),
    updateCourse: (course) => dispatch({ type: 'updateCourse', course }),
    addGrade: (grade) => dispatch({ type: 'addGrade', grade: { ...grade, id: makeId('grade') } }),
    replaceGrades: (grades) => dispatch({ type: 'replaceGrades', grades }),
    updateGradeCategory: (id, category) => dispatch({ type: 'gradeCategory', id, category }),
    addFocus: (minutes) => dispatch({ type: 'addFocus', minutes }),
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
