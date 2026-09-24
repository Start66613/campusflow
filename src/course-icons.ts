import type { AppIconProps } from '@/components/app-icon';
import type { CourseIcon, CourseType } from './types';

export const courseIconOptions: { value: CourseIcon; label: string; ios: AppIconProps['ios']; android: AppIconProps['android'] }[] = [
  { value: 'book', label: '书本', ios: 'book.fill', android: 'menu_book' },
  { value: 'flask', label: '实验', ios: 'flask.fill', android: 'science' },
  { value: 'code', label: '编程', ios: 'curlybraces', android: 'code' },
  { value: 'atom', label: '理工', ios: 'atom', android: 'biotech' },
  { value: 'art', label: '艺术', ios: 'paintpalette.fill', android: 'palette' },
  { value: 'sport', label: '运动', ios: 'figure.run', android: 'fitness_center' },
  { value: 'calendar', label: '日程', ios: 'calendar', android: 'calendar_month' },
  { value: 'sparkles', label: '灵感', ios: 'sparkles', android: 'auto_awesome' },
];

export function defaultCourseIcon(type: CourseType): CourseIcon {
  return type === 'lab' ? 'flask' : type === 'general' ? 'sparkles' : type === 'elective' ? 'calendar' : 'book';
}

export function courseIconSpec(icon: CourseIcon | undefined, type: CourseType) {
  return courseIconOptions.find((option) => option.value === (icon ?? defaultCourseIcon(type))) ?? courseIconOptions[0];
}
