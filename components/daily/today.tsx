import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { Choice, DailyForm, Field, HabitSymbol, TextButton, dailyStyles as s } from '@/components/daily/shared';
import { habitTemplates } from '@/components/daily/templates';
import { DailyTasks } from '@/components/daily/tasks';
import { MotionPressable, MotionReveal } from '@/components/motion';
import { Card, EmptyState, PrimaryButton } from '@/components/ui';
import { dailySummary, habitProgress, habitStats, isHabitDue, localDateKey, shiftDateKey } from '@/src/daily';
import type { Habit } from '@/src/daily-types';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

const periodNames = { any: '随时', morning: '早晨', afternoon: '午后', evening: '晚上' };

export function TodayPanel({ date, onDate }: { date: string; onDate: (value: string) => void }) {
  const app = useApp();
  const theme = useAppTheme();
  const today = localDateKey();
  const summary = dailySummary(app.data.daily, date);
  const [category, setCategory] = useState('全部');
  const [archived, setArchived] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [library, setLibrary] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const categories = ['全部', ...new Set(app.data.daily.habits.filter((habit) => habit.archived === archived).map((habit) => habit.category))];
  const habits = (archived || showAll ? app.data.daily.habits.filter((habit) => habit.archived === archived) : summary.due).filter((habit) => category === '全部' || habit.category === category).sort((a, b) => Number(b.important) - Number(a.important) || a.order - b.order);
  const openHabit = (habit: Habit) => { setEditing(habit); setAmount(String(habitProgress(app.data.daily, habit.id, date))); setNote(app.data.daily.logs.find((log) => log.habitId === habit.id && log.date === date)?.note ?? ''); setError(''); };
  const update = (habit: Habit, value: number, memo?: string) => { app.setHabitProgress(habit.id, date, value, memo); Haptics.selectionAsync().catch(() => undefined); };
  const weekStart = shiftDateKey(date, -(new Date(`${date}T12:00:00`).getDay() + 6) % 7);
  return <>
    <Card style={{ gap: 15 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}><Text style={{ color: theme.text, fontSize: 21, fontWeight: '600' }}>{date === today ? '把今天过成喜欢的样子' : `${Number(date.slice(5, 7))} 月 ${Number(date.slice(8))} 日`}</Text><Text style={[s.caption, { color: theme.secondary }]}>{summary.total ? `完成 ${summary.completed} / ${summary.total} 个小习惯` : '小小的坚持，也值得被记录'}</Text></View><Text style={{ color: theme.primary, fontSize: 29, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{Math.round(summary.rate * 100)}<Text style={{ fontSize: 14 }}>%</Text></Text></View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.surfaceAlt, overflow: 'hidden' }}><View style={{ height: 6, borderRadius: 3, width: `${Math.max(0, Math.min(100, summary.rate * 100))}%`, backgroundColor: theme.primary }} /></View>
      <View style={[s.row, { justifyContent: 'space-between', gap: 2 }]}>{Array.from({ length: 7 }, (_, index) => shiftDateKey(weekStart, index)).map((key, index) => <MotionPressable key={key} accessibilityLabel={`${key}${key === date ? ' 已选择' : ''}`} disabled={key > today} onPress={() => onDate(key)} style={{ flex: 1, minHeight: 64, borderRadius: 17, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: key > today ? 0.3 : 1, backgroundColor: key === date ? theme.primary : 'transparent' }}><Text style={{ fontSize: 12, color: key === date ? '#FFFFFF' : theme.secondary }}>{['一', '二', '三', '四', '五', '六', '日'][index]}</Text><Text style={{ fontSize: 17, color: key === date ? '#FFFFFF' : theme.text, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{Number(key.slice(8))}</Text></MotionPressable>)}</View>
      <View style={[s.row, { justifyContent: 'space-between' }]}><TextButton label="‹ 上一周" onPress={() => onDate(shiftDateKey(date, -7))} /><TextButton label={date === today ? date.slice(0, 7).replace('-', ' 年 ') + ' 月' : '回到今天'} onPress={() => onDate(today)} /><TextButton label="下一周 ›" disabled={shiftDateKey(weekStart, 7) > today} onPress={() => onDate(shiftDateKey(date, 7) > today ? today : shiftDateKey(date, 7))} /></View>
    </Card>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.sectionTitle, { color: theme.text }]}>{archived ? '归档习惯' : '我的小习惯'}</Text><TextButton label="＋ 新习惯" onPress={() => router.push('/habit-editor')} /></View>
    <ScrollView horizontal style={{ width: '100%', flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{categories.map((item) => <Choice key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}<Choice label="全部计划" selected={showAll && !archived} onPress={() => { setShowAll((value) => !value); setArchived(false); setCategory('全部'); }} /><Choice label="已归档" selected={archived} onPress={() => { setArchived((value) => !value); setCategory('全部'); }} /></ScrollView>
    {habits.length ? habits.map((habit, index) => {
      const value = habitProgress(app.data.daily, habit.id, date);
      const done = value >= habit.target;
      const due = isHabitDue(habit, date);
      const stats = habitStats(app.data.daily, habit, date);
      return <MotionReveal key={habit.id} delay={Math.min(index * 25, 100)}>
        <Card style={{ gap: 12, padding: 16 }}>
          <View style={s.row}><View style={{ width: 47, height: 47, borderRadius: 17, backgroundColor: `${habit.color}22`, alignItems: 'center', justifyContent: 'center' }}><HabitSymbol name={habit.icon} color={habit.color} /></View><MotionPressable onPress={() => openHabit(habit)} style={{ flex: 1, minHeight: 46, justifyContent: 'center' }}><Text style={{ color: theme.text, fontSize: 17, fontWeight: '600' }}>{habit.important ? '✦ ' : ''}{habit.title}</Text><Text style={[s.caption, { color: theme.secondary }]}>{habit.category} · {periodNames[habit.period]}{stats.currentStreak > 0 ? ` · 连续 ${stats.currentStreak} 次` : ''}</Text></MotionPressable>
            {archived ? <TextButton label="恢复" onPress={() => app.archiveHabit(habit.id, false)} /> : !due ? <TextButton label="编辑" onPress={() => openHabit(habit)} /> : <MotionPressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={done ? `撤销${habit.title}完成` : `记录${habit.title}`} onPress={() => habit.mode === 'check' || done ? update(habit, done ? 0 : habit.target) : openHabit(habit)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: done ? habit.color : theme.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><AppIcon ios={done ? 'checkmark' : 'plus'} android={done ? 'check' : 'add'} color={done ? '#FFFFFF' : habit.color} size={22} /></MotionPressable>}
          </View>
          {habit.mode !== 'check' ? <View style={{ gap: 8 }}><View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={{ fontSize: 13, color: theme.secondary, fontVariant: ['tabular-nums'] }}>{value} / {habit.target} {habit.unit}</Text>{due ? <View style={s.row}><TextButton label={`＋${habit.mode === 'minutes' ? '5 分钟' : `1 ${habit.unit}`}`} onPress={() => update(habit, value + (habit.mode === 'minutes' ? 5 : 1))} />{habit.mode === 'minutes' && date === today ? <TextButton label="去专注" onPress={() => router.push({ pathname: '/focus', params: { habitId: habit.id } })} /> : null}</View> : null}</View><View style={{ height: 4, borderRadius: 2, backgroundColor: theme.surfaceAlt }}><View style={{ height: 4, borderRadius: 2, backgroundColor: habit.color, width: `${Math.min(100, value / habit.target * 100)}%` }} /></View></View> : null}
          {!due && !archived ? <Text style={[s.caption, { color: theme.secondary }]}>所选日期没有安排 · 开始于 {habit.startDate}</Text> : null}
        </Card>
      </MotionReveal>;
    }) : <Card><EmptyState title={archived ? '暂时没有归档习惯' : '给生活加一点小期待'} body={archived ? '不再进行的习惯可以归档，已有记录会留下' : category !== '全部' ? '这个分类在所选日期没有安排' : '自己创建一个习惯，或者从下面的灵感开始'} /></Card>}
    <Card onPress={() => setLibrary(true)} style={[s.row, { paddingVertical: 15 }]}><View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}><AppIcon ios="sparkles" android="auto_awesome" color={theme.primary} /></View><View style={{ flex: 1 }}><Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>找一个容易开始的小习惯</Text><Text style={[s.caption, { color: theme.secondary }]}>阅读、运动、学习、生活 · 都能自己改</Text></View><AppIcon ios="chevron.right" android="chevron_right" color={theme.secondary} size={17} /></Card>
    <DailyTasks date={date} />
    <DailyForm visible={library} title="小习惯灵感" onClose={() => setLibrary(false)}>{habitTemplates.map((item) => <Card key={item.key} onPress={() => { setLibrary(false); router.push({ pathname: '/habit-editor', params: { template: item.key } }); }} style={s.row}><View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: `${item.habit.color}22`, alignItems: 'center', justifyContent: 'center' }}><HabitSymbol name={item.habit.icon} color={item.habit.color} /></View><View style={{ flex: 1 }}><Text style={{ fontSize: 17, color: theme.text, fontWeight: '600' }}>{item.title}</Text><Text style={[s.caption, { color: theme.secondary }]}>{item.description}</Text></View><AppIcon ios="plus.circle" android="add_circle_outline" color={theme.primary} /></Card>)}</DailyForm>
    <DailyForm visible={Boolean(editing)} title={editing?.title ?? '记录进度'} onClose={() => setEditing(null)}>{editing ? <>
      <Text style={[s.body, { color: theme.secondary }]}>{date} · 当前目标 {editing.target} {editing.unit}</Text>
      {isHabitDue(editing, date) ? <><Field label={editing.mode === 'check' ? '已完成填 1，未完成填 0' : `当天累计完成（${editing.unit}）`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="给这次坚持留句话" multiline value={note} onChangeText={setNote} placeholder="今天有什么感受？" maxLength={2000} /></> : <Text style={[s.body, { color: theme.secondary }]}>{editing.archived ? '这个习惯已归档，恢复后可以继续记录。' : '这一天不是这个习惯的执行日，可以修改计划后再打卡。'}</Text>}
      {error ? <Text style={[s.error, { color: theme.red }]}>{error}</Text> : null}
      {isHabitDue(editing, date) ? <PrimaryButton label="保存记录" onPress={() => { const value = Number(amount); if (!amount.trim() || !Number.isFinite(value) || value < 0 || value > 100000) return setError('请填写 0～100000 之间的有效数量'); update(editing, editing.mode === 'check' ? Math.min(1, value) : value, note); setEditing(null); }} /> : null}
      <PrimaryButton label="编辑习惯设置" secondary onPress={() => { const id = editing.id; setEditing(null); router.push({ pathname: '/habit-editor', params: { id } }); }} />
      <View style={s.row}><TextButton label="排序上移" onPress={() => app.reorderHabit(editing.id, -1)} /><TextButton label="排序下移" onPress={() => app.reorderHabit(editing.id, 1)} /></View>
      <TextButton label={editing.archived ? '恢复习惯' : '归档习惯 · 保留历史'} onPress={() => { app.archiveHabit(editing.id, !editing.archived); setEditing(null); }} />
    </> : null}</DailyForm>
  </>;
}
