import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { gentleLayout, MotionPressable } from '@/components/motion';
import { Card, GlassBackdrop, PrimaryButton, Screen } from '@/components/ui';
import { syncCoursesToSystemCalendar } from '@/src/calendar';
import { currentWeek, dateForWeekday, weekdays } from '@/src/date';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import type { Course } from '@/src/types';

const rowHeight = 54;
const timeColumnWidth = 24;
const periodStarts = ['08:00', '08:55', '10:10', '11:05', '14:00', '14:55', '16:10', '17:05', '19:00', '19:55', '20:50', '21:45'];
const periodEnds = ['08:45', '09:40', '10:55', '11:50', '14:45', '15:40', '16:55', '17:50', '19:45', '20:40', '21:35', '22:30'];

function courseInk(color: string, glass: boolean, dark: boolean) {
  const channels = color.match(/[0-9a-f]{2}/gi)?.slice(0, 3).map((part) => parseInt(part, 16)) ?? [90, 100, 220];
  const background = dark ? 0 : 255;
  const composed = channels.map((channel) => (glass ? channel * 0.72 + background * 0.28 : channel) / 255);
  const linear = composed.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return luminance > 0.32 ? '#16213B' : '#FFFFFF';
}

function DraggableCourse({ course, left, top, width, height, ink, compact, onMove }: {
  course: Course;
  left: number;
  top: number;
  width: number;
  height: number;
  ink: string;
  compact: boolean;
  onMove: (course: Course, dx: number, dy: number) => void;
}) {
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const [dragging, setDragging] = useState(false);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 10,
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 10,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      setDragging(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      dragX.value = 0;
      dragY.value = 0;
      dragScale.value = withSpring(1.035, { damping: 16, stiffness: 220, mass: 0.45, reduceMotion: ReduceMotion.System });
    },
    onPanResponderMove: (_, gesture) => {
      dragX.value = gesture.dx;
      dragY.value = gesture.dy;
    },
    onPanResponderRelease: (_, gesture) => {
      const dx = Math.round(gesture.dx / width);
      const dy = Math.round(gesture.dy / rowHeight);
      onMove(course, dx, dy);
      dragX.value = withSpring(0, { damping: 17, stiffness: 220, mass: 0.55, reduceMotion: ReduceMotion.System });
      dragY.value = withSpring(0, { damping: 17, stiffness: 220, mass: 0.55, reduceMotion: ReduceMotion.System });
      dragScale.value = withSpring(1, { damping: 16, stiffness: 220, mass: 0.45, reduceMotion: ReduceMotion.System });
      setDragging(false);
    },
    onPanResponderTerminate: () => {
      dragX.value = withSpring(0, { damping: 17, stiffness: 220, mass: 0.55, reduceMotion: ReduceMotion.System });
      dragY.value = withSpring(0, { damping: 17, stiffness: 220, mass: 0.55, reduceMotion: ReduceMotion.System });
      dragScale.value = withSpring(1, { damping: 16, stiffness: 220, mass: 0.45, reduceMotion: ReduceMotion.System });
      setDragging(false);
    },
  }), [course, onMove, width, dragX, dragY, dragScale]);
  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }, { scale: dragScale.value }],
  }));

  return (
    <Animated.View
      {...responder.panHandlers}
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      layout={gentleLayout}
      style={[styles.courseBlock, { left, top, width, height, zIndex: dragging ? 10 : 1, shadowOpacity: dragging ? 0.26 : 0.14, backgroundColor: 'transparent' }, dragStyle]}
    >
      <GlassBackdrop radius={15} effectStyle="regular" tintColor={course.color} />
      <Text numberOfLines={3} style={[styles.courseName, compact && styles.courseNameCompact, { color: ink, textShadowColor: ink === '#FFFFFF' ? 'rgba(20,22,45,0.32)' : 'rgba(255,255,255,0.45)' }]}>{course.name}</Text>
      <Text numberOfLines={2} style={[styles.courseMeta, compact && styles.courseMetaCompact, { color: ink, textShadowColor: ink === '#FFFFFF' ? 'rgba(20,22,45,0.28)' : 'rgba(255,255,255,0.45)' }]}>{course.location}</Text>
    </Animated.View>
  );
}

export default function ScheduleScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const app = useApp();
  const { data } = app;
  const [syncing, setSyncing] = useState(false);
  const week = currentWeek(data.settings.termStart);
  const days = Array.from({ length: 7 }, (_, index) => index + 1);
  const gridWidth = Math.max(300, width - 48);
  const columnWidth = (gridWidth - timeColumnWidth) / 7;
  const compact = width < 400;
  const glass = data.settings.visualMode === 'glass';
  const dark = theme.background === '#000000';

  const sync = async () => {
    setSyncing(true);
    try {
      const count = await syncCoursesToSystemCalendar(data.courses, data.settings.termStart);
      Alert.alert('鍚屾瀹屾垚', `宸插悜 iPhone 鏃ュ巻鍐欏叆 ${count} 涓湭鏉ヨ绋嬩簨浠躲€俙);
    } catch (error) {
      Alert.alert('鏆傛椂鏃犳硶鍚屾', error instanceof Error ? error.message : '璇风◢鍚庨噸璇?);
    } finally { setSyncing(false); }
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <View><Text style={[styles.kicker, { color: theme.secondary }]}>2026 绉嬪瀛︽湡 路 绗?{week} 鍛?/Text><Text style={[styles.title, { color: theme.text }]}>鎴戠殑璇捐〃</Text></View>
        <MotionPressable onPress={() => router.push('/import')} style={[styles.importButton, { backgroundColor: theme.primarySoft }]}><Text style={[styles.importText, { color: theme.primary }]}>锛?瀵煎叆</Text></MotionPressable>
      </View>
      <View style={[styles.weekBadge, { backgroundColor: theme.primarySoft }]}><Text style={[styles.weekBadgeText, { color: theme.primary }]}>鍛ㄤ竴鑷冲懆鏃?路 涓€灞忕湅鍏?/Text></View>
      <Card style={[styles.gridCard, glass && { backgroundColor: `${theme.surface}C4`, borderColor: 'rgba(255,255,255,0.72)' }]}>
          <View style={{ width: gridWidth }}>
            <View style={styles.dayHeader}>
              <View style={{ width: timeColumnWidth }} />
              {days.map((day) => {
                const date = dateForWeekday(day);
                const isToday = (new Date().getDay() || 7) === day;
                return <View key={day} style={[styles.dayCell, { width: columnWidth }]}><Text style={[styles.dayName, { color: isToday ? theme.primary : theme.secondary }]}>{weekdays[day - 1].replace('鍛?, '')}</Text><View style={[styles.dateDot, isToday && { backgroundColor: theme.primary }]}><Text style={[styles.dayDate, { color: isToday ? '#FFFFFF' : theme.text }]}>{date.getDate()}</Text></View></View>;
              })}
            </View>
            <View style={[styles.grid, { height: 12 * rowHeight }]}>
              {Array.from({ length: 12 }, (_, index) => <View key={index} style={[styles.gridLine, { top: index * rowHeight, borderTopColor: theme.line }]}><Text style={[styles.period, { color: theme.secondary }]}>{index + 1}</Text></View>)}
              {days.map((_, index) => <View key={index} style={[styles.verticalLine, { left: timeColumnWidth + index * columnWidth, borderLeftColor: theme.line }]} />)}
              {data.courses.filter((course) => course.weekday >= 1 && course.weekday <= 7 && course.weeks.includes(week)).map((course) => {
                const ink = courseInk(course.color, glass, dark);
                return <DraggableCourse
                  key={course.id}
                  course={course}
                  left={timeColumnWidth + (course.weekday - 1) * columnWidth + 2}
                  top={(course.startPeriod - 1) * rowHeight + 3}
                  width={columnWidth - 4}
                  height={(course.endPeriod - course.startPeriod + 1) * rowHeight - 6}
                  ink={ink}
                  compact={compact}
                  onMove={(source, dayDelta, periodDelta) => {
                    const duration = source.endPeriod - source.startPeriod;
                    const weekday = Math.min(7, Math.max(1, source.weekday + dayDelta));
                    const startPeriod = Math.min(12 - duration, Math.max(1, source.startPeriod + periodDelta));
                    if (weekday === source.weekday && startPeriod === source.startPeriod) return;
                    app.updateCourse({ ...source, weekday, startPeriod, endPeriod: startPeriod + duration, startTime: periodStarts[startPeriod - 1], endTime: periodEnds[startPeriod + duration - 1] });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
                  }}
                />
              })}
            </View>
          </View>
      </Card>
      <View style={styles.buttonRow}><View style={{ flex: 1 }}><PrimaryButton label={syncing ? '鍚屾涓€? : '鍚屾 iPhone 鏃ュ巻'} disabled={syncing} onPress={sync} /></View></View>
      <Text style={[styles.tip, { color: theme.secondary }]}>鎸変綇璇剧▼鍧楁嫋鍔ㄥ嵆鍙皟鏁存槦鏈熷拰鑺傛锛涙棩鍘嗗悓姝ラ渶瑕?iOS 寮€鍙戠増銆?/Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 18 },
  kicker: { fontSize: 13, fontWeight: '600', marginBottom: 4 }, title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.1 },
  importButton: { borderRadius: 17, paddingHorizontal: 15, paddingVertical: 10 }, importText: { fontWeight: '700', fontSize: 14 },
  weekBadge: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6, marginBottom: 12 }, weekBadgeText: { fontSize: 11, fontWeight: '700' },
  gridCard: { padding: 6, borderRadius: 28, overflow: 'hidden' }, dayHeader: { flexDirection: 'row', height: 57, alignItems: 'center' }, dayCell: { alignItems: 'center', gap: 4 }, dayName: { fontSize: 11, fontWeight: '700' },
  dateDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, dayDate: { fontSize: 12, fontWeight: '700' }, grid: { position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, height: rowHeight }, period: { width: timeColumnWidth, textAlign: 'center', marginTop: 6, fontSize: 9, fontWeight: '700' },
  verticalLine: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: StyleSheet.hairlineWidth }, courseBlock: { position: 'absolute', borderRadius: 15, padding: 8, shadowColor: '#203060', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.14, shadowRadius: 9, elevation: 3 },
  courseName: { color: '#FFFFFF', fontSize: 10, lineHeight: 13, fontWeight: '800', textShadowColor: 'rgba(20,22,45,0.28)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, courseNameCompact: { fontSize: 9, lineHeight: 11 }, courseMeta: { color: 'rgba(255,255,255,0.96)', fontSize: 8, lineHeight: 10, marginTop: 4, fontWeight: '700', textShadowColor: 'rgba(20,22,45,0.24)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, courseMetaCompact: { fontSize: 7.5, lineHeight: 9 },
  buttonRow: { flexDirection: 'row', marginTop: 16 }, tip: { fontSize: 12, lineHeight: 18, marginTop: 10, paddingHorizontal: 4 },
});
