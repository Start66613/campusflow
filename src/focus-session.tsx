import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { completeFocusTimer, createFocusTimer, elapsedFocusSeconds, focusTimerKey, nextFocusPhase, pauseFocusTimer, restoreFocusTimer, startFocusTimer, type FocusTimer } from './focus-timer';
import { syncFocusNotification } from './daily-notifications';
import { useApp } from './store';
import { FocusAudio } from '@/components/focus-audio';

type TimerOptions = Parameters<typeof createFocusTimer>[0];
type FocusContextValue = {
  timer: FocusTimer | null;
  ready: boolean;
  error: string;
  configure: (options: TimerOptions) => void;
  start: () => void;
  pause: () => void;
  finish: () => void;
  reset: () => void;
  next: () => void;
};
const FocusContext = createContext<FocusContextValue | null>(null);

/** Lives above navigation: closing the timer screen never discards an ongoing session. */
export function FocusProvider({ children }: PropsWithChildren) {
  const app = useApp();
  const [timer, setTimer] = useState<FocusTimer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [timerGeneration, setTimerGeneration] = useState(app.resetGeneration);
  const [error, setError] = useState('');
  const latest = useRef(timer);
  latest.current = timer;
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const settings = useRef(app.data.settings);
  const resetGeneration = useRef(app.resetGeneration);
  settings.current = app.data.settings;
  useEffect(() => {
    if (resetGeneration.current === app.resetGeneration) return;
    resetGeneration.current = app.resetGeneration;
    setTimer(createFocusTimer(app.data.settings));
    setTimerGeneration(app.resetGeneration);
  }, [app.resetGeneration, app.data.settings]);

  useEffect(() => {
    if (!app.hydrated) return;
    let alive = true;
    AsyncStorage.getItem(focusTimerKey).then((raw) => {
      const restored = raw ? restoreFocusTimer(JSON.parse(raw)) : null;
      if (raw && !restored) throw new Error('专注计时记录格式异常，原记录已保留');
      if (alive) {
        setTimer(restored ?? createFocusTimer(settings.current));
        setLoaded(true);
      }
    }).catch(() => { if (alive) setError('无法读取专注计时记录，请重新打开应用后重试'); });
    return () => { alive = false; };
  }, [app.hydrated]);

  useEffect(() => {
    if (!loaded || !timer) return;
    const snapshot = JSON.stringify(timer);
    writes.current = writes.current.catch(() => undefined).then(() => AsyncStorage.setItem(focusTimerKey, snapshot))
      .then(() => setError('')).catch(() => { setError('这次计时暂未保存，请保持应用打开'); });
    syncFocusNotification(timer, app.data.settings.focusCompletionSound !== false).catch(() => { setError('计时正常，但到点通知未能安排，请检查系统通知权限'); });
  }, [loaded, timer, app.data.settings.focusCompletionSound]);

  const settle = useCallback(() => {
    const value = latest.current;
    if (!value || value.status !== 'running') return;
    const limit = value.mode === 'countup' && value.phase === 'focus' ? 43200 : value.duration;
    if (elapsedFocusSeconds(value) >= limit) setTimer(completeFocusTimer(value));
  }, []);
  useEffect(() => {
    if (!timer || timer.status !== 'running') return;
    const limit = timer.mode === 'countup' && timer.phase === 'focus' ? 43200 : timer.duration;
    const timeout = setTimeout(settle, Math.max(10, (limit - elapsedFocusSeconds(timer)) * 1000 + 10));
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') settle(); });
    settle();
    return () => { clearTimeout(timeout); listener.remove(); };
  }, [timer, settle]);

  useEffect(() => {
    if (!app.hydrated || app.restoring || timerGeneration !== app.resetGeneration || timer?.status !== 'complete' || timer.phase !== 'focus' || timer.elapsed < 60 || app.data.focusSessions.some((item) => item.id === timer.id)) return;
    const habit = app.data.daily.habits.find((item) => item.id === timer.habitId && item.mode === 'minutes' && !item.archived);
    const task = app.data.tasks.find((item) => item.id === timer.taskId);
    try {
      app.addFocus(Math.round(timer.elapsed / 60 * 100) / 100, {
        id: timer.id, habitId: habit?.id, taskId: task?.id, source: 'timer',
        completedAt: new Date(Math.min(Date.now(), timer.completedAt ?? Date.now())).toISOString(),
      });
    } catch (caught) { setError(caught instanceof Error ? caught.message : '专注记录尚未保存'); }
  }, [app, timer, timerGeneration]);

  const value = useMemo<FocusContextValue>(() => ({
    timer, ready: loaded && app.hydrated, error,
    configure: (options) => setTimer((previous) => !previous || previous.status === 'idle' ? createFocusTimer({ ...previous, ...options }) : previous),
    start: () => { if (loaded && app.hydrated) setTimer((previous) => previous ? startFocusTimer(previous) : previous); },
    pause: () => setTimer((previous) => previous ? pauseFocusTimer(previous) : previous),
    finish: () => setTimer((previous) => previous ? completeFocusTimer(previous) : previous),
    reset: () => setTimer((previous) => createFocusTimer(previous ?? settings.current)),
    next: () => setTimer((previous) => previous ? nextFocusPhase(previous) : createFocusTimer(settings.current)),
  }), [timer, loaded, app.hydrated, error]);
  return <FocusContext.Provider value={value}>{children}<FocusAudio timer={timer} onError={setError} /></FocusContext.Provider>;
}

export function useFocusSession() {
  const context = useContext(FocusContext);
  if (!context) throw new Error('FocusProvider is required');
  return context;
}
