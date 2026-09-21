import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { initialData } from './seed';
import type { AppData, AppSettings, CalendarItem, Course, Expense, Grade, Task } from './types';
import { updateNextClassWidget } from './widget';

const STORAGE_KEY = 'campusflow.data.v1';

type Action =
  | { type: 'hydrate'; data: AppData }
  | { type: 'addTask'; task: Task }
  | { type: 'toggleTask'; id: string }
  | { type: 'addExpense'; expense: Expense }
  | { type: 'addEvent'; event: CalendarItem }
  | { type: 'replaceCourses'; courses: Course[] }
  | { type: 'addGrade'; grade: Grade }
  | { type: 'replaceGrades'; grades: Grade[] }
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
    case 'addGrade': return { ...state, grades: [action.grade, ...state.grades] };
    case 'replaceGrades': return { ...state, grades: action.grades };
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
  addGrade: (grade: Omit<Grade, 'id'>) => void;
  replaceGrades: (grades: Grade[]) => void;
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
    addGrade: (grade) => dispatch({ type: 'addGrade', grade: { ...grade, id: makeId('grade') } }),
    replaceGrades: (grades) => dispatch({ type: 'replaceGrades', grades }),
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
