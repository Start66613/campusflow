import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { gentleEnter, MotionPressable } from '@/components/motion';
import { Card, GlassBackdrop, Pill, Screen, SectionTitle } from '@/components/ui';
import { currentWeek, formatDateTime, nextCourse, relativeDue, weekdays } from '@/src/date';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export default function HomeScreen() {
  const theme = useAppTheme();
  const { data, toggleTask } = useApp();
  const upcoming = useMemo(() => nextCourse(data.courses), [data.courses]);
  const pendingTasks = data.tasks.filter((task) => !task.completed).slice(0, 3);
  const today = new Date();
  const week = currentWeek(data.settings.termStart);
  const spentToday = data.expenses
    .filter((expense) => new Date(expense.occurredAt).toDateString() === today.toDateString())
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.secondary }]}>{today.getMonth() + 1}月{today.getDate()}日 · {weekdays[(today.getDay() || 7) - 1]}</Text>
          <Text style={[styles.greeting, { color: theme.text }]}>早上好，{data.settings.displayName}</Text>
        </View>
        <MotionPressable onPress={() => router.push('/modal')} style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
          <Text style={styles.avatarText}>🎓</Text>
        </MotionPressable>
      </View>

      <Animated.View entering={gentleEnter(70)}>
        <LinearGradient colors={['#6269EB', '#8782F4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroKicker}>下一节课</Text>
            <View style={styles.weekBadge}><Text style={styles.weekBadgeText}>第 {week} 周</Text></View>
          </View>
          {upcoming ? (
            <>
              <Text style={styles.heroTitle}>{upcoming.course.name}</Text>
              <Text style={styles.heroMeta}>{formatDateTime(upcoming.start)} · {upcoming.course.location}</Text>
              <View style={styles.teacherRow}>
                <Text style={styles.teacher}>{upcoming.course.teacher}</Text>
                <Text style={styles.heroArrow}>›</Text>
              </View>
            </>
          ) : <Text style={styles.heroTitle}>近期没有课程</Text>}
          <View pointerEvents="none" style={styles.heroGlow} />
        </LinearGradient>
      </Animated.View>

      <View style={styles.quickGrid}>
        <QuickAction icon="✦" label="AI 快记" color="#ECECFF" delay={120} onPress={() => router.push('/assistant')} />
        <QuickAction icon="▦" label="导入课表" color="#E3F4EE" delay={170} onPress={() => router.push('/import')} />
        <QuickAction icon="◎" label="专注 25 分" color="#FFF0E8" delay={220} onPress={() => router.push('/focus')} />
        <QuickAction icon="↗" label="成绩分析" color="#F2E9FA" delay={270} onPress={() => router.push('/insights')} />
      </View>

      <SectionTitle title="今日概览" />
      <View style={styles.metricRow}>
        <Card style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: theme.secondary }]}>今日消费</Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>¥{spentToday.toFixed(1)}</Text>
          <Pill tone="green">记录 {data.expenses.filter((e) => new Date(e.occurredAt).toDateString() === today.toDateString()).length} 笔</Pill>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: theme.secondary }]}>本周专注</Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>{Math.floor(data.focusMinutesThisWeek / 60)}h {data.focusMinutesThisWeek % 60}m</Text>
          <Pill tone="orange">继续保持</Pill>
        </Card>
      </View>

      <SectionTitle title="待办事项" action="AI 添加" onAction={() => router.push('/assistant')} />
      <Card style={styles.taskCard}>
        {pendingTasks.map((task, index) => (
          <MotionPressable key={task.id} onPress={() => toggleTask(task.id)} style={[styles.taskRow, index > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.checkbox, { borderColor: theme.primary }]} />
            <View style={styles.taskText}>
              <Text numberOfLines={1} style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
              <Text style={[styles.taskDue, { color: relativeDue(task.dueAt) === '已逾期' ? theme.red : theme.secondary }]}>{relativeDue(task.dueAt)}</Text>
            </View>
            <Text style={[styles.chevron, { color: theme.secondary }]}>›</Text>
          </MotionPressable>
        ))}
      </Card>

      <Card style={[styles.studyCard, { backgroundColor: theme.primarySoft }]} onPress={() => router.push('/focus')}>
        <View style={styles.studyIcon}><Text style={styles.studyEmoji}>📖</Text></View>
        <View style={styles.studyCopy}>
          <Text style={[styles.studyTitle, { color: theme.text }]}>今晚有一段空闲时间</Text>
          <Text style={[styles.studyBody, { color: theme.secondary }]}>建议 20:00 开始一个 25 分钟番茄钟</Text>
        </View>
        <Text style={[styles.chevron, { color: theme.primary }]}>›</Text>
      </Card>
    </Screen>
  );
}

function QuickAction({ icon, label, color, delay, onPress }: { icon: string; label: string; color: string; delay: number; onPress: () => void }) {
  const theme = useAppTheme();
  const { data } = useApp();
  const glass = data.settings.visualMode === 'glass';
  return (
    <Animated.View entering={gentleEnter(delay)} style={styles.quick}>
      <MotionPressable onPress={onPress} style={styles.quickPressable}>
        <View style={[styles.quickIcon, { backgroundColor: glass ? 'transparent' : color }]}>
          {glass ? <GlassBackdrop radius={19} tintColor={color} tintStrength="soft" /> : null}
          <Text style={[styles.quickGlyph, { color: theme.text }]}>{icon}</Text>
        </View>
        <Text style={[styles.quickLabel, { color: theme.text }]}>{label}</Text>
      </MotionPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 20 },
  eyebrow: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
  greeting: { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 23 },
  hero: { borderRadius: 30, padding: 22, minHeight: 190, overflow: 'hidden', shadowColor: '#4541A8', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.18, shadowRadius: 22, elevation: 4 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroKicker: { color: '#E9E9FF', fontSize: 14, fontWeight: '700' },
  weekBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  weekBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', fontSize: 29, fontWeight: '800', marginTop: 28, letterSpacing: -0.7 },
  heroMeta: { color: '#EEEFFF', fontSize: 14, marginTop: 8, fontWeight: '600' },
  teacherRow: { marginTop: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teacher: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  heroArrow: { color: '#FFFFFF', fontSize: 28 },
  heroGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)', right: -45, bottom: -55 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  quick: { width: '23%', alignItems: 'center' },
  quickPressable: { width: '100%', alignItems: 'center' },
  quickIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickGlyph: { fontSize: 23, fontWeight: '800' },
  quickLabel: { fontSize: 12, fontWeight: '600' },
  metricRow: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, padding: 16 },
  metricLabel: { fontSize: 12, fontWeight: '600' },
  metricValue: { fontSize: 23, fontWeight: '800', marginVertical: 9, letterSpacing: -0.6 },
  taskCard: { paddingVertical: 3, paddingHorizontal: 16 },
  taskRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 21, height: 21, borderRadius: 7, borderWidth: 2 },
  taskText: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  taskDue: { fontSize: 12, fontWeight: '600' },
  chevron: { fontSize: 26, fontWeight: '300' },
  studyCard: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 16, padding: 16 },
  studyIcon: { width: 45, height: 45, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
  studyEmoji: { fontSize: 22 },
  studyCopy: { flex: 1 },
  studyTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  studyBody: { fontSize: 12, lineHeight: 17 },
});
