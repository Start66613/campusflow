export type WeekDelta = -1 | 0 | 1;

export function canChangeWeek(week: number, delta: -1 | 1) {
  'worklet';
  return delta < 0 ? week > 1 : week < 30;
}

export function resolveWeekSwipe(dx: number, vx: number, pageWidth: number, week: number): WeekDelta {
  'worklet';
  if (!Number.isFinite(dx) || !Number.isFinite(vx) || !Number.isFinite(pageWidth)) return 0;
  const delta = dx < 0 ? 1 : -1;
  if (!canChangeWeek(week, delta)) return 0;
  const distanceReached = Math.abs(dx) >= Math.max(55, pageWidth * 0.18);
  const quickFlick = Math.abs(dx) > 25 && Math.abs(vx) > 0.55 && Math.sign(dx) === Math.sign(vx);
  return distanceReached || quickFlick ? delta : 0;
}
