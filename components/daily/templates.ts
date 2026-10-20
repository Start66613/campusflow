import type { HabitInput } from '@/src/daily-types';

export const habitTemplates: { key: string; title: string; description: string; habit: Pick<HabitInput, 'title' | 'icon' | 'color' | 'category' | 'mode' | 'target' | 'unit' | 'period' | 'weekdays'> }[] = [
  { key: 'read', title: '读几页书', description: '每天留 20 分钟给阅读', habit: { title: '读几页书', icon: 'book', color: '#5E5CE6', category: '成长', mode: 'minutes', target: 20, unit: '分钟', period: 'evening', weekdays: [1, 2, 3, 4, 5, 6, 7] } },
  { key: 'water', title: '认真喝水', description: '目标可按自己的需要调整', habit: { title: '认真喝水', icon: 'water', color: '#2D83C5', category: '健康', mode: 'count', target: 6, unit: '杯', period: 'any', weekdays: [1, 2, 3, 4, 5, 6, 7] } },
  { key: 'walk', title: '出门走走', description: '放下手机，散步 20 分钟', habit: { title: '出门走走', icon: 'walk', color: '#258B73', category: '健康', mode: 'minutes', target: 20, unit: '分钟', period: 'afternoon', weekdays: [1, 2, 3, 4, 5, 6, 7] } },
  { key: 'word', title: '复习英语单词', description: '从每天 20 个开始', habit: { title: '复习英语单词', icon: 'study', color: '#9572BD', category: '学习', mode: 'count', target: 20, unit: '个', period: 'morning', weekdays: [1, 2, 3, 4, 5] } },
  { key: 'sleep', title: '睡前放下手机', description: '给今天一个安静的收尾', habit: { title: '睡前放下手机', icon: 'moon', color: '#657B89', category: '生活', mode: 'check', target: 1, unit: '次', period: 'evening', weekdays: [1, 2, 3, 4, 5, 6, 7] } },
  { key: 'tidy', title: '整理书桌', description: '收拾一点，轻松一点', habit: { title: '整理书桌', icon: 'leaf', color: '#C36A3D', category: '生活', mode: 'check', target: 1, unit: '次', period: 'evening', weekdays: [1, 2, 3, 4, 5, 6, 7] } },
];
