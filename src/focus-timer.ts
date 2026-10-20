export type FocusTimer = {
  version: 1;
  id: string;
  mode: 'countdown' | 'countup';
  phase: 'focus' | 'rest';
  status: 'idle' | 'running' | 'paused' | 'complete';
  duration: number;
  elapsed: number;
  startedAt: number | null;
  completedAt?: number;
  focusMinutes: number;
  breakMinutes: number;
  cycle: number;
  cycles: number;
  habitId?: string;
  taskId?: string;
};

export const focusTimerKey = 'campusflow.focus-timer.v1';
export function createFocusTimer(options: Partial<Pick<FocusTimer, 'mode' | 'focusMinutes' | 'breakMinutes' | 'cycles' | 'habitId' | 'taskId'>> = {}): FocusTimer {
  const bound = (value: unknown, fallback: number, max: number) => Math.max(1, Math.min(max, typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback));
  const focusMinutes = bound(options.focusMinutes, 25, 180);
  return {
    version: 1, id: `focus-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    mode: options.mode === 'countup' ? 'countup' : 'countdown', phase: 'focus', status: 'idle', duration: focusMinutes * 60,
    elapsed: 0, startedAt: null, focusMinutes,
    breakMinutes: bound(options.breakMinutes, 5, 60),
    cycle: 1, cycles: bound(options.cycles, 4, 8),
    habitId: options.habitId, taskId: options.taskId,
  };
}

// A backgrounded JS timer is only a paint clock. Elapsed time comes from a wall-clock anchor.
export function elapsedFocusSeconds(timer: FocusTimer, now = Date.now()) {
  const running = timer.status === 'running' && timer.startedAt !== null;
  const elapsed = timer.elapsed + (running ? Math.max(0, (now - timer.startedAt!) / 1000) : 0);
  return Math.min(timer.mode === 'countup' && timer.phase === 'focus' ? 12 * 3600 : timer.duration, elapsed);
}
export function displayedFocusSeconds(timer: FocusTimer, now = Date.now()) {
  const elapsed = elapsedFocusSeconds(timer, now);
  return timer.mode === 'countup' && timer.phase === 'focus' ? Math.floor(elapsed) : Math.max(0, Math.ceil(timer.duration - elapsed));
}
export function startFocusTimer(timer: FocusTimer, now = Date.now()): FocusTimer {
  if (timer.status === 'complete' || timer.status === 'running') return timer;
  return { ...timer, status: 'running', startedAt: now };
}
export function pauseFocusTimer(timer: FocusTimer, now = Date.now()): FocusTimer {
  if (timer.status !== 'running') return timer;
  return { ...timer, elapsed: elapsedFocusSeconds(timer, now), startedAt: null, status: 'paused' };
}
export function completeFocusTimer(timer: FocusTimer, now = Date.now()): FocusTimer {
  if (timer.status === 'complete') return timer;
  const limit = timer.mode === 'countup' && timer.phase === 'focus' ? 43200 : timer.duration;
  const reachedLimit = elapsedFocusSeconds(timer, now) >= limit;
  const deadline = timer.status === 'running' && timer.startedAt !== null && reachedLimit
    ? timer.startedAt + (limit - timer.elapsed) * 1000 : now;
  return { ...timer, elapsed: elapsedFocusSeconds(timer, now), startedAt: null, status: 'complete', completedAt: Math.min(now, deadline) };
}
export function nextFocusPhase(timer: FocusTimer): FocusTimer {
  const next = createFocusTimer(timer);
  if (timer.phase === 'focus' && timer.mode === 'countdown') {
    return { ...next, phase: 'rest', duration: timer.breakMinutes * 60, cycle: timer.cycle };
  }
  return { ...next, cycle: timer.cycle < timer.cycles ? timer.cycle + 1 : 1 };
}
export function restoreFocusTimer(raw: unknown): FocusTimer | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const finite = (key: string, min: number, max: number) => typeof v[key] === 'number' && Number.isFinite(v[key]) && v[key] >= min && v[key] <= max;
  if (v.version !== 1 || typeof v.id !== 'string' || !v.id.startsWith('focus-') || v.id.length > 150
    || !['countdown', 'countup'].includes(String(v.mode)) || !['focus', 'rest'].includes(String(v.phase))
    || !['idle', 'running', 'paused', 'complete'].includes(String(v.status))
    || !finite('duration', 60, 10800) || !finite('elapsed', 0, 43200)
    || !finite('focusMinutes', 1, 180) || !finite('breakMinutes', 1, 60)
    || !finite('cycles', 1, 8) || !finite('cycle', 1, 8)
    || (v.startedAt !== null && !finite('startedAt', 1, Number.MAX_SAFE_INTEGER))
    || (v.completedAt !== undefined && !finite('completedAt', 1, Number.MAX_SAFE_INTEGER))
    || (v.status === 'running' && v.startedAt === null)
    || (v.habitId !== undefined && typeof v.habitId !== 'string')
    || (v.taskId !== undefined && typeof v.taskId !== 'string')) return null;
  return v as unknown as FocusTimer;
}
