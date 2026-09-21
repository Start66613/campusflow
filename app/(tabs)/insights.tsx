import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { gentleEnter, gentleLayout, MotionPressable } from '@/components/motion';
import { Card, Pill, Screen, SectionTitle } from '@/components/ui';
import { formatCurrency } from '@/src/date';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export default function InsightsScreen() {
  const theme = useAppTheme();
  const { data } = useApp();
  const [mode, setMode] = useState<'overview' | 'grades'>('overview');
  const totalCredits = data.grades.reduce((sum, grade) => sum + grade.credit, 0);
  const gpa = totalCredits ? data.grades.reduce((sum, grade) => sum + grade.gpa * grade.credit, 0) / totalCredits : 0;
  const weekExpense = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const completed = data.tasks.filter((task) => task.completed).length;
  const completion = data.tasks.length ? completed / data.tasks.length : 0;
  const categories = useMemo(() => Object.entries(data.expenses.reduce<Record<string, number>>((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + expense.amount;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]), [data.expenses]);

  return (
    <Screen>
      <Text style={[styles.kicker, { color: theme.secondary }]}>每周自动复盘</Text><Text style={[styles.title, { color: theme.text }]}>学习与生活数据</Text>
      <View style={[styles.segment, { backgroundColor: theme.surfaceAlt }]}>
        {(['overview', 'grades'] as const).map((item) => <MotionPressable key={item} onPress={() => setMode(item)} style={[styles.segmentItem, mode === item && styles.segmentActive, mode === item && { backgroundColor: theme.surface, shadowColor: theme.shadow }]}><Text style={[styles.segmentText, { color: mode === item ? theme.text : theme.secondary }]}>{item === 'overview' ? '本周报告' : '成绩与 GPA'}</Text></MotionPressable>)}
      </View>

      {mode === 'overview' ? (
        <Animated.View key="overview" entering={FadeIn.duration(260).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)} layout={gentleLayout}>
          <Card style={[styles.reportHero, { backgroundColor: '#243B36' }]}>
            <Pill tone="green">第 3 周周报</Pill><Text style={styles.reportTitle}>这周，你的节奏更稳了</Text><Text style={styles.reportBody}>专注时间比上周多 45 分钟。晚间餐饮支出略高，下周可试试提前规划。</Text>
          </Card>
          <View style={styles.metrics}>
            <Metric value={`${Math.floor(data.focusMinutesThisWeek / 60)}h ${data.focusMinutesThisWeek % 60}m`} label="专注时长" color={theme.primary} delay={80} />
            <Metric value={`${Math.round(completion * 100)}%`} label="任务完成" color={theme.green} delay={140} />
            <Metric value={formatCurrency(weekExpense)} label="本周消费" color={theme.orange} delay={200} />
          </View>
          <SectionTitle title="消费习惯" />
          <Card>
            {categories.map(([category, amount]) => (
              <View key={category} style={styles.barRow}>
                <Text style={[styles.barLabel, { color: theme.text }]}>{category}</Text>
                <AnimatedBar fraction={Math.max(0.1, amount / Math.max(weekExpense, 1))} color={theme.orange} trackColor={theme.surfaceAlt} />
                <Text style={[styles.barValue, { color: theme.secondary }]}>¥{amount.toFixed(0)}</Text>
              </View>
            ))}
          </Card>
          <SectionTitle title="出勤概览" />
          <Card style={styles.attendance}><View><Text style={[styles.attendanceValue, { color: theme.text }]}>100%</Text><Text style={[styles.attendanceLabel, { color: theme.secondary }]}>按时到课</Text></View><View style={[styles.ring, { borderColor: theme.green }]}><Text style={styles.ringEmoji}>✓</Text></View></Card>
        </Animated.View>
      ) : (
        <Animated.View key="grades" entering={FadeIn.duration(260).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)} layout={gentleLayout}>
          <Card style={[styles.gpaHero, { backgroundColor: theme.primary }]}>
            <Text style={styles.gpaLabel}>加权 GPA</Text><Text style={styles.gpaValue}>{gpa.toFixed(2)}</Text><Text style={styles.gpaMeta}>{totalCredits} 学分 · 4.0 满绩</Text>
          </Card>
          <SectionTitle title="课程成绩" action="教务同步" />
          <Card style={styles.gradeList}>
            {data.grades.map((grade, index) => (
              <View key={grade.id} style={[styles.gradeRow, index > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <View style={[styles.scoreBadge, { backgroundColor: grade.score >= 90 ? `${theme.green}22` : theme.primarySoft }]}><Text style={[styles.score, { color: grade.score >= 90 ? theme.green : theme.primary }]}>{grade.score}</Text></View>
                <View style={{ flex: 1 }}><Text style={[styles.gradeName, { color: theme.text }]}>{grade.course}</Text><Text style={[styles.gradeMeta, { color: theme.secondary }]}>{grade.credit} 学分</Text></View>
                <Text style={[styles.gradeGpa, { color: theme.text }]}>{grade.gpa.toFixed(1)}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}
    </Screen>
  );
}

function Metric({ value, label, color, delay }: { value: string; label: string; color: string; delay: number }) {
  const theme = useAppTheme();
  return <Animated.View entering={gentleEnter(delay)} style={styles.metricWrap}><Card style={styles.metric}><View style={[styles.metricDot, { backgroundColor: color }]} /><Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text><Text style={[styles.metricLabel, { color: theme.secondary }]}>{label}</Text></Card></Animated.View>;
}

function AnimatedBar({ fraction, color, trackColor }: { fraction: number; color: string; trackColor: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(180, withTiming(fraction, { duration: 650, reduceMotion: ReduceMotion.System }));
  }, [fraction, progress]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  return <View style={[styles.barTrack, { backgroundColor: trackColor }]}><Animated.View style={[styles.barFill, { backgroundColor: color }, style]} /></View>;
}

const styles = StyleSheet.create({
  kicker: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 4 }, title: { fontSize: 32, fontWeight: '800', letterSpacing: -1.05 },
  segment: { flexDirection: 'row', borderRadius: 14, padding: 3, marginVertical: 20 }, segmentItem: { flex: 1, alignItems: 'center', borderRadius: 11, paddingVertical: 9 }, segmentActive: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 }, segmentText: { fontSize: 13, fontWeight: '600' },
  reportHero: { padding: 22, borderColor: 'transparent' }, reportTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 24, marginBottom: 8 }, reportBody: { color: '#C6D6D0', fontSize: 13, lineHeight: 20 },
  metrics: { flexDirection: 'row', gap: 9, marginTop: 12 }, metricWrap: { flex: 1 }, metric: { padding: 13, minHeight: 108, borderRadius: 21 }, metricDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 15 }, metricValue: { fontSize: 18, fontWeight: '800', marginBottom: 5 }, metricLabel: { fontSize: 11, fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 9 }, barLabel: { width: 45, fontSize: 13, fontWeight: '700' }, barTrack: { flex: 1, height: 8, borderRadius: 5, overflow: 'hidden' }, barFill: { width: '100%', height: 8, borderRadius: 5, transformOrigin: 'left center' }, barValue: { width: 44, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  attendance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, attendanceValue: { fontSize: 29, fontWeight: '900' }, attendanceLabel: { fontSize: 12, marginTop: 4 }, ring: { width: 52, height: 52, borderRadius: 26, borderWidth: 6, alignItems: 'center', justifyContent: 'center' }, ringEmoji: { fontSize: 18, color: '#2D9B75', fontWeight: '900' },
  gpaHero: { alignItems: 'center', paddingVertical: 28, borderColor: 'transparent' }, gpaLabel: { color: '#E8E9FF', fontSize: 13, fontWeight: '600' }, gpaValue: { color: '#FFFFFF', fontSize: 58, fontWeight: '800', letterSpacing: -2, marginVertical: 6 }, gpaMeta: { color: '#E8E9FF', fontSize: 12 },
  gradeList: { paddingVertical: 2 }, gradeRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, gap: 12 }, scoreBadge: { width: 47, height: 47, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, score: { fontWeight: '900', fontSize: 16 }, gradeName: { fontSize: 15, fontWeight: '800', marginBottom: 4 }, gradeMeta: { fontSize: 12 }, gradeGpa: { fontSize: 17, fontWeight: '900' },
});
