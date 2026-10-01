import type { ImageSourcePropType } from 'react-native';

import type { Course, CourseIcon } from './types';

// Static requires keep every separately generated icon visible to Metro.
export const jiahaoIcons: Record<string, ImageSourcePropType> = {
  home: require('../assets/images/jiahao-home.png'),
  schedule: require('../assets/images/jiahao-schedule.png'),
  assistant: require('../assets/images/jiahao-assistant.png'),
  insights: require('../assets/images/jiahao-insights.png'),
  profile: require('../assets/images/jiahao-profile.png'),
  import: require('../assets/images/jiahao-import.png'),
  focus: require('../assets/images/jiahao-focus.png'),
  grades: require('../assets/images/jiahao-grades.png'),
  previous: require('../assets/images/jiahao-previous.png'),
  next: require('../assets/images/jiahao-next.png'),
  add: require('../assets/images/jiahao-add.png'),
  send: require('../assets/images/jiahao-send.png'),
  alarm: require('../assets/images/jiahao-alarm.png'),
  settings: require('../assets/images/jiahao-settings.png'),
  study: require('../assets/images/jiahao-study.png'),
  school: require('../assets/images/jiahao-school.png'),
  cloud: require('../assets/images/jiahao-cloud.png'),
  lock: require('../assets/images/jiahao-lock.png'),
  export: require('../assets/images/jiahao-export.png'),
  restore: require('../assets/images/jiahao-restore.png'),
  thinking: require('../assets/images/jiahao-thinking.png'),
  camera: require('../assets/images/jiahao-camera.png'),
  web: require('../assets/images/jiahao-web.png'),
  book: require('../assets/images/jiahao-course-book.png'),
  flask: require('../assets/images/jiahao-course-flask.png'),
  code: require('../assets/images/jiahao-course-code.png'),
  atom: require('../assets/images/jiahao-course-atom.png'),
  art: require('../assets/images/jiahao-course-art.png'),
  sport: require('../assets/images/jiahao-course-sport.png'),
  calendar: require('../assets/images/jiahao-course-calendar.png'),
  sparkles: require('../assets/images/jiahao-course-sparkles.png'),
};

export function jiahaoCourseIcon(course: Course): ImageSourcePropType {
  const icon: CourseIcon = course.icon ?? (course.type === 'lab' ? 'flask' : course.type === 'elective' ? 'art' : course.type === 'general' ? 'calendar' : 'book');
  return jiahaoIcons[icon];
}
