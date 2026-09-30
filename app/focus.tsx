import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';

import { motion, MotionPressable } from '@/components/motion';
import { Card, Screen } from '@/components/ui';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export default function FocusScreen() {
  const theme = useAppTheme();
  const { data, addFocus } = useApp();
  const total = data.settings.focusMinutes * 60;
  const [seconds, setSeconds] = useState(total);
  const [running, setRunning] = useState(false);
  const progress = 1 - seconds / total;
  const pulse = useSharedValue(1);
  const animatedProgress = useSharedValue(0);
  const time = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (seconds !== 0 || !running) return;
    setRunning(false); addFocus(data.settings.focusMinutes);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('完成一个番茄钟 🍅', '休息 5 分钟，再回来继续。');
  }, [seconds, running, addFocus, data.settings.focusMinutes]);
  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 850, reduceMotion: ReduceMotion.System });
  }, [animatedProgress, progress]);
  useEffect(() => {
    pulse.value = running
      ? withRepeat(withTiming(1.012, { duration: 1800, reduceMotion: ReduceMotion.System }), -1, true)
      : withSpring(1, motion.springSoft);
  }, [pulse, running]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const progressStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${animatedProgress.value * 270 - 45}deg` }] }));

  const reset = () => { setRunning(false); setSeconds(total); };
  return (
    <Screen>
      <Text style={[styles.kicker, { color: theme.primary }]}>FOCUS MODE</Text><Text style={[styles.title, { color: theme.text }]}>专注当下</Text>
      <Animated.View style={[styles.timerWrap, pulseStyle]}>
        <View style={[styles.ringOuter, { borderColor: theme.surfaceAlt }]}><Animated.View style={[styles.progressAccent, { backgroundColor: theme.primary }, progressStyle]} /><View style={[styles.ringInner, { backgroundColor: theme.background }]}><Text style={[styles.time, { color: theme.text }]}>{time}</Text><Text style={[styles.mode, { color: theme.secondary }]}>{running ? '正在专注' : '准备开始'}</Text></View></View>
      </Animated.View>
      <View style={styles.controls}>
        <MotionPressable onPress={reset} style={[styles.smallButton, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.smallButtonText, { color: theme.secondary }]}>重置</Text></MotionPressable>
        <MotionPressable onPress={() => setRunning((value) => !value)} pressedScale={0.9} style={[styles.mainButton, { backgroundColor: theme.primary }]}><Text style={styles.mainButtonText}>{running ? '暂停' : seconds === total ? '开始' : '继续'}</Text></MotionPressable>
        <MotionPressable onPress={() => setSeconds((value) => Math.max(0, value - 60))} style={[styles.smallButton, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.smallButtonText, { color: theme.secondary }]}>-1 分</Text></MotionPressable>
      </View>
      <Card style={styles.suggestion}><Text style={styles.suggestionEmoji}>📘</Text><View style={{ flex: 1 }}><Text style={[styles.suggestionTitle, { color: theme.text }]}>本次建议</Text><Text style={[styles.suggestionBody, { color: theme.secondary }]}>先完成“高数习题 2.3”，只做这一件事。</Text></View></Card>
      <View style={styles.stats}><View><Text style={[styles.statValue, { color: theme.text }]}>{Math.floor(data.focusMinutesThisWeek / 25)}</Text><Text style={[styles.statLabel, { color: theme.secondary }]}>本周番茄</Text></View><View style={[styles.statDivider, { backgroundColor: theme.line }]} /><View><Text style={[styles.statValue, { color: theme.text }]}>{data.focusMinutesThisWeek}</Text><Text style={[styles.statLabel, { color: theme.secondary }]}>专注分钟</Text></View></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 11, letterSpacing: 1.6, fontWeight: '700', marginTop: 10, marginBottom: 5 }, title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.1 }, timerWrap: { alignItems: 'center', marginVertical: 42 },
  ringOuter: { width: 252, height: 252, borderRadius: 126, borderWidth: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, progressAccent: { position: 'absolute', width: 22, height: 118, top: 1, borderRadius: 11, transformOrigin: 'center bottom' }, ringInner: { width: 202, height: 202, borderRadius: 101, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 53, fontWeight: '800', letterSpacing: -1.7 }, mode: { fontSize: 13, marginTop: 6, fontWeight: '600' }, controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  smallButton: { width: 64, height: 48, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, smallButtonText: { fontSize: 12, fontWeight: '600' }, mainButton: { width: 92, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: '#5E5CE6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 15, elevation: 4 }, mainButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  suggestion: { marginTop: 36, flexDirection: 'row', alignItems: 'center', gap: 14 }, suggestionEmoji: { fontSize: 28 }, suggestionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 5 }, suggestionBody: { fontSize: 12, lineHeight: 18 },
  stats: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 45, marginTop: 30 }, statValue: { fontSize: 25, fontWeight: '900', textAlign: 'center' }, statLabel: { fontSize: 11, marginTop: 5, textAlign: 'center' }, statDivider: { width: 1, height: 42 },
});
