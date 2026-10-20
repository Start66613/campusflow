import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Pill, PrimaryButton, SectionTitle } from '@/components/ui';
import { getAIConfig } from '@/src/ai-config';
import { buildDailyReviewSnapshot, localDailyReview, requestDailyReview, type DailyReview } from '@/src/daily-ai';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import { DailyPage } from '@/components/daily/shared';
import { DailyReviewShare } from '@/components/daily-review-share';

export default function DailyReviewScreen() {
  const { data } = useApp();
  const theme = useAppTheme();
  const [now, setNow] = useState(() => new Date());
  const [ready, setReady] = useState(false);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState<{ review: DailyReview; fingerprint: string } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const aliveRef = useRef(true);
  const snapshot = useMemo(() => buildDailyReviewSnapshot(data.daily, data.focusSessions, data.tasks, now), [data.daily, data.focusSessions, data.tasks, now]);
  const fingerprint = JSON.stringify(snapshot);
  const local = useMemo(() => localDailyReview(snapshot), [snapshot]);
  const currentAnswer = answer?.fingerprint === fingerprint ? answer.review : null;
  const review = currentAnswer ?? local;
  const shareReady = snapshot.totals.planned > 0 || snapshot.focus.sessions > 0 || snapshot.tasks.dueInWindow > 0;

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; controllerRef.current?.abort(); };
  }, []);
  useFocusEffect(useCallback(() => {
    let focused = true;
    setNow(new Date());
    getAIConfig().then((config) => { if (focused) setReady(Boolean(config.apiKey)); }).catch(() => undefined);
    return () => { focused = false; controllerRef.current?.abort(); };
  }, []));

  const generate = async () => {
    if (busyRef.current || !shareReady) return;
    busyRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const config = await getAIConfig();
      if (!config.apiKey) {
        setReady(false);
        setError('请先配置个人 AI，下面的本地复盘仍可使用。');
        return;
      }
      const result = await requestDailyReview(snapshot, config, goal, { signal: controller.signal });
      if (aliveRef.current && !controller.signal.aborted) setAnswer({ review: result, fingerprint });
    } catch (requestError) {
      if (aliveRef.current) setError(requestError instanceof Error ? requestError.message : '暂时无法生成，本地复盘仍可使用。');
    } finally {
      busyRef.current = false;
      if (controllerRef.current === controller) controllerRef.current = null;
      if (aliveRef.current) setLoading(false);
    }
  };

  return (
    <DailyPage title="一点点，看得见" subtitle={`${snapshot.from.slice(5).replace('-', '/')} — ${snapshot.through.slice(5).replace('-', '/')} · 最近 7 天`}>

      <Card animateLayout={false}>
        <Pill tone="primary">日常复盘</Pill>
        <View style={styles.metrics}>
          {[
            [`${snapshot.totals.completed}/${snapshot.totals.planned}`, '习惯完成'],
            [String(snapshot.focus.minutes), '专注分钟'],
            [String(snapshot.focus.sessions), '专注次数'],
          ].map(([value, label]) => (
            <View key={label} style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
              <Text style={[styles.caption, { color: theme.secondary }]}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.body, { color: theme.secondary }]}>今天还在继续，不必急着给自己打分</Text>
      </Card>

      <SectionTitle title="每天的一点进展" />
      <Card animateLayout={false}>
        <View style={styles.chart}>
          {snapshot.days.map((day) => (
            <View key={day.date} style={styles.day} accessible accessibilityLabel={`${day.date}，${day.planned ? `完成 ${day.completed} 项，共 ${day.planned} 项` : '没有安排'}`}>
              <Text style={[styles.chartValue, { color: theme.text }]}>{day.completed}</Text>
              <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
                <View style={[styles.progress, { height: `${day.planned ? Math.round(day.completed / day.planned * 100) : 0}%`, backgroundColor: theme.primary }]} />
              </View>
              <Text style={[styles.chartLabel, { color: theme.secondary }]}>{Number(day.date.slice(-2))}日</Text>
              <Text style={[styles.chartLabel, { color: theme.secondary }]}>{day.planned ? `/${day.planned}项` : '休息'}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.caption, { color: theme.secondary }]}>每条柱形表示当天已安排习惯的完成比例</Text>
      </Card>

      <SectionTitle title={currentAnswer ? 'AI 帮你看看' : '先看看记录'} />
      <Card animateLayout={false} style={styles.reviewCard}>
        <Pill tone={currentAnswer ? 'primary' : 'neutral'}>{currentAnswer ? 'DeepSeek · 未联网' : '本地整理 · 无需联网'}</Pill>
        {review.observations.map((observation, index) => <Text key={`observation-${index}`} style={[styles.body, { color: theme.text }]}>{observation}</Text>)}
        {snapshot.tasks.dueInWindow > 0 ? <Text style={[styles.caption, { color: theme.secondary }]}>这 7 天到期的待办共 {snapshot.tasks.dueInWindow} 项，目前完成 {snapshot.tasks.currentlyCompleted} 项；这不等于本周完成数量</Text> : null}
      </Card>
      <SectionTitle title="下一步，小一点也可以" />
      <Card animateLayout={false} style={styles.reviewCard}>
        {review.actions.map((action, index) => (
          <View key={`action-${index}`} style={styles.action}>
            <View style={[styles.number, { backgroundColor: theme.primarySoft }]}><Text style={[styles.numberText, { color: theme.primary }]}>{index + 1}</Text></View>
            <Text style={[styles.actionText, { color: theme.text }]}>{action}</Text>
          </View>
        ))}
        <Text style={[styles.body, { color: theme.secondary }]}>{review.encouragement}</Text>
      </Card>

      <SectionTitle title="用自己的 AI 深入复盘" />
      <Card animateLayout={false} style={styles.reviewCard}>
        <Text style={[styles.body, { color: theme.text }]}>这次想改善什么</Text>
        <TextInput
          accessibilityLabel="复盘目标，可选"
          value={goal}
          onChangeText={setGoal}
          placeholder="例如：课多的时候也想保持阅读"
          placeholderTextColor={theme.secondary}
          maxLength={180}
          multiline
          editable={!loading}
          style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt }]}
        />
        <Text style={[styles.caption, { color: theme.secondary }]}>点击生成才会发送：习惯名称、目标和近 7 天完成数、专注汇总、到期待办数量，以及上面填写的目标。日记正文、心情、照片和打卡备注不会发送。</Text>
        {loading ? (
          <View style={styles.reviewCard}>
            <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.body, { color: theme.secondary }]}>正在整理建议…</Text></View>
            <PrimaryButton secondary label="取消生成" onPress={() => controllerRef.current?.abort()} />
          </View>
        ) : ready ? (
          <PrimaryButton disabled={!shareReady} label={currentAnswer ? '重新生成 AI 复盘' : '发送汇总并生成 AI 复盘'} onPress={generate} />
        ) : (
          <PrimaryButton secondary label="配置个人 AI" onPress={() => router.push('/ai-settings')} />
        )}
        {!shareReady ? <Text style={[styles.caption, { color: theme.secondary }]}>完成一次打卡或专注后，AI 就能根据真实记录提供建议</Text> : null}
        {error ? <Text accessibilityRole="alert" style={[styles.body, { color: theme.red }]}>{error}</Text> : null}
      </Card>
      <SectionTitle title="把这一周留下来" />
      <DailyReviewShare snapshot={snapshot} />
    </DailyPage>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, marginBottom: 22 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 }, title: { fontSize: 25, fontWeight: '600' }, subtitle: { fontSize: 13, marginTop: 5 },
  metrics: { flexDirection: 'row', marginVertical: 22, gap: 12 },
  metric: { flex: 1 }, metricValue: { fontSize: 29, fontWeight: '600', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 12, lineHeight: 19 }, body: { fontSize: 14, lineHeight: 22 },
  chart: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginBottom: 18 },
  day: { flex: 1, alignItems: 'center', gap: 5 }, chartValue: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { width: '100%', maxWidth: 28, height: 84, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end' },
  progress: { width: '100%', borderRadius: 14 }, chartLabel: { fontSize: 11 },
  reviewCard: { gap: 14 }, action: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  number: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, fontWeight: '600' }, actionText: { flex: 1, fontSize: 14, lineHeight: 22 },
  input: { minHeight: 90, borderRadius: 17, padding: 14, fontSize: 14, lineHeight: 21, textAlignVertical: 'top' },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
