import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { Choice, DailyForm, Field, HabitSymbol, TextButton, dailyStyles as s } from '@/components/daily/shared';
import { MotionPressable } from '@/components/motion';
import { Card, EmptyState, PrimaryButton } from '@/components/ui';
import { habitOnDate, habitStats, isHabitDue, localDateKey } from '@/src/daily';
import type { DailyCard } from '@/src/daily-types';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

function Keepsake({ card, onEdit }: { card: DailyCard; onEdit: () => void }) {
  const theme = useAppTheme();
  const [flipped, setFlipped] = useState(false);
  const turn = useSharedValue(0);
  const frontStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 850 }, { rotateY: `${turn.value * 180}deg` }] }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 850 }, { rotateY: `${turn.value * 180 + 180}deg` }] }));
  const flip = () => { setFlipped((value) => !value); turn.value = withTiming(flipped ? 0 : 1, { duration: 420, reduceMotion: ReduceMotion.System }); Haptics.selectionAsync().catch(() => undefined); };
  return <Card style={{ gap: 6 }}>
    <MotionPressable accessibilityLabel={`${card.date} 日签，点击翻面`} onPress={flip} style={{ height: 166 }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', justifyContent: 'center', alignItems: 'center', gap: 12 }, frontStyle]}>
        <AppIcon ios="leaf.fill" android="eco" color={theme.primary} size={34} />
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '600' }}>今天，也有好好生活</Text>
        <Text style={[s.caption, { color: theme.secondary }]}>{card.date} · 当日习惯全部完成</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', justifyContent: 'center', padding: 8, gap: 8 }, backStyle]}>
        <Text style={[s.label, { color: theme.primary }]}>留给这一天的话</Text>
        <Text numberOfLines={5} style={[s.body, { color: theme.text }]}>{card.note || '还没有留言，把那时的感受写下来吧'}</Text>
      </Animated.View>
    </MotionPressable>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.caption, { color: theme.secondary }]}>轻点翻面</Text><TextButton label={card.note ? '编辑留言' : '写句话'} onPress={onEdit} /></View>
  </Card>;
}

export function TracesPanel({ date, onDate }: { date: string; onDate: (date: string) => void }) {
  const app = useApp();
  const theme = useAppTheme();
  const today = localDateKey();
  const [month, setMonth] = useState(date.slice(0, 7));
  const [selected, setSelected] = useState(date);
  const [cardEditing, setCardEditing] = useState<DailyCard | null>(null);
  const [cardNote, setCardNote] = useState('');
  const [cardError, setCardError] = useState('');
  const [allCards, setAllCards] = useState(false);
  const [habitFilter, setHabitFilter] = useState('all');
  const [importantOnly, setImportantOnly] = useState(false);
  const filteredHabits = app.data.daily.habits.filter((habit) => (habitFilter === 'all' || habit.id === habitFilter) && (!importantOnly || habit.important));
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(year, monthNumber - 1, 1, 12);
  const padding = (first.getDay() + 6) % 7;
  const days = new Date(year, monthNumber, 0, 12).getDate();
  const rows = Math.ceil((days + padding) / 7);
  const completed = useMemo(() => {
    const habits = new Map(filteredHabits.map((habit) => [habit.id, habit]));
    const counts = new Map<string, number>();
    for (const log of app.data.daily.logs) {
      const habit = habits.get(log.habitId);
      if (habit && isHabitDue(habit, log.date) && log.value >= habitOnDate(habit, log.date).target) counts.set(log.date, (counts.get(log.date) ?? 0) + 1);
    }
    return counts;
  }, [app.data.daily.habits, app.data.daily.logs, habitFilter, importantOnly]);
  const monthEntries = [...completed].filter(([key]) => key.startsWith(month));
  const total = monthEntries.reduce((sum, [, count]) => sum + count, 0);
  const streaks = useMemo(() => filteredHabits.map((habit) => ({ habit, stats: habitStats(app.data.daily, habit, today) }))
    .sort((a, b) => b.stats.completedDays - a.stats.completedDays), [app.data.daily, today, habitFilter, importantOnly]);
  const cards = [...app.data.daily.cards].sort((a, b) => b.date.localeCompare(a.date));
  const selectedLogs = app.data.daily.logs.filter((log) => log.date === selected && filteredHabits.some((habit) => habit.id === log.habitId) && (log.value > 0 || log.note));
  const annual = Array.from({ length: 12 }, (_, index) => [...completed].filter(([key]) => key.startsWith(`${year}-${String(index + 1).padStart(2, '0')}`)).reduce((sum, [, count]) => sum + count, 0));
  const annualMax = Math.max(1, ...annual);
  const changeMonth = (delta: number) => {
    const next = new Date(year, monthNumber - 1 + delta, 1, 12);
    const key = localDateKey(next);
    setMonth(key.slice(0, 7));
    setSelected(key.slice(0, 7) === today.slice(0, 7) ? today : key);
  };
  return <>
    <View style={s.wrap}><Choice label="全部习惯" selected={habitFilter === 'all'} onPress={() => setHabitFilter('all')} /><Choice label="只看重要" selected={importantOnly} onPress={() => setImportantOnly((value) => !value)} />{app.data.daily.habits.map((habit) => <Choice key={habit.id} label={habit.title} selected={habitFilter === habit.id} onPress={() => setHabitFilter(habit.id)} />)}</View>
    <Card style={{ gap: 16 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.sectionTitle, { color: theme.text }]}>一点点，走得很远</Text><AppIcon ios="chart.bar.fill" android="bar_chart" color={theme.primary} size={25} /></View>
      <View style={s.row}>{[{ value: monthEntries.length, label: '本月坚持天数' }, { value: total, label: '本月完成次数' }, { value: app.data.daily.cards.length, label: '收藏日签' }].map((item) => <View key={item.label} style={{ flex: 1, gap: 5 }}><Text style={{ color: theme.primary, fontSize: 30, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{item.value}</Text><Text style={[s.caption, { color: theme.secondary }]}>{item.label}</Text></View>)}</View>
      <View style={[s.row, { justifyContent: 'space-between' }]}><TextButton label="‹ 上个月" onPress={() => changeMonth(-1)} /><Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>{year} 年 {monthNumber} 月</Text><TextButton label="下个月 ›" disabled={month >= today.slice(0, 7)} onPress={() => changeMonth(1)} /></View>
      <View style={{ flexDirection: 'row', gap: 5 }}>{['一', '二', '三', '四', '五', '六', '日'].map((label) => <Text key={label} style={{ flex: 1, textAlign: 'center', color: theme.secondary, fontSize: 12 }}>{label}</Text>)}</View>
      {Array.from({ length: rows }, (_, row) => <View key={row} style={{ flexDirection: 'row', gap: 5 }}>{Array.from({ length: 7 }, (_, column) => {
        const day = row * 7 + column - padding + 1;
        if (day < 1 || day > days) return <View key={column} style={{ flex: 1 }} />;
        const key = `${month}-${String(day).padStart(2, '0')}`;
        const count = completed.get(key) ?? 0;
        const background = count >= 4 ? theme.primary : count > 0 ? theme.primarySoft : theme.surfaceAlt;
        return <MotionPressable key={key} accessibilityLabel={`${key}，完成 ${count} 次`} accessibilityState={{ selected: selected === key }} disabled={key > today} onPress={() => setSelected(key)} style={{ flex: 1, height: 43, borderRadius: 11, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: background, borderWidth: 1.5, borderColor: selected === key ? theme.primary : 'transparent', opacity: key > today ? 0.32 : 1 }}><Text style={{ color: count >= 4 ? '#FFFFFF' : theme.text, fontSize: 13, fontVariant: ['tabular-nums'] }}>{day}</Text>{count ? <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: count >= 4 ? '#FFFFFF' : theme.primary }} /> : null}</MotionPressable>;
      })}</View>)}
      <Text style={[s.caption, { color: theme.secondary }]}>颜色越深，完成越多 · 点击日期看记录</Text>
    </Card>
    <Card style={{ gap: 12 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={{ color: theme.text, fontSize: 17, fontWeight: '600' }}>{selected} 的足迹</Text><TextButton label="查看当天" onPress={() => onDate(selected)} /></View>
      {selectedLogs.length ? selectedLogs.map((log) => {
        const current = app.data.daily.habits.find((item) => item.id === log.habitId);
        const habit = current ? habitOnDate(current, log.date) : undefined;
        return <View key={log.id} style={s.row}><HabitSymbol name={habit?.icon ?? 'leaf'} color={habit?.color ?? theme.primary} size={20} /><View style={{ flex: 1 }}><Text style={{ fontSize: 15, color: theme.text }}>{habit?.title ?? '已归档习惯'} · {log.value} {habit?.unit ?? '次'}</Text>{log.note ? <Text style={[s.caption, { color: theme.secondary }]}>{log.note}</Text> : null}</View></View>;
      }) : <Text style={[s.body, { color: theme.secondary }]}>这一天还没有记录。休息一下，也没关系。</Text>}
    </Card>
    <Card style={{ gap: 16 }}><Text style={[s.sectionTitle, { color: theme.text }]}>{year} 年的坚持</Text><View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 5 }}>{annual.map((count, index) => <View key={index} style={{ flex: 1, alignItems: 'center', gap: 7 }} accessible accessibilityLabel={`${index + 1} 月完成 ${count} 次`}><View style={{ width: '70%', height: Math.max(3, count / annualMax * 68), backgroundColor: count ? theme.primary : theme.surfaceAlt, borderRadius: 5 }} /><Text style={{ fontSize: 10, color: theme.secondary }}>{index + 1}</Text></View>)}</View><Text style={[s.caption, { color: theme.secondary }]}>每月完成次数 · 按当时的计划和目标计算，归档后仍会保留</Text></Card>
    <Card onPress={() => router.push('/daily-review')} style={s.row}><AppIcon ios="sparkles" android="auto_awesome" color={theme.primary} size={26} /><View style={{ flex: 1 }}><Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>让 AI 陪你复盘这一周</Text><Text style={[s.caption, { color: theme.secondary }]}>结合习惯与专注汇总，找到下一小步</Text></View><AppIcon ios="chevron.right" android="chevron_right" color={theme.secondary} size={18} /></Card>
    <Text style={[s.sectionTitle, { color: theme.text }]}>每份坚持，都有痕迹</Text>
    {streaks.length ? streaks.map(({ habit, stats }) => <Card key={habit.id} style={{ gap: 11 }}><View style={s.row}><HabitSymbol name={habit.icon} color={habit.color} /><Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' }}>{habit.title}{habit.archived ? ' · 已归档' : ''}</Text></View><View style={{ flexDirection: 'row', gap: 9 }}>{[{ label: '连续完成', value: `${stats.currentStreak} 次` }, { label: '最长连续', value: `${stats.longestStreak} 次` }, { label: '累计完成', value: `${stats.completedDays} 天` }].map((item) => <View key={item.label} style={{ flex: 1, gap: 4 }}><Text style={{ color: theme.text, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{item.value}</Text><Text style={[s.caption, { color: theme.secondary }]}>{item.label}</Text></View>)}</View><Text style={[s.caption, { color: theme.secondary }]}>按计划执行日计算，休息日不会中断连续记录</Text></Card>) : <Card><EmptyState title="从第一个习惯开始" body="开始打卡后，你的连续记录会出现在这里" /></Card>}
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.sectionTitle, { color: theme.text }]}>收藏好好生活的日子</Text>{cards.length > 8 ? <TextButton label={allCards ? '收起' : `全部 ${cards.length} 张`} onPress={() => setAllCards((value) => !value)} /> : null}</View>
    {cards.length ? (allCards ? cards : cards.slice(0, 8)).map((card) => <Keepsake key={card.date} card={card} onEdit={() => { setCardEditing(card); setCardNote(card.note); setCardError(''); }} />) : <Card><EmptyState title="你的第一张日签，还在路上" body="完成某天全部已安排的习惯，即可获得那一天的日签，翻到背面留下一句话" /></Card>}
    <DailyForm visible={Boolean(cardEditing)} title={`${cardEditing?.date ?? ''} 的留言`} onClose={() => setCardEditing(null)}>
      <Field label="为这张日签留句话" multiline value={cardNote} onChangeText={setCardNote} maxLength={5000} placeholder="想对这一天的自己说些什么？" />
      {cardError ? <Text accessibilityRole="alert" style={[s.error, { color: theme.red }]}>{cardError}</Text> : null}
      <PrimaryButton label="保存留言" onPress={() => { if (!cardEditing) return; try { app.saveDailyCardNote(cardEditing.date, cardNote); setCardEditing(null); } catch (caught) { setCardError(caught instanceof Error ? caught.message : '保存失败'); } }} />
    </DailyForm>
  </>;
}
