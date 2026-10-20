import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Choice, DailyForm, DailyPage, Field, TextButton, dailyStyles as ds, validDate } from '@/components/daily/shared';
import { motion, MotionPressable } from '@/components/motion';
import { Card, PrimaryButton } from '@/components/ui';
import { localDateKey } from '@/src/daily';
import { requestDailyNotificationPermission } from '@/src/daily-notifications';
import { useFocusSession } from '@/src/focus-session';
import { displayedFocusSeconds, elapsedFocusSeconds } from '@/src/focus-timer';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import { summarizeWeek } from '@/src/weekly-report';
import { SettingToggle } from '@/components/setting-toggle';

export default function FocusScreen() {
  const theme = useAppTheme();
  const app = useApp();
  const focus = useFocusSession();
  const params = useLocalSearchParams<{ habitId?: string; taskId?: string }>();
  const { timer } = focus;
  const [now, setNow] = useState(Date.now());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [duration, setDuration] = useState(String(app.data.settings.focusMinutes));
  const [breakTime, setBreakTime] = useState(String(app.data.settings.breakMinutes));
  const [cycles, setCycles] = useState('4');
  const [manualMinutes, setManualMinutes] = useState('25');
  const [manualDate, setManualDate] = useState(localDateKey());
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const linkedOnce = useRef(false);
  const savedManual = useRef(false);
  const progress = useSharedValue(0);
  const pressed = useSharedValue(1);
  const week = summarizeWeek(app.data);
  const habits = app.data.daily.habits.filter((habit) => !habit.archived && habit.mode === 'minutes');
  const tasks = app.data.tasks.filter((task) => !task.completed);
  const linkedHabit = habits.find((habit) => habit.id === timer?.habitId);
  const linkedTask = app.data.tasks.find((task) => task.id === timer?.taskId);
  const elapsed = timer ? elapsedFocusSeconds(timer, now) : 0;
  const seconds = timer ? displayedFocusSeconds(timer, now) : 1500;
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const idle = timer?.status === 'idle';
  const finished = timer?.status === 'complete';
  const running = timer?.status === 'running';

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 500);
    const sub = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => { clearInterval(tick); sub.remove(); };
  }, []);
  useEffect(() => {
    if (!focus.ready || !timer || linkedOnce.current) return;
    linkedOnce.current = true;
    if (timer.status === 'idle' && (params.habitId || params.taskId)) focus.configure({ habitId: params.habitId, taskId: params.taskId });
    else if (params.habitId && timer.habitId !== params.habitId && timer.status !== 'idle') setNotice('已恢复上次计时；结束或重置后，可以重新选择关联习惯');
  }, [focus, params.habitId, params.taskId, timer]);
  useEffect(() => {
    progress.value = withTiming(timer ? Math.min(1, elapsed / timer.duration) : 0, { duration: 450, reduceMotion: ReduceMotion.System });
  }, [elapsed, timer?.duration, progress]);
  useEffect(() => { pressed.value = withSpring(running ? 1.015 : 1, motion.springSoft); }, [pressed, running]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const timerStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressed.value }] }));

  async function start() {
    setNotice('');
    if (Platform.OS !== 'web') {
      try { if (!(await requestDailyNotificationPermission())) setNotice('计时可以正常使用；到点通知需要在系统设置中允许通知'); }
      catch { setNotice('本次到点通知不可用，返回应用仍可查看准确计时'); }
    }
    focus.start();
    Haptics.selectionAsync().catch(() => undefined);
  }
  function confirmReset() {
    if (!timer) return;
    if (idle || finished) { focus.reset(); return; }
    setEnding(true);
  }
  function saveSettings() {
    const values = [duration, breakTime, cycles];
    if (values.some((value) => !/^\d+$/.test(value)) || +duration < 1 || +duration > 180 || +breakTime < 1 || +breakTime > 60 || +cycles < 1 || +cycles > 8) {
      setFormError('专注 1–180 分钟，休息 1–60 分钟，轮数 1–8'); return;
    }
    focus.configure({ focusMinutes: +duration, breakMinutes: +breakTime, cycles: +cycles });
    app.updateSettings({ focusMinutes: +duration, breakMinutes: +breakTime });
    setSettingsOpen(false);
  }
  function saveManual() {
    if (savedManual.current) return;
    if (!/^\d+(\.\d{1,2})?$/.test(manualMinutes) || +manualMinutes < 1 || +manualMinutes > 720 || !validDate(manualDate) || manualDate > localDateKey()) {
      setFormError('请填写 1–720 分钟，日期不能晚于今天'); return;
    }
    try {
      const completedAt = manualDate === localDateKey() ? new Date().toISOString() : new Date(`${manualDate}T12:00:00`).toISOString();
      app.addFocus(+manualMinutes, { habitId: linkedHabit?.id, taskId: linkedTask?.id, source: 'manual', note: note.trim(), completedAt });
      savedManual.current = true;
      setManualOpen(false);
      setNotice('补记已保存，已关联的计时习惯会同步累计');
    } catch (error) { setFormError(error instanceof Error ? error.message : '补记失败'); }
  }

  return <><Stack.Screen options={{ headerShown: false }} /><DailyPage title={app.data.settings.jiahaoMode ? '专注修炼' : '留一点时间给自己'} subtitle="计时、休息与每一次进步，都记在这里">
    <View style={ds.wrap}><Choice label="番茄倒计时" selected={timer?.mode === 'countdown'} onPress={() => idle ? focus.configure({ mode: 'countdown' }) : setNotice('先结束或重置当前计时，再切换模式')} /><Choice label="自由正计时" selected={timer?.mode === 'countup'} onPress={() => idle ? focus.configure({ mode: 'countup' }) : setNotice('先结束或重置当前计时，再切换模式')} /></View>
    <Card style={s.timerCard} animateLayout={false}>
      <Text style={[s.phase, { color: theme.primary }]}>{timer?.phase === 'rest' ? '放松一下' : linkedHabit?.title ?? linkedTask?.title ?? '只做眼前这一件事'}</Text>
      <Animated.View style={timerStyle}><Text adjustsFontSizeToFit numberOfLines={1} style={[s.time, { color: theme.text }]}>{time}</Text></Animated.View>
      <Text style={[s.state, { color: theme.secondary }]}>{!focus.ready ? '正在恢复计时' : finished ? timer?.phase === 'rest' ? '休息完成' : elapsed < 60 ? '本次不足一分钟，未计入统计' : '这一段专注已记录' : running ? timer?.phase === 'rest' ? '休息中' : '专注中 · 离开页面也会继续' : idle ? '准备好再开始' : '已暂停'}</Text>
      {timer?.mode === 'countdown' || timer?.phase === 'rest' ? <View style={[s.track, { backgroundColor: theme.surfaceAlt }]}><Animated.View style={[s.fill, { backgroundColor: theme.primary }, progressStyle]} /></View> : null}
      <Text style={[s.state, { color: theme.secondary }]}>{timer?.mode === 'countdown' ? `第 ${timer?.cycle ?? 1} / ${timer?.cycles ?? 4} 轮 · 休息 ${timer?.breakMinutes ?? 5} 分钟` : '自由专注，结束后按实际时长记录'}</Text>
      <View style={s.controls}>
        <MotionPressable accessibilityRole="button" disabled={!focus.ready} onPress={confirmReset} style={[s.secondaryButton, { backgroundColor: theme.surfaceAlt }]}><Text style={{ color: theme.text, fontWeight: '600' }}>重置</Text></MotionPressable>
        <View style={{ flex: 1 }}><PrimaryButton disabled={!focus.ready} label={finished ? timer?.phase === 'focus' && timer.mode === 'countdown' ? '准备休息' : '开始下一轮' : running ? '暂停' : idle ? '开始' : '继续'} onPress={finished ? focus.next : running ? focus.pause : start} /></View>
      </View>
      {!idle && !finished && timer?.phase === 'focus' ? <TextButton label={elapsed >= 60 ? '结束并保存这段专注' : '已专注不足一分钟'} disabled={elapsed < 60} onPress={focus.finish} /> : null}
      {timer?.phase === 'rest' ? <TextButton label="跳过休息，准备下一轮" onPress={focus.next} /> : null}
    </Card>
    {focus.error || notice ? <Text accessibilityRole="alert" style={[ds.body, { color: theme.secondary }]}>{focus.error || notice}</Text> : null}
    <View style={s.summary}>
      <Card style={s.metric}><Text style={[s.number, { color: theme.text }]}>{Math.round(week.focusMinutes)}</Text><Text style={[ds.caption, { color: theme.secondary }]}>本周专注分钟</Text></Card>
      <Card style={s.metric}><Text style={[s.number, { color: theme.text }]}>{week.focusSessions.length}</Text><Text style={[ds.caption, { color: theme.secondary }]}>本周完成次数</Text></Card>
    </View>
    <Card style={ds.section}><Text style={[ds.sectionTitle, { color: theme.text }]}>陪你安静一会儿</Text><View style={ds.wrap}>{([{ value: 'none', label: '安静' }, { value: 'rain', label: '轻雨' }, { value: 'wind', label: '微风' }] as const).map((item) => <Choice key={item.value} label={item.label} selected={(app.data.settings.focusSound ?? 'none') === item.value} onPress={() => app.updateSettings({ focusSound: item.value })} />)}</View>
      {app.data.settings.focusSound && app.data.settings.focusSound !== 'none' ? <View style={ds.wrap}>{[{ value: 0.12, label: '轻一点' }, { value: 0.25, label: '适中' }, { value: 0.45, label: '清晰' }].map((item) => <Choice key={item.value} label={item.label} selected={(app.data.settings.focusVolume ?? 0.25) === item.value} onPress={() => app.updateSettings({ focusVolume: item.value })} />)}</View> : null}
      <View style={[ds.row, { justifyContent: 'space-between' }]}><Text style={[ds.body, { color: theme.text }]}>到点提示音</Text><SettingToggle label="到点提示音" value={app.data.settings.focusCompletionSound !== false} onValueChange={(value) => app.updateSettings({ focusCompletionSound: value })} /></View><Text style={[ds.caption, { color: theme.secondary }]}>环境音为本机合成音效，开始专注时播放，暂停或结束时停止。提示音仍遵循系统静音与通知设置。</Text>
    </Card>
    {idle && timer ? <Card style={ds.section}>
      <View style={[ds.row, { justifyContent: 'space-between' }]}><Text style={[ds.sectionTitle, { color: theme.text }]}>这次为谁留时间</Text><TextButton label="时长设置" onPress={() => { setDuration(String(timer.focusMinutes)); setBreakTime(String(timer.breakMinutes)); setCycles(String(timer.cycles)); setFormError(''); setSettingsOpen(true); }} /></View>
      <View style={ds.wrap}><Choice label="自由专注" selected={!timer.habitId && !timer.taskId} onPress={() => focus.configure({ habitId: undefined, taskId: undefined })} />{habits.map((habit) => <Choice key={habit.id} label={habit.title} selected={timer.habitId === habit.id} onPress={() => focus.configure({ habitId: habit.id, taskId: undefined })} />)}{tasks.slice(0, 8).map((task) => <Choice key={task.id} label={task.title} selected={timer.taskId === task.id} onPress={() => focus.configure({ habitId: undefined, taskId: task.id })} />)}</View>
      <Text style={[ds.caption, { color: theme.secondary }]}>关联计时习惯后，保存的分钟数自动累加到当天进度。休息时间不会计入。</Text>
    </Card> : null}
    <View style={[ds.row, { justifyContent: 'space-between' }]}><Text style={[ds.sectionTitle, { color: theme.text }]}>专注足迹</Text><TextButton label="补记一次" onPress={() => { savedManual.current = false; setManualDate(localDateKey()); setNote(''); setFormError(''); setManualOpen(true); }} /></View>
    <Card style={{ gap: 15 }}>
      {app.data.focusSessions.length ? [...app.data.focusSessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 20).map((session) => <View key={session.id} style={ds.row}>
        <View style={{ flex: 1 }}><Text style={[ds.body, { color: theme.text, fontWeight: '600' }]}>{app.data.daily.habits.find((habit) => habit.id === session.habitId)?.title ?? app.data.tasks.find((task) => task.id === session.taskId)?.title ?? '自由专注'}</Text><Text style={[ds.caption, { color: theme.secondary }]}>{new Date(session.completedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{session.source === 'manual' ? ' · 手动补记' : ''}{session.note ? ` · ${session.note}` : ''}</Text></View><Text style={[s.duration, { color: theme.primary }]}>{Math.round(session.minutes * 10) / 10} 分</Text>
      </View>) : <Text style={[ds.body, { color: theme.secondary }]}>完成第一段专注后，记录会出现在这里</Text>}
    </Card>
    <Text style={[ds.caption, { color: theme.secondary }]}>手机系统可能延迟通知，但计时会按实际经过的时间恢复。正计时最多记录 12 小时。</Text>
  </DailyPage>
    <DailyForm visible={settingsOpen} title="安排专注与休息" onClose={() => setSettingsOpen(false)}>
      <Field label="专注分钟" value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} /><Field label="休息分钟" value={breakTime} onChangeText={setBreakTime} keyboardType="number-pad" maxLength={2} /><Field label="一组轮数" value={cycles} onChangeText={setCycles} keyboardType="number-pad" maxLength={1} />
      <Text style={[ds.caption, { color: theme.secondary }]}>每轮结束后，由你决定何时开始休息和下一轮，不会在离开时自动累加专注。</Text>{formError ? <Text style={{ color: theme.red }}>{formError}</Text> : null}<PrimaryButton label="保存设置" onPress={saveSettings} />
    </DailyForm>
    <DailyForm visible={manualOpen} title="补记一次专注" onClose={() => setManualOpen(false)}>
      <Field label="专注分钟" value={manualMinutes} onChangeText={setManualMinutes} keyboardType="decimal-pad" maxLength={6} /><Field label="记录日期" value={manualDate} onChangeText={setManualDate} placeholder="YYYY-MM-DD" maxLength={10} /><Field label="这段时间做了什么" value={note} onChangeText={setNote} multiline maxLength={1000} />
      <Text style={[ds.caption, { color: theme.secondary }]}>关联：{linkedHabit?.title ?? linkedTask?.title ?? '自由专注'}。补记会单独标明来源。</Text>{formError ? <Text style={{ color: theme.red }}>{formError}</Text> : null}<PrimaryButton label="保存补记" onPress={saveManual} />
    </DailyForm>
    <DailyForm visible={ending} title="结束当前计时？" onClose={() => setEnding(false)}>
      <Text style={[ds.body, { color: theme.text }]}>这次已{timer?.phase === 'rest' ? '休息' : '专注'} {Math.floor(elapsed / 60)} 分钟，可以保存已专注的时间，或者重置这次计时。</Text>
      {timer?.phase === 'focus' && elapsed >= 60 ? <PrimaryButton label="保存已专注时间" onPress={() => { focus.finish(); setEnding(false); }} /> : null}
      <PrimaryButton label="继续计时" onPress={() => setEnding(false)} secondary />
      <TextButton label="放弃并重置" danger onPress={() => { focus.reset(); setEnding(false); }} />
    </DailyForm>
  </>;
}

const s = StyleSheet.create({
  timerCard: { alignItems: 'center', paddingVertical: 28, gap: 15 }, phase: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  time: { fontSize: 68, fontWeight: '600', letterSpacing: -2, fontVariant: ['tabular-nums'] }, state: { fontSize: 12, lineHeight: 19, textAlign: 'center' },
  track: { height: 7, borderRadius: 4, alignSelf: 'stretch', overflow: 'hidden', marginVertical: 4 }, fill: { height: '100%', borderRadius: 4 },
  controls: { flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center', gap: 12, marginTop: 8 }, secondaryButton: { minHeight: 50, borderRadius: 20, paddingHorizontal: 24, justifyContent: 'center' },
  summary: { flexDirection: 'row', gap: 12 }, metric: { flex: 1, alignItems: 'center', padding: 17 }, number: { fontSize: 30, fontWeight: '600', fontVariant: ['tabular-nums'] }, duration: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
