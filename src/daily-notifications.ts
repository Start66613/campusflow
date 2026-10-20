import { Platform } from 'react-native';
import { habitProgress, isHabitDue, localDateKey, shiftDateKey } from './daily';
import type { DailyData } from './daily-types';
import type { FocusTimer } from './focus-timer';
import { elapsedFocusSeconds } from './focus-timer';

const habitPrefix = 'campusflow.habit.';
const focusId = 'campusflow.focus.end';
const channelId = 'campus-reminders';

export async function requestDailyNotificationPermission() {
  if (Platform.OS === 'web') return false;
  const N = await import('expo-notifications');
  if (Platform.OS === 'android') await N.setNotificationChannelAsync(channelId, { name: '校园与日常提醒', importance: N.AndroidImportance.DEFAULT });
  const result = await N.requestPermissionsAsync();
  return result.granted || result.ios?.status === N.IosAuthorizationStatus.PROVISIONAL;
}

function fingerprint(value: string) {
  let h = 0;
  for (const char of value) h = (Math.imul(h, 31) + char.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}
export function planHabitNotifications(daily: DailyData, now = new Date()) {
  const today = localDateKey(now);
  const jobs: { id: string; title: string; body: string; date: Date; habitId: string }[] = [];
  for (let offset = 0; offset < 14; offset++) {
    const key = shiftDateKey(today, offset);
    for (const habit of daily.habits) {
      if (!habit.reminderTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(habit.reminderTime) || !isHabitDue(habit, key) || habitProgress(daily, habit.id, key) >= habit.target) continue;
      const target = new Date(`${key}T${habit.reminderTime}:00`);
      if (target.getTime() <= now.getTime()) continue;
      const body = habit.mode === 'check' ? '给自己留一点时间，完成今天的小坚持' : `今天的目标：${habit.target}${habit.unit}`;
      jobs.push({ id: `${habitPrefix}${habit.id}.${key}.${fingerprint(`${habit.reminderTime}|${habit.title}|${body}`)}`, title: habit.title, body, date: target, habitId: habit.id });
    }
  }
  return jobs.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 40);
}

let syncQueue = Promise.resolve(0);
export function syncDailyNotifications(daily: DailyData) {
  // Serial reconciliation prevents a slower stale save from restoring a completed habit's notification.
  syncQueue = syncQueue.catch(() => 0).then(async () => {
    if (Platform.OS === 'web') return 0;
    const N = await import('expo-notifications');
    const permission = await N.getPermissionsAsync();
    if (!permission.granted && permission.ios?.status !== N.IosAuthorizationStatus.PROVISIONAL) return 0;
    if (Platform.OS === 'android') await N.setNotificationChannelAsync(channelId, { name: '校园与日常提醒', importance: N.AndroidImportance.DEFAULT });
    const current = await N.getAllScheduledNotificationsAsync();
    const owned = current.filter((item) => item.identifier.startsWith(habitPrefix));
    const allowance = Math.max(0, 56 - (current.length - owned.length));
    const jobs = planHabitNotifications(daily).slice(0, allowance);
    const nextIds = new Set(jobs.map((job) => job.id));
    const oldIds = new Set(owned.map((job) => job.identifier));
    for (const old of owned) if (!nextIds.has(old.identifier)) await N.cancelScheduledNotificationAsync(old.identifier);
    for (const job of jobs) if (!oldIds.has(job.id)) await N.scheduleNotificationAsync({
      identifier: job.id,
      content: { title: job.title, body: job.body, sound: true, data: { route: '/daily', habitId: job.habitId } },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: job.date, channelId },
    });
    return jobs.length;
  });
  return syncQueue;
}

let focusQueue: Promise<unknown> = Promise.resolve();
export function syncFocusNotification(timer: FocusTimer | null, sound = true) {
  focusQueue = focusQueue.catch(() => undefined).then(async () => {
    if (Platform.OS === 'web') return;
    const N = await import('expo-notifications');
    await N.cancelScheduledNotificationAsync(focusId);
    if (!timer || timer.status !== 'running' || (timer.mode === 'countup' && timer.phase === 'focus')) return;
    const permission = await N.getPermissionsAsync();
    if (!permission.granted && permission.ios?.status !== N.IosAuthorizationStatus.PROVISIONAL) return;
    const remaining = timer.duration - elapsedFocusSeconds(timer);
    if (remaining <= 1) return;
    await N.scheduleNotificationAsync({
      identifier: focusId,
      content: { title: timer.phase === 'rest' ? '休息结束，准备下一轮' : '这段专注，完成了', body: '打开 CampusFlow 查看本次记录', sound, data: { route: '/focus' } },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + remaining * 1000), channelId },
    });
  });
  return focusQueue;
}
