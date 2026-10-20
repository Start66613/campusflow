import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { initialData } from './seed';
import { hydrateStoredData } from './data-migration';
import { dailyBalance, dateFromKey, habitOnDate, habitProgress, isHabitDue, localDateKey, reviseHabit, setDailyHabitProgress, validateDailyNote, validateHabitInput } from './daily';
import { createStorageQueue } from './store-persistence';
import type { DailyNote, DailyNoteInput, DailyReward, Habit, HabitInput } from './daily-types';
import type { AppData, AppSettings, CalendarItem, Course, CreatedRecord, Expense, Grade, GradeCategory, FocusSession, Task } from './types';
import { updateNextClassWidget } from './widget';

const STORAGE_KEY = 'campusflow.data.v1';
const LEGACY_BACKUP_KEY = 'campusflow.pre-migration.v1';
const RESTORE_BACKUP_KEY = 'campusflow.pre-restore.v1';
const storageQueue = createStorageQueue();

type Action =
  | { type: 'hydrate'; data: AppData }
  | { type: 'addTask'; task: Task }
  | { type: 'toggleTask'; id: string; now: string }
  | { type: 'updateTask'; task: Task }
  | { type: 'deleteTask'; id: string }
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
  | { type: 'saveHabit'; habit: Habit; date: string }
  | { type: 'habitProgress'; id: string; date: string; value: number; note?: string; now: string }
  | { type: 'archiveHabit'; id: string; archived: boolean; date: string }
  | { type: 'reorderHabit'; id: string; direction: -1 | 1 }
  | { type: 'saveDailyNote'; note: DailyNote }
  | { type: 'deleteDailyNote'; id: string }
  | { type: 'saveDailyCardNote'; date: string; note: string }
  | { type: 'saveDailyReward'; reward: DailyReward }
  | { type: 'redeemDailyReward'; id: string; redemptionId: string; now: string }
  | { type: 'deleteDailyReward'; id: string }
  | { type: 'undoCreated'; records: CreatedRecord[]; date: string }
  | { type: 'restore'; data: AppData }
  | { type: 'settings'; settings: Partial<AppSettings> }
  | { type: 'reset' };

export function appReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'hydrate': return action.data;
    case 'addTask': return { ...state, tasks: [action.task, ...state.tasks] };
    case 'toggleTask': return { ...state, tasks: state.tasks.map((item) => item.id === action.id ? { ...item, completed: !item.completed, completedAt: item.completed ? undefined : action.now } : item) };
    case 'updateTask': return { ...state, tasks: state.tasks.map((task) => task.id === action.task.id ? action.task : task) };
    case 'deleteTask': return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) };
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
    case 'addFocusSession': {
      if (state.focusSessions.some((session) => session.id === action.session.id)) return state;
      const session = action.session;
      const date = localDateKey(new Date(session.completedAt));
      const habit = state.daily.habits.map((item) => habitOnDate(item, date)).find((item) => item.id === session.habitId && item.mode === 'minutes');
      const daily = habit && isHabitDue(habit, date)
        ? setDailyHabitProgress(state.daily, habit.id, date, habitProgress(state.daily, habit.id, date) + session.minutes, undefined, session.completedAt)
        : state.daily;
      return { ...state, daily, focusSessions: [...state.focusSessions, session], focusMinutesThisWeek: state.focusMinutesThisWeek + session.minutes };
    }
    case 'saveHabit': return { ...state, daily: { ...state.daily, habits: state.daily.habits.some((habit) => habit.id === action.habit.id)
      ? state.daily.habits.map((habit) => habit.id === action.habit.id ? reviseHabit(habit, action.habit, action.date) : habit)
      : [...state.daily.habits, action.habit] } };
    case 'habitProgress': return { ...state, daily: setDailyHabitProgress(state.daily, action.id, action.date, action.value, action.note, action.now) };
    case 'archiveHabit': return { ...state, daily: { ...state.daily, habits: state.daily.habits.map((habit) => habit.id === action.id ? reviseHabit(habit, { ...habit, archived: action.archived }, action.date) : habit) } };
    case 'reorderHabit': {
      const habits = [...state.daily.habits].sort((a, b) => a.order - b.order);
      const current = habits.findIndex((habit) => habit.id === action.id);
      const target = current + action.direction;
      if (current < 0 || target < 0 || target >= habits.length) return state;
      [habits[current], habits[target]] = [habits[target], habits[current]];
      return { ...state, daily: { ...state.daily, habits: habits.map((habit, order) => ({ ...habit, order })) } };
    }
    case 'saveDailyNote': return { ...state, daily: { ...state.daily, notes: state.daily.notes.some((note) => note.id === action.note.id)
      ? state.daily.notes.map((note) => note.id === action.note.id ? action.note : note)
      : [action.note, ...state.daily.notes] } };
    case 'deleteDailyNote': return { ...state, daily: { ...state.daily, notes: state.daily.notes.filter((note) => note.id !== action.id) } };
    case 'saveDailyCardNote': return { ...state, daily: { ...state.daily, cards: state.daily.cards.map((card) => card.date === action.date ? { ...card, note: action.note } : card) } };
    case 'saveDailyReward': return { ...state, daily: { ...state.daily, rewards: state.daily.rewards.some((reward) => reward.id === action.reward.id)
      ? state.daily.rewards.map((reward) => reward.id === action.reward.id ? action.reward : reward)
      : [...state.daily.rewards, action.reward] } };
    case 'redeemDailyReward': {
      const reward = state.daily.rewards.find((item) => item.id === action.id);
      if (!reward || dailyBalance(state.daily) < reward.cost || state.daily.redemptions.some((item) => item.id === action.redemptionId)) return state;
      return { ...state, daily: { ...state.daily, redemptions: [...state.daily.redemptions, { id: action.redemptionId, rewardId: reward.id, title: reward.title, cost: reward.cost, createdAt: action.now }] } };
    }
    case 'deleteDailyReward': return { ...state, daily: { ...state.daily, rewards: state.daily.rewards.filter((reward) => reward.id !== action.id) } };
    case 'undoCreated': {
      const ids = (kind: CreatedRecord['kind']) => new Set(action.records.filter((item) => item.kind === kind).map((item) => item.id));
      const tasks = ids('task'); const expenses = ids('expense'); const events = ids('event'); const courses = ids('course'); const habits = ids('habit');
      // Never erase a habit's earned points or completed history when an old AI bubble is undone.
      const activeHabits = new Set(state.daily.logs.map((log) => log.habitId));
      state.focusSessions.forEach((session) => { if (session.habitId) activeHabits.add(session.habitId); });
      state.daily.habits.forEach((habit) => { if (state.daily.points.some((point) => point.sourceKey.startsWith(`habit:${habit.id}:`))) activeHabits.add(habit.id); });
      return { ...state,
        tasks: state.tasks.filter((item) => !tasks.has(item.id)),
        expenses: state.expenses.filter((item) => !expenses.has(item.id)),
        events: state.events.filter((item) => !events.has(item.id)),
        courses: state.courses.filter((item) => !courses.has(item.id)),
        daily: { ...state.daily, habits: state.daily.habits.filter((habit) => !habits.has(habit.id) || activeHabits.has(habit.id)).map((habit) => habits.has(habit.id) ? reviseHabit(habit, { ...habit, archived: true }, action.date) : habit) },
      };
    }
    case 'restore': return action.data;
    case 'settings': return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'reset': return initialData;
    default: return state;
  }
}

type AppContextValue = {
  resetGeneration: number;
  data: AppData;
  hydrated: boolean;
  hydrationError: string | null;
  persistenceError: string | null;
  restoring: boolean;
  retryStorage: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => string;
  toggleTask: (id: string) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
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
  addFocus: (minutes: number, options?: { habitId?: string; taskId?: string; note?: string; source?: 'timer' | 'manual'; completedAt?: string; id?: string }) => string;
  saveHabit: (habit: HabitInput) => string;
  setHabitProgress: (id: string, date: string, value: number, note?: string) => void;
  archiveHabit: (id: string, archived: boolean) => void;
  reorderHabit: (id: string, direction: -1 | 1) => void;
  saveDailyNote: (note: DailyNoteInput) => string;
  deleteDailyNote: (id: string) => void;
  saveDailyCardNote: (date: string, note: string) => void;
  saveDailyReward: (reward: { id?: string; title: string; cost: number }) => string;
  redeemDailyReward: (id: string) => boolean;
  deleteDailyReward: (id: string) => void;
  undoCreated: (records: CreatedRecord[]) => void;
  restoreBackup: (data: AppData) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function AppProvider({ children }: PropsWithChildren) {
  const [data, reactDispatch] = useReducer(appReducer, initialData);
  const dataRef = useRef(data);
  dataRef.current = data;
  const readyRef = useRef(false);
  const restoringRef = useRef(false);
  // Synchronously reserve point balances / session IDs, even before a batched React render.
  const dispatch = useCallback((action: Action) => {
    if (action.type !== 'hydrate' && action.type !== 'restore') {
      if (!readyRef.current) throw new Error('本机数据尚未读取完成，请先重试读取');
      if (restoringRef.current) throw new Error('正在恢复备份，请稍后再操作');
    }
    dataRef.current = appReducer(dataRef.current, action);
    reactDispatch(action);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [resetGeneration, setResetGeneration] = useState(0);

  const readStorage = useCallback(async () => {
    try {
      await storageQueue.run(async () => {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AppData>;
          const nextData = hydrateStoredData(parsed);
          if (parsed.schemaVersion !== 2) {
            await AsyncStorage.setItem(LEGACY_BACKUP_KEY, saved);
          }
          dispatch({ type: 'hydrate', data: nextData });
        }
        readyRef.current = true;
        setHydrationError(null);
        setHydrated(true);
      });
    } catch (error) {
      // Keep unreadable data intact, and expose recovery instead of a silent blank app.
      readyRef.current = false;
      setHydrated(false);
      setHydrationError(error instanceof Error ? error.message : '本机数据读取失败，请重试');
    }
  }, [dispatch]);

  useEffect(() => { void readStorage(); }, [readStorage]);

  useEffect(() => {
    if (hydrated && !restoringRef.current && data === dataRef.current) {
      void storageQueue.run(async () => {
        // Discard an obsolete render's write, especially one queued before restore.
        if (restoringRef.current || data !== dataRef.current) return;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setPersistenceError(null);
      }).catch(() => setPersistenceError('保存到本机失败，当前修改仍在内存中，请重试保存'));
      updateNextClassWidget(data.courses);
    }
  }, [data, hydrated]);

  const value = useMemo<AppContextValue>(() => ({
    resetGeneration,
    data,
    hydrated,
    hydrationError,
    persistenceError,
    restoring,
    retryStorage: async () => {
      if (!readyRef.current) return readStorage();
      try {
        await storageQueue.run(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current)));
        setPersistenceError(null);
      } catch {
        setPersistenceError('保存到本机失败，当前修改仍在内存中，请重试保存');
      }
    },
    addTask: (task) => { const id = makeId('task'); dispatch({ type: 'addTask', task: { ...task, id } }); return id; },
    toggleTask: (id) => dispatch({ type: 'toggleTask', id, now: new Date().toISOString() }),
    updateTask: (task) => {
      if (!task.title.trim() || task.title.length > 240 || !Number.isFinite(Date.parse(task.dueAt))) throw new Error('请填写待办名称和有效的截止时间');
      const previous = dataRef.current.tasks.find((item) => item.id === task.id);
      const completedAt = task.completed ? previous?.completedAt ?? task.completedAt ?? new Date().toISOString() : undefined;
      dispatch({ type: 'updateTask', task: { ...task, title: task.title.trim(), completedAt } });
    },
    deleteTask: (id) => dispatch({ type: 'deleteTask', id }),
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
    addFocus: (minutes, options = {}) => {
      const completedAt = options.completedAt ?? new Date().toISOString();
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440 || !Number.isFinite(Date.parse(completedAt)) || Date.parse(completedAt) > Date.now()
        || (options.note !== undefined && (typeof options.note !== 'string' || options.note.length > 5000))
        || (options.source !== undefined && options.source !== 'timer' && options.source !== 'manual')) throw new Error('专注记录无效，请检查时长和完成时间');
      const id = options.id ?? makeId('focus');
      if (!id) throw new Error('专注记录缺少编号');
      if (dataRef.current.focusSessions.some((session) => session.id === id)) return id;
      const date = localDateKey(new Date(completedAt));
      const habit = dataRef.current.daily.habits.find((item) => item.id === options.habitId);
      // A timer may finish after its linked task was deleted or habit archived.
      // Keep the actual focus record and only credit a still-applicable minute habit.
      const habitId = habit && habitOnDate(habit, date).mode === 'minutes' ? habit.id : undefined;
      const taskId = dataRef.current.tasks.some((task) => task.id === options.taskId) ? options.taskId : undefined;
      dispatch({ type: 'addFocusSession', session: { ...options, habitId, taskId, id, minutes, completedAt, source: options.source ?? 'timer' } });
      return id;
    },
    saveHabit: (input) => {
      validateHabitInput(input);
      const previous = dataRef.current.daily.habits.find((habit) => habit.id === input.id);
      const id = input.id ?? makeId('habit');
      dispatch({ type: 'saveHabit', date: localDateKey(), habit: { ...input, id, title: input.title.trim(), createdAt: previous?.createdAt ?? new Date().toISOString(), order: input.order ?? previous?.order ?? dataRef.current.daily.habits.length } });
      return id;
    },
    setHabitProgress: (id, date, value, note) => dispatch({ type: 'habitProgress', id, date, value, note, now: new Date().toISOString() }),
    archiveHabit: (id, archived) => dispatch({ type: 'archiveHabit', id, archived, date: localDateKey() }),
    reorderHabit: (id, direction) => dispatch({ type: 'reorderHabit', id, direction }),
    saveDailyNote: (input) => {
      validateDailyNote(input);
      if (input.date > localDateKey()) throw new Error('暂时不能记录未来日期的日记');
      const id = input.id ?? makeId('daily-note');
      const previous = dataRef.current.daily.notes.find((note) => note.id === id);
      const now = new Date().toISOString();
      dispatch({ type: 'saveDailyNote', note: { ...input, id, createdAt: previous?.createdAt ?? now, updatedAt: now } });
      return id;
    },
    deleteDailyNote: (id) => dispatch({ type: 'deleteDailyNote', id }),
    saveDailyCardNote: (date, note) => {
      if (!dateFromKey(date) || typeof note !== 'string' || note.length > 5000) throw new Error('日签内容无效');
      dispatch({ type: 'saveDailyCardNote', date, note });
    },
    saveDailyReward: (input) => {
      if (!input.title.trim() || input.title.length > 120 || !Number.isInteger(input.cost) || input.cost < 1 || input.cost > 1_000_000) throw new Error('请输入奖励名称和正整数积分');
      const id = input.id ?? makeId('reward');
      const previous = dataRef.current.daily.rewards.find((reward) => reward.id === id);
      dispatch({ type: 'saveDailyReward', reward: { id, title: input.title.trim(), cost: input.cost, createdAt: previous?.createdAt ?? new Date().toISOString() } });
      return id;
    },
    redeemDailyReward: (id) => {
      const reward = dataRef.current.daily.rewards.find((item) => item.id === id);
      if (!reward || dailyBalance(dataRef.current.daily) < reward.cost) return false;
      dispatch({ type: 'redeemDailyReward', id, redemptionId: makeId('redemption'), now: new Date().toISOString() });
      return true;
    },
    deleteDailyReward: (id) => dispatch({ type: 'deleteDailyReward', id }),
    undoCreated: (records) => dispatch({ type: 'undoCreated', records, date: localDateKey() }),
    restoreBackup: async (nextData) => {
      if (restoringRef.current) throw new Error('正在恢复备份，请稍后');
      const checked = hydrateStoredData(nextData);
      restoringRef.current = true;
      setRestoring(true);
      try {
        await storageQueue.run(async () => {
          const existing = readyRef.current ? JSON.stringify(dataRef.current) : await AsyncStorage.getItem(STORAGE_KEY);
          if (existing) await AsyncStorage.setItem(RESTORE_BACKUP_KEY, existing);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
          dispatch({ type: 'restore', data: checked });
          setResetGeneration((value) => value + 1);
          readyRef.current = true;
          setHydrated(true);
          setHydrationError(null);
          setPersistenceError(null);
        });
      } finally {
        restoringRef.current = false;
        setRestoring(false);
      }
    },
    updateSettings: (settings) => dispatch({ type: 'settings', settings }),
    resetData: () => { dispatch({ type: 'reset' }); setResetGeneration((value) => value + 1); },
  }), [data, hydrated, hydrationError, persistenceError, restoring, resetGeneration, readStorage, dispatch]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
