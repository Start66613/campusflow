import type { Course } from './types';

export async function scheduleWakeReminder(hour: number, minute: number) {
  const Notifications = await import('expo-notifications');
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('未获得通知权限');
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= new Date()) target.setDate(target.getDate() + 1);
  return Notifications.scheduleNotificationAsync({
    content: { title: '早安，该起床啦 ☀️', body: '新的一天，从从容容地去上课。', sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
  });
}
export async function scheduleStudyReminder(courses: Course[]) {
  const Notifications = await import('expo-notifications');
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('未获得通知权限');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekday = tomorrow.getDay() || 7;
  const dayCourses = courses.filter((course) => course.weekday === weekday).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const hour = dayCourses.length ? Math.min(20, Number(dayCourses[dayCourses.length - 1].endTime.slice(0, 2)) + 1) : 9;
  tomorrow.setHours(hour, 0, 0, 0);
  return Notifications.scheduleNotificationAsync({
    content: { title: '发现一段空闲时间 📚', body: dayCourses.length ? '明天课程结束后，留 25 分钟推进最重要的任务吧。' : '明天没有课，很适合安排一次专注学习。', sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow },
  });
}
