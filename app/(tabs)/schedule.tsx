import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { MotionPressable, weekSlideIn } from '@/components/motion';
import { Card, GlassBackdrop, PrimaryButton, Screen } from '@/components/ui';
import { syncCoursesToSystemCalendar } from '@/src/calendar';
import { courseIconSpec } from '@/src/course-icons';
import { currentWeek, dateForWeekday, weekdays } from '@/src/date';
import { periodEnds, periodStarts } from '@/src/periods';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import type { Course } from '@/src/types';

// Taller rows keep course cards readable on a phone without widening the
// seven-day grid. The grid remains horizontally complete while scrolling
// vertically only when the device is short.
const rowHeight = 66;
const timeColumnWidth = 36;

function courseInk(color: string, glass: boolean, dark: boolean) {
  // Native tint is translucent. In light mode a dark label stays legible
  // across all six course hues; in dark mode use white on the dark material.
  if (glass) return dark ? '#FFFFFF' : '#17233E';
  const channels = color.match(/[0-9a-f]{2}/gi)?.slice(0, 3).map((part) => parseInt(part, 16)) ?? [90, 100, 220];
  const composed = channels.map((channel) => channel / 255);
  const linear = composed.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return luminance > 0.32 ? '#16213B' : '#FFFFFF';
}

function DraggableCourse({ course, left, top, width, height, ink, compact, onMove, onDragState, onEdit }: {
  course: Course;
  left: number;
  top: number;
  width: number;
  height: number;
  ink: string;
  compact: boolean;
  onMove: (course: Course, dx: number, dy: number) => void;
  onDragState: (courseId: string, active: boolean) => void;
  onEdit: (id: string) => void;
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
      dragScale.value = withSpring(1.012, { damping: 18, stiffness: 240, mass: 0.42, reduceMotion: ReduceMotion.System });
      onDragState(course.id, true);
    },
    onPanResponderMove: (_, gesture) => {
      dragX.value = gesture.dx;
      dragY.value = gesture.dy;
    },
    onPanResponderRelease: (_, gesture) => {
      const dx = Math.min(7 - course.weekday, Math.max(1 - course.weekday, Math.round(gesture.dx / width)));
      const dy = Math.min(12 - course.endPeriod, Math.max(1 - course.startPeriod, Math.round(gesture.dy / rowHeight)));
      // Commit a single grid snap. The visual offset must not be replayed on
      // top of the new left/top position (that was the "flying" release).
      onMove(course, dx, dy);
      dragX.value = 0;
      dragY.value = 0;
      dragScale.value = withTiming(1, { duration: 120, reduceMotion: ReduceMotion.System });
      setDragging(false);
      onDragState(course.id, false);
    },
    onPanResponderTerminate: () => {
      dragX.value = withTiming(0, { duration: 145, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System });
      dragY.value = withTiming(0, { duration: 145, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System });
      dragScale.value = withTiming(1, { duration: 120, reduceMotion: ReduceMotion.System });
      setDragging(false);
      onDragState(course.id, false);
    },
  }), [course, onDragState, onMove, width, dragX, dragY, dragScale]);
  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }, { scale: dragScale.value }],
  }));
  const previewStyle = useAnimatedStyle(() => {
    const snappedX = Math.min((7 - course.weekday) * width, Math.max(-(course.weekday - 1) * width, Math.round(dragX.value / width) * width));
    const snappedY = Math.min((12 - course.endPeriod) * rowHeight, Math.max(-(course.startPeriod - 1) * rowHeight, Math.round(dragY.value / rowHeight) * rowHeight));
    return { transform: [{ translateX: snappedX }, { translateY: snappedY }] };
  });

  const icon = courseIconSpec(course.icon, course.type);
  return (
    <>
      {dragging ? <Animated.View pointerEvents="none" style={[styles.dropTarget, { left, top, width, height, borderColor: `${course.color}B8`, backgroundColor: `${course.color}16` }, previewStyle]}><Text style={[styles.dropHint, { color: course.color }]}>释放调整</Text></Animated.View> : null}
      <Animated.View
        {...responder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={`${course.name}，按住拖动调整课程时间`}
        style={[styles.courseBlock, { left, top, width, height, zIndex: dragging ? 10 : 1, shadowOpacity: dragging ? 0.2 : 0.1, backgroundColor: 'transparent' }, dragStyle]}
      >
        <GlassBackdrop radius={15} effectStyle="regular" tintColor={course.color} />
        {course.backgroundUri ? <Image source={{ uri: course.backgroundUri }} resizeMode="cover" style={[StyleSheet.absoluteFill, { borderRadius: 15, opacity: 0.29 }]} /> : null}
        <MotionPressable onPress={() => onEdit(course.id)} style={styles.courseContents}>
          <View style={styles.courseGlyph}><AppIcon ios={icon.ios} android={icon.android} color={ink} size={compact ? 13 : 15} fallback="·" /></View>
          <Text numberOfLines={3} style={[styles.courseName, compact && styles.courseNameCompact, { color: ink, textShadowColor: ink === '#FFFFFF' ? 'rgba(20,22,45,0.32)' : 'rgba(255,255,255,0.45)' }]}>{course.name}</Text>
          <Text numberOfLines={2} style={[styles.courseMeta, compact && styles.courseMetaCompact, { color: ink, textShadowColor: ink === '#FFFFFF' ? 'rgba(20,22,45,0.28)' : 'rgba(255,255,255,0.45)' }]}>{course.location}</Text>
          {height > rowHeight * 1.7 ? <Text numberOfLines={1} style={[styles.courseTeacher, { color: ink }]}>{course.teacher}</Text> : null}
        </MotionPressable>
      </Animated.View>
    </>
  );
}

export default function ScheduleScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const app = useApp();
  const { data } = app;
  const [syncing, setSyncing] = useState(false);
  const [draggingCourseId, setDraggingCourseId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDirection, setWeekDirection] = useState(1);
  const baseWeek = currentWeek(data.settings.termStart);
  const week = Math.max(1, Math.min(30, baseWeek + weekOffset));
  const weekStart = dateForWeekday(1);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const days = Array.from({ length: 7 }, (_, index) => index + 1);
  const gridWidth = Math.max(0, width - 48);
  const columnWidth = (gridWidth - timeColumnWidth) / 7;
  const compact = width < 400;
  const glass = data.settings.visualMode === 'glass';
  const dark = theme.background === '#000000';
  const changeWeek = useCallback((delta: number) => {
    setWeekDirection(delta);
    setWeekOffset((current) => Math.max(1 - baseWeek, Math.min(30 - baseWeek, current + delta)));
    Haptics.selectionAsync().catch(() => undefined);
  }, [baseWeek]);
  const weekSwipe = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 32 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 55) return;
      changeWeek(gesture.dx < 0 ? 1 : -1);
    },
  }), [changeWeek]);

  const handleDragState = useCallback((courseId: string, active: boolean) => setDraggingCourseId(active ? courseId : null), []);
  const handleCourseMove = useCallback((source: Course, dayDelta: number, periodDelta: number) => {
    const duration = source.endPeriod - source.startPeriod;
    const weekday = Math.min(7, Math.max(1, source.weekday + dayDelta));
    const startPeriod = Math.min(12 - duration, Math.max(1, source.startPeriod + periodDelta));
    if (weekday === source.weekday && startPeriod === source.startPeriod) return;
    app.updateCourse({ ...source, weekday, startPeriod, endPeriod: startPeriod + duration, startTime: periodStarts[startPeriod - 1], endTime: periodEnds[startPeriod + duration - 1] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [app]);

  const sync = async () => {
    setSyncing(true);
    try {
      const count = await syncCoursesToSystemCalendar(data.courses, data.settings.termStart);
      Alert.alert('同步完成', `已向 iPhone 日历写入 ${count} 个未来课程事件。`);
    } catch (error) {
      Alert.alert('暂时无法同步', error instanceof Error ? error.message : '请稍后重试');
    } finally { setSyncing(false); }
  };

  return (
    <Screen scrollEnabled={!draggingCourseId}>
      <View style={styles.topRow}>
        <View><Text style={[styles.kicker, { color: theme.secondary }]}>2026 秋季学期 · {weekStart.getMonth() + 1}月{weekStart.getDate()}日—{weekEnd.getMonth() + 1}月{weekEnd.getDate()}日</Text><Text style={[styles.title, { color: theme.text }]}>第 {week} 周课表</Text></View>
        <MotionPressable onPress={() => router.push('/import')} style={[styles.importButton, { backgroundColor: theme.primarySoft }]}><Text style={[styles.importText, { color: theme.primary }]}>＋ 导入</Text></MotionPressable>
      </View>
      <View style={styles.weekTools}>
        <MotionPressable accessibilityLabel="上一周" onPress={() => changeWeek(-1)} style={[styles.weekButton, { backgroundColor: theme.surfaceAlt }]}><AppIcon ios="chevron.left" android="chevron_left" color={theme.primary} size={18} /></MotionPressable>
        <Text style={[styles.weekHint, { color: theme.secondary }]}>左右滑动空白处切换周次</Text>
        <MotionPressable accessibilityLabel="下一周" onPress={() => changeWeek(1)} style={[styles.weekButton, { backgroundColor: theme.surfaceAlt }]}><AppIcon ios="chevron.right" android="chevron_right" color={theme.primary} size={18} /></MotionPressable>
        <MotionPressable accessibilityLabel="添加课程" onPress={() => router.push('/course-editor')} style={[styles.addButton, { backgroundColor: theme.primarySoft }]}><Text style={[styles.addText, { color: theme.primary }]}>＋ 课程</Text></MotionPressable>
      </View>
      <View {...weekSwipe.panHandlers}>
      <Animated.View key={week} entering={weekSlideIn(weekDirection)}>
      <Card style={[styles.gridCard, glass && { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.72)' }]}>
          <View style={{ width: gridWidth }}>
            <View style={styles.dayHeader}>
              <View style={{ width: timeColumnWidth }} />
              {days.map((day) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + day - 1);
                const isToday = weekOffset === 0 && (new Date().getDay() || 7) === day;
                return <View key={day} style={[styles.dayCell, { width: columnWidth }]}><Text style={[styles.dayName, { color: isToday ? theme.primary : theme.secondary }]}>{weekdays[day - 1].replace('周', '')}</Text><View style={[styles.dateDot, isToday && { backgroundColor: theme.primary }]}><Text style={[styles.dayDate, { color: isToday ? '#FFFFFF' : theme.text }]}>{date.getDate()}</Text></View></View>;
              })}
            </View>
            <View style={[styles.grid, { height: 12 * rowHeight }]}>
              {Array.from({ length: 12 }, (_, index) => (
                <View key={index} style={[styles.gridLine, { top: index * rowHeight, borderTopColor: theme.line }]}>
                  <View style={styles.periodMarker}>
                    <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[styles.periodTime, { color: theme.secondary }]}>{periodStarts[index]}</Text>
                    <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[styles.periodNumber, { color: theme.secondary }]}>{index + 1}</Text>
                    <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[styles.periodTime, { color: theme.secondary }]}>{periodEnds[index]}</Text>
                  </View>
                </View>
              ))}
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
                  onDragState={handleDragState}
                  onMove={handleCourseMove}
                  onEdit={(courseId) => router.push({ pathname: '/course-editor', params: { id: courseId } })}
                />
              })}
            </View>
          </View>
      </Card>
      </Animated.View>
      </View>
      <View style={styles.buttonRow}><View style={{ flex: 1 }}><PrimaryButton label={syncing ? '同步中…' : '同步 iPhone 日历'} disabled={syncing} onPress={sync} /></View></View>
      <Text style={[styles.tip, { color: theme.secondary }]}>点课程编辑详情，按住拖动调整节次；在课表空白处左右滑动切换周数。</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, marginBottom: 10 },
  kicker: { fontSize: 12, fontWeight: '600', marginBottom: 2 }, title: { fontSize: 29, fontWeight: '800', letterSpacing: -0.9 },
  importButton: { borderRadius: 17, paddingHorizontal: 15, paddingVertical: 10 }, importText: { fontWeight: '700', fontSize: 14 },
  weekTools: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 }, weekButton: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, weekHint: { flex: 1, fontSize: 10, textAlign: 'center' }, addButton: { minHeight: 34, paddingHorizontal: 10, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, addText: { fontSize: 11, fontWeight: '800' },
  gridCard: { padding: 6, borderRadius: 28, overflow: 'hidden' }, dayHeader: { flexDirection: 'row', height: 47, alignItems: 'center' }, dayCell: { alignItems: 'center', gap: 3 }, dayName: { fontSize: 11, fontWeight: '700' },
  dateDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, dayDate: { fontSize: 12, fontWeight: '700' }, grid: { position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, height: rowHeight },
  periodMarker: { width: timeColumnWidth, height: rowHeight, paddingVertical: 5, alignItems: 'center', justifyContent: 'space-between' },
  periodNumber: { width: timeColumnWidth, textAlign: 'center', fontSize: 11, lineHeight: 14, fontWeight: '800' },
  periodTime: { width: timeColumnWidth, textAlign: 'center', fontSize: 8, lineHeight: 10, fontVariant: ['tabular-nums'] },
  verticalLine: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: StyleSheet.hairlineWidth }, courseBlock: { position: 'absolute', borderRadius: 15, padding: 8, shadowColor: '#203060', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 9, elevation: 3 }, courseContents: { flex: 1 }, dropTarget: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 15, justifyContent: 'center', alignItems: 'center', zIndex: 0 }, dropHint: { fontSize: 8, fontWeight: '800', opacity: 0.8 }, courseGlyph: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.42)', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  courseName: { color: '#FFFFFF', fontSize: 11, lineHeight: 14, fontWeight: '800', textShadowColor: 'rgba(20,22,45,0.28)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, courseNameCompact: { fontSize: 10, lineHeight: 13 }, courseMeta: { color: 'rgba(255,255,255,0.96)', fontSize: 8.5, lineHeight: 10, marginTop: 4, fontWeight: '700', textShadowColor: 'rgba(20,22,45,0.24)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, courseMetaCompact: { fontSize: 8, lineHeight: 9 }, courseTeacher: { fontSize: 8, lineHeight: 10, marginTop: 5, fontWeight: '700', opacity: 0.72 },
  buttonRow: { flexDirection: 'row', marginTop: 16 }, tip: { fontSize: 12, lineHeight: 18, marginTop: 10, paddingHorizontal: 4 },
});
