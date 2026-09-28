import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { gentleEnter, gentleLayout, gentleTextEnter, MotionPressable } from '@/components/motion';
import { SegmentedControl } from '@/components/segmented-control';
import { SettingToggle } from '@/components/setting-toggle';
import { Card, Pill, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
import { formatCurrency } from '@/src/date';
import { generateGradeAnalysis, type GradeAnalysis } from '@/src/grade-analysis';
import { gradeCategory, summarizeGrades } from '@/src/grades';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export default function InsightsScreen() {
  const theme = useAppTheme();
  const { data, updateGradeCategory } = useApp();
  const [mode, setMode] = useState<'overview' | 'grades'>('overview');
  const [online, setOnline] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GradeAnalysis | null>(null);
  useEffect(() => setAnalysis(null), [data.grades, data.settings.major, data.settings.studyGoal, online]);
  const gradeSummary = useMemo(() => summarizeGrades(data.grades), [data.grades]);
  const weekExpense = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const completed = data.tasks.filter((task) => task.completed).length;
  const completion = data.tasks.length ? completed / data.tasks.length : 0;
  const categories = useMemo(() => Object.entries(data.expenses.reduce<Record<string, number>>((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + expense.amount;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]), [data.expenses]);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      setAnalysis(await generateGradeAnalysis({ grades: data.grades, major: data.settings.major ?? '', goal: data.settings.studyGoal ?? '', online }));
    } catch (error) {
      Alert.alert('暂时无法分析', error instanceof Error ? error.message : '请检查 AI 配置和网络');
    } finally { setAnalyzing(false); }
  };

  return (
    <Screen>
      <Text style={[styles.kicker, { color: theme.secondary }]}>每周自动复盘</Text><Text style={[styles.title, { color: theme.text }]}>学习与生活数据</Text>
      <View style={styles.segment}>
        <SegmentedControl
          items={[{ value: 'overview', label: '本周报告' }, { value: 'grades', label: '成绩与 GPA' }]}
          value={mode}
          onChange={(value) => setMode(value as 'overview' | 'grades')}
        />
      </View>

      {mode === 'overview' ? (
        <Animated.View key="overview" entering={gentleEnter()} layout={gentleLayout}>
          <Card glassSurface={false} style={[styles.reportHero, { backgroundColor: '#243B36' }]}>
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
        <Animated.View key="grades" entering={gentleEnter()} layout={gentleLayout}>
          <Card glassSurface={false} style={[styles.gpaHero, { backgroundColor: theme.primary }]}>
            <Text style={styles.gpaLabel}>必修课 GPA</Text><Animated.View key={gradeSummary.gpa?.toFixed(2) ?? '--'} entering={gentleTextEnter()}><Text style={styles.gpaValue}>{gradeSummary.gpa?.toFixed(2) ?? '--'}</Text></Animated.View><Text style={styles.gpaMeta}>{gradeSummary.requiredCredits} 必修学分 · 4.0 满绩</Text>
          </Card>
          <Card style={styles.creditCard}>
            <View style={styles.creditRow}><Text style={[styles.creditLabel, { color: theme.secondary }]}>已获选修学分</Text><Text style={[styles.creditValue, { color: theme.text }]}>{gradeSummary.electiveCredits}</Text></View>
            <Text style={[styles.creditNote, { color: theme.secondary }]}>选修课只计入上方学分，不参与此处必修课 GPA；其他用途的官方绩点请以教务系统为准。</Text>
            {gradeSummary.unknownCount > 0 ? <Text style={[styles.unknownNote, { color: theme.orange }]}>{gradeSummary.unknownCount} 门课程性质待确认，暂未纳入计算。点下方课程可更正。</Text> : null}
          </Card>
          <SectionTitle title="AI 学业与未来方向" />
          <Card style={styles.analysisCard}>
            <MotionPressable onPress={() => router.push('/personalize')}><Text style={[styles.goalLink, { color: theme.primary }]}>当前专业：{data.settings.major || '未填写'} · 目标：{data.settings.studyGoal || '未填写'}　› 编辑</Text></MotionPressable>
            <View style={styles.onlineRow}><View style={styles.onlineCopy}><Text style={[styles.onlineTitle, { color: theme.text }]}>联网参考新政策与方向</Text><Text style={[styles.creditNote, { color: theme.secondary }]}>可选；只需 DeepSeek Key，网页会列出来源供你核对。</Text></View><SettingToggle label="联网参考新政策" value={online} onValueChange={setOnline} /></View>
            <Text style={[styles.creditNote, { color: theme.secondary }]}>仅在你点击时，把成绩、专业与目标发给 DeepSeek；联网由 DeepSeek 搜索，会产生额外 token 消耗。</Text>
            <PrimaryButton label={analyzing ? '正在分析…' : analysis ? '重新生成分析' : '生成个性化分析'} onPress={analyze} disabled={analyzing} />
            {analyzing ? <ActivityIndicator color={theme.primary} /> : null}
            {analysis ? <View style={styles.analysisResult}>
              <Text style={[styles.analysisOverview, { color: theme.text }]}>{analysis.overview}</Text>
              <AnalysisSection title="你的优势" items={analysis.strengths} />
              <AnalysisSection title="优先补强" items={analysis.priorities} />
              <AnalysisSection title="接下来怎么做" items={analysis.nextSteps} />
              <AnalysisSection title="考研方向" items={[analysis.postgraduate]} />
              <AnalysisSection title="求职方向" items={[analysis.career]} />
              {analysis.sources.length ? <View style={styles.sources}><Text style={[styles.analysisHeading, { color: theme.text }]}>联网参考来源</Text>{analysis.sources.map((source, index) => <MotionPressable key={source.url} onPress={() => Linking.openURL(source.url).catch(() => undefined)}><Text style={[styles.sourceLink, { color: theme.primary }]}>[{index + 1}] {source.title}{source.publishedDate ? ` · ${source.publishedDate}` : ''}</Text></MotionPressable>)}</View> : <Text style={[styles.creditNote, { color: theme.secondary }]}>本次未联网；政策、招生与招聘信息需查看最新官方公告。</Text>}
            </View> : null}
          </Card>
          <SectionTitle title="课程成绩" action="教务同步" onAction={() => router.push('/school')} />
          <Card style={styles.gradeList}>
            {data.grades.map((grade, index) => (
              <MotionPressable key={grade.id} accessibilityRole="button" accessibilityLabel={`${grade.course}，设置课程性质`} onPress={() => Alert.alert('设置课程性质', `${grade.course}${grade.courseNature ? ` · 教务：${grade.courseNature}` : ''}`, [
                { text: '必修课', onPress: () => updateGradeCategory(grade.id, 'required') },
                { text: '选修课', onPress: () => updateGradeCategory(grade.id, 'elective') },
                { text: '暂不确定', onPress: () => updateGradeCategory(grade.id, 'unknown') },
                { text: '取消', style: 'cancel' },
              ])} style={[styles.gradeRow, index > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <View style={[styles.scoreBadge, { backgroundColor: grade.score >= 90 ? `${theme.green}22` : theme.primarySoft }]}><Text style={[styles.score, { color: grade.score >= 90 ? theme.green : theme.primary }]}>{grade.score}</Text></View>
                <View style={{ flex: 1 }}><Text style={[styles.gradeName, { color: theme.text }]}>{grade.course}</Text><Text style={[styles.gradeMeta, { color: theme.secondary }]}>{grade.credit} 学分 · {gradeCategory(grade) === 'required' ? '必修' : gradeCategory(grade) === 'elective' ? '选修' : '待确认'}{grade.categoryManual ? ' · 已更正' : ''}</Text></View>
                <Text style={[styles.gradeGpa, { color: theme.text }]}>{grade.gpa.toFixed(1)}</Text>
              </MotionPressable>
            ))}
          </Card>
        </Animated.View>
      )}
    </Screen>
  );
}

function AnalysisSection({ title, items }: { title: string; items: string[] }) {
  const theme = useAppTheme();
  if (!items.length) return null;
  return <View style={styles.analysisSection}><Text style={[styles.analysisHeading, { color: theme.text }]}>{title}</Text>{items.map((item, index) => <Text key={`${title}-${index}`} style={[styles.analysisBody, { color: theme.secondary }]}>• {item}</Text>)}</View>;
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
  segment: { marginVertical: 20 },
  reportHero: { padding: 22, borderColor: 'transparent' }, reportTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 24, marginBottom: 8 }, reportBody: { color: '#C6D6D0', fontSize: 13, lineHeight: 20 },
  metrics: { flexDirection: 'row', gap: 9, marginTop: 12 }, metricWrap: { flex: 1 }, metric: { padding: 13, minHeight: 108, borderRadius: 21 }, metricDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 15 }, metricValue: { fontSize: 18, fontWeight: '800', marginBottom: 5 }, metricLabel: { fontSize: 11, fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 9 }, barLabel: { width: 45, fontSize: 13, fontWeight: '700' }, barTrack: { flex: 1, height: 8, borderRadius: 5, overflow: 'hidden' }, barFill: { width: '100%', height: 8, borderRadius: 5, transformOrigin: 'left center' }, barValue: { width: 44, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  attendance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, attendanceValue: { fontSize: 29, fontWeight: '900' }, attendanceLabel: { fontSize: 12, marginTop: 4 }, ring: { width: 52, height: 52, borderRadius: 26, borderWidth: 6, alignItems: 'center', justifyContent: 'center' }, ringEmoji: { fontSize: 18, color: '#2D9B75', fontWeight: '900' },
  gpaHero: { alignItems: 'center', paddingVertical: 28, borderColor: 'transparent' }, gpaLabel: { color: '#E8E9FF', fontSize: 13, fontWeight: '600' }, gpaValue: { color: '#FFFFFF', fontSize: 58, fontWeight: '800', letterSpacing: -2, marginVertical: 6 }, gpaMeta: { color: '#E8E9FF', fontSize: 12 },
  creditCard: { marginTop: 12, paddingVertical: 16 }, creditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, creditLabel: { fontSize: 13, fontWeight: '700' }, creditValue: { fontSize: 22, fontWeight: '800' }, creditNote: { fontSize: 11, lineHeight: 17, marginTop: 8 }, unknownNote: { fontSize: 11, lineHeight: 17, fontWeight: '700', marginTop: 8 },
  analysisCard: { gap: 13 }, onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, onlineCopy: { flex: 1 }, onlineTitle: { fontSize: 13, fontWeight: '700' }, analysisResult: { gap: 13, paddingTop: 8 }, analysisOverview: { fontSize: 14, lineHeight: 22, fontWeight: '600' }, analysisSection: { gap: 5 }, analysisHeading: { fontSize: 14, fontWeight: '800' }, analysisBody: { fontSize: 12, lineHeight: 19 }, sources: { gap: 8 }, sourceLink: { fontSize: 11, lineHeight: 17, textDecorationLine: 'underline' },
  goalLink: { fontSize: 11, lineHeight: 17, fontWeight: '700' },
  gradeList: { paddingVertical: 2 }, gradeRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, gap: 12 }, scoreBadge: { width: 47, height: 47, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, score: { fontWeight: '900', fontSize: 16 }, gradeName: { fontSize: 15, fontWeight: '800', marginBottom: 4 }, gradeMeta: { fontSize: 12 }, gradeGpa: { fontSize: 17, fontWeight: '900' },
});
