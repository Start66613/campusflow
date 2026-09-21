import { Platform } from 'react-native';

import type { CalendarItem, Course } from './types';

export async function addItemToSystemCalendar(item: CalendarItem) {
  if (Platform.OS === 'web') throw new Error('请在 iPhone 开发版中使用日历同步。');
  try {
    const Calendar = await import('expo-calendar');
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (!permission.granted) throw new Error('未获得日历写入权限');
    const calendar = await Calendar.getDefaultCalendarAsync();
    await Calendar.createEventAsync(calendar.id, {
      title: item.title,
      startDate: new Date(item.startAt),
      endDate: new Date(item.endAt),
      notes: item.note,
      alarms: [{ relativeOffset: -15 }],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '日历同步失败';
    if (/Expo Go|native module|CalendarNext/i.test(message)) {
      throw new Error('日历同步需要安装开发版 App，Expo Go 仅用于界面预览。');
    }
    throw error;
  }
}
export async function syncCoursesToSystemCalendar(courses: Course[], termStart: string) {
  if (Platform.OS === 'web') throw new Error('请在 iPhone 开发版中使用日历同步。');
  const Calendar = await import('expo-calendar');
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (!permission.granted) throw new Error('未获得日历写入权限');
  const calendar = await Calendar.getDefaultCalendarAsync();
  const monday = new Date(`${termStart}T00:00:00`);
  let created = 0;
  for (const course of courses) {
    for (const week of course.weeks) {
      const date = new Date(monday);
      date.setDate(date.getDate() + (week - 1) * 7 + course.weekday - 1);
      const [startHour, startMinute] = course.startTime.split(':').map(Number);
      const [endHour, endMinute] = course.endTime.split(':').map(Number);
      const startDate = new Date(date);
      const endDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);
      endDate.setHours(endHour, endMinute, 0, 0);
      if (endDate < new Date()) continue;
      await Calendar.createEventAsync(calendar.id, {
        title: course.name,
        location: course.location,
        notes: `${course.teacher} · 第 ${course.startPeriod}-${course.endPeriod} 节`,
        startDate,
        endDate,
        alarms: [{ relativeOffset: -15 }],
      });
      created += 1;
    }
  }
  return created;
}
