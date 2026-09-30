import { router, useIsFocused } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { motion, MotionPressable } from '@/components/motion';
import { Card, GlassBackdrop, PrimaryButton, Screen } from '@/components/ui';
import { syncCoursesToSystemCalendar } from '@/src/calendar';
import { courseIconSpec } from '@/src/course-icons';
import { selectionTick } from '@/src/native-motion';
import { currentWeek, dateForWeekday, weekdays } from '@/src/date';
import { periodEnds, periodStarts } from '@/src/periods';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import type { Course } from '@/src/types';
import { canChangeWeek, resolveWeekSwipe } from '@/src/week-swipe';

// Taller rows keep course cards readable on a phone without widening the
// seven-day grid. The grid remains horizontally complete while scrolling
// vertically only when the device is short.
const rowHeight = 66;
const timeColumnWidth = 36;
const dragHaptic = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); };

function currentTimeY(now: Date) {
  const minute = now.getHours() * 60 + now.getMinutes();
  for (let index = 0; index < periodStarts.length; index += 1) {
    const [startHour, startMinute] = periodStarts[index].split(':').map(Number);
    const [endHour, endMinute] = periodEnds[index].split(':').map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    if (minute >= start && minute <= end) return (index + (minute - start) / Math.max(1, end - start)) * rowHeight;
  }
  return null;
}

function CurrentTimeLine({ columnWidth, color }: { columnWidth: number; color: string }) {
  const focused = useIsFocused();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!focused) return;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [focused]);
  const timeLineY = currentTimeY(now);
  if (timeLineY === null) return null;
  return <View pointerEvents="none" style={[styles.nowLine, { top: timeLineY, left: timeColumnWidth + ((now.getDay() || 7) - 1) * columnWidth + 2, width: columnWidth - 4, backgroundColor: color }]}><View style={[styles.nowDot, { backgroundColor: color }]} /></View>;
}

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

function CourseFace({ course, height, ink, compact, onEdit }: {
  course: Course;
  height: number;
  ink: string;
  compact: boolean;
  onEdit?: () => void;
}) {
  const icon = courseIconSpec(course.icon, course.type);
  const stableTint = /^#[0-9a-fA-F]{6}$/.test(course.color) ? `${course.color}24` : 'rgba(120,140,190,0.14)';
  const content = <>
    <View style={styles.courseGlyph}><AppIcon ios={icon.ios} android={icon.android} color={ink} size={compact ? 13 : 15} fallback="·" /></View>
    <Text numberOfLines={3} style={[styles.courseName, compact && styles.courseNameCompact, { color: ink, textShadowColor: ink === '#FFFFFF' ? 'rgba(20,22,45,0.32)' : 'rgba(255,255,255,0.45)' }]}>{course.name}</Text>
    <Text numberOfLines={2} style={[styles.courseMeta, compact && styles.courseMetaCompact, { color: ink, textShadowColor: ink === '#FFFFFF' ? 'rgba(20,22,45,0.28)' : 'rgba(255,255,255,0.45)' }]}>{course.location}</Text>
    {height > rowHeight * 1.7 ? <Text numberOfLines={1} style={[styles.courseTeacher, { color: ink }]}>{course.teacher}</Text> : null}
  </>;
  return <>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 15, backgroundColor: stableTint }]} />
    <GlassBackdrop radius={15} effectStyle="regular" tintColor={course.color} />
    {course.backgroundUri ? <Image source={{ uri: course.backgroundUri }} resizeMode="cover" style={[StyleSheet.absoluteFill, { borderRadius: 15, opacity: 0.29 }]} /> : null}
    {onEdit ? <MotionPressable onPress={onEdit} style={styles.courseContents}>{content}</MotionPressable> : <View style={styles.courseContents}>{content}</View>}
  </>;
}

function DraggableCourse({ course, left, top, width, height, ink, compact, weekSwipe, onMove, onDragState, onEdit }: {
  course: Course;
  left: number;
  top: number;
  width: number;
  height: number;
  ink: string;
  compact: boolean;
  weekSwipe: ReturnType<typeof Gesture.Pan>;
  onMove: (course: Course, dx: number, dy: number) => void;
  onDragState: (courseId: string, active: boolean) => void;
  onEdit: (id: string) => void;
}) {
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const [dragging, setDragging] = useState(false);
  const dragGesture = useMemo(() => Gesture.Pan()
    .activateAfterLongPress(200)
    .blocksExternalGesture(weekSwipe)
    .onStart(() => {
      dragX.value = 0;
      dragY.value = 0;
      dragScale.value = withTiming(1.012, { duration: 100, reduceMotion: ReduceMotion.System });
      runOnJS(setDragging)(true);
      runOnJS(onDragState)(course.id, true);
      runOnJS(dragHaptic)();
    })
    .onUpdate((event) => {
      dragX.value = event.translationX;
      dragY.value = event.translationY;
    })
    .onEnd((event) => {
      const dx = Math.min(7 - course.weekday, Math.max(1 - course.weekday, Math.round(event.translationX / width)));
      const dy = Math.min(12 - course.endPeriod, Math.max(1 - course.startPeriod, Math.round(event.translationY / rowHeight)));
      // Snap once; never spring the old offset on top of the new grid position.
      dragX.value = 0;
      dragY.value = 0;
      runOnJS(onMove)(course, dx, dy);
    })
    .onFinalize(() => {
      dragX.value = withTiming(0, { duration: 110, reduceMotion: ReduceMotion.System });
      dragY.value = withTiming(0, { duration: 110, reduceMotion: ReduceMotion.System });
      dragScale.value = withTiming(1, { duration: 110, reduceMotion: ReduceMotion.System });
      runOnJS(setDragging)(false);
      runOnJS(onDragState)(course.id, false);
    }), [course, onDragState, onMove, weekSwipe, width, dragX, dragY, dragScale]);
  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }, { scale: dragScale.value }],
  }));
  const previewStyle = useAnimatedStyle(() => {
    const snappedX = Math.min((7 - course.weekday) * width, Math.max(-(course.weekday - 1) * width, Math.round(dragX.value / width) * width));
    const snappedY = Math.min((12 - course.endPeriod) * rowHeight, Math.max(-(course.startPeriod - 1) * rowHeight, Math.round(dragY.value / rowHeight) * rowHeight));
    return { transform: [{ translateX: snappedX }, { translateY: snappedY }] };
  });

  return (
    <>
      {dragging ? <Animated.View pointerEvents="none" style={[styles.dropTarget, { left, top, width, height, borderColor: `${course.color}B8`, backgroundColor: `${course.color}16` }, previewStyle]}><Text style={[styles.dropHint, { color: course.color }]}>释放调整</Text></Animated.View> : null}
      <GestureDetector gesture={dragGesture}><Animated.View
        accessibilityRole="adjustable"
        accessibilityLabel={`${course.name}，按住拖动调整课程时间`}
        style={[styles.courseBlock, { left, top, width, height, zIndex: dragging ? 10 : 1, shadowOpacity: dragging ? 0.2 : 0.1, backgroundColor: 'transparent' }, dragStyle]}
      >
        <CourseFace course={course} height={height} ink={ink} compact={compact} onEdit={() => onEdit(course.id)} />
      </Animated.View></GestureDetector>
    </>
  );
}

type WeekTrackHandle = { changeWeek: (delta: -1 | 1) => void };

// Remount only the track after a completed page turn. The outgoing track is
// already showing the destination page; its replacement starts centered on
// that same week. The glass Card stays mounted, so neither the material nor
// the wallpaper has a blank frame during the handoff.
const WeekTrack = forwardRef<WeekTrackHandle, {
  week: number;
  pageWidth: number;
  onCommit: (delta: number) => void;
  renderPage: (delta: number, weekSwipe: ReturnType<typeof Gesture.Pan>) => ReactNode;
}>(function WeekTrack({ week, pageWidth, onCommit, renderPage }, ref) {
  const dragX = useSharedValue(0);
  const locked = useSharedValue(false);
  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value }] }));
  const tick = useCallback(selectionTick, []);
  const changeWeek = useCallback((delta: -1 | 1) => {
    if (pageWidth <= 0 || locked.value || !canChangeWeek(week, delta)) return;
    locked.value = true;
    tick();
    dragX.value = withTiming(-delta * pageWidth, { duration: 220, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }, (finished) => {
      if (finished) runOnJS(onCommit)(delta);
      else {
        locked.value = false;
        dragX.value = withSpring(0, motion.springSoft);
      }
    });
  }, [dragX, locked, onCommit, pageWidth, tick, week]);
  useImperativeHandle(ref, () => ({ changeWeek }), [changeWeek]);
  const weekSwipe = useMemo(() => Gesture.Pan()
    .enabled(pageWidth > 0)
    .activeOffsetX([-14, 14])
    .failOffsetY([-11, 11])
    .onUpdate((event) => {
      if (locked.value) return;
      const delta = event.translationX < 0 ? 1 : -1;
      const allowed = canChangeWeek(week, delta);
      dragX.value = allowed
        ? Math.max(-pageWidth, Math.min(pageWidth, event.translationX))
        : Math.max(-24, Math.min(24, event.translationX * 0.16));
    })
    .onEnd((event) => {
      if (locked.value) return;
      // RNGH reports px/s; the shared resolver and its tests use px/ms.
      const delta = resolveWeekSwipe(event.translationX, event.velocityX / 1000, pageWidth, week);
      if (delta !== 0) {
        locked.value = true;
        runOnJS(tick)();
        dragX.value = withTiming(-delta * pageWidth, { duration: 190, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }, (finished) => {
          if (finished) runOnJS(onCommit)(delta);
          else {
            locked.value = false;
            dragX.value = withSpring(0, motion.springSoft);
          }
        });
      } else dragX.value = withSpring(0, motion.springSoft);
    })
    .onFinalize((_event, success) => {
      if (!success && !locked.value) dragX.value = withSpring(0, motion.springSoft);
    }), [dragX, locked, onCommit, pageWidth, tick, week]);

  return <GestureDetector gesture={weekSwipe}><View style={[styles.trackViewport, { width: pageWidth, height: 47 + 12 * rowHeight }]}>
    <Animated.View style={[styles.weekTrack, { width: pageWidth * 3, marginLeft: -pageWidth }, dragStyle]}>
      {renderPage(-1, weekSwipe)}
      {renderPage(0, weekSwipe)}
      {renderPage(1, weekSwipe)}
    </Animated.View>
  </View></GestureDetector>;
});

export default function ScheduleScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const app = useApp();
  const { data } = app;
  const [syncing, setSyncing] = useState(false);
  const [draggingCourseId, setDraggingCourseId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekTrackRef = useRef<WeekTrackHandle>(null);
  const baseWeek = currentWeek(data.settings.termStart);
  const week = Math.max(1, Math.min(30, baseWeek + weekOffset));
  const weekStart = dateForWeekday(1);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const days = Array.from({ length: 7 }, (_, index) => index + 1);
  const gridWidth = Math.max(0, width - 48);
  const pageWidth = gridWidth;
  const columnWidth = (gridWidth - timeColumnWidth) / 7;
  const compact = width < 400;
  const glass = data.settings.visualMode === 'glass';
  const dark = theme.background === '#000000';
  const todayWeekday = new Date().getDay() || 7;
  const completeWeek = useCallback((delta: number) => {
    setWeekOffset((current) => Math.max(1 - baseWeek, Math.min(30 - baseWeek, current + delta)));
  }, [baseWeek]);

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

  const renderWeekGrid = (delta: number, weekSwipe: ReturnType<typeof Gesture.Pan>) => {
    const pageWeek = week + delta;
    const pageOffset = weekOffset + delta;
    const pageStart = new Date(weekStart);
    pageStart.setDate(pageStart.getDate() + delta * 7);
    const interactive = delta === 0;
    return (
      <View style={{ width: gridWidth }} pointerEvents={interactive ? 'auto' : 'none'}>
          <View style={styles.dayHeader}>
            <View style={{ width: timeColumnWidth }} />
            {days.map((day) => {
              const date = new Date(pageStart);
              date.setDate(date.getDate() + day - 1);
              const isToday = pageOffset === 0 && todayWeekday === day;
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
            {data.courses.filter((course) => course.weekday >= 1 && course.weekday <= 7 && course.weeks.includes(pageWeek)).map((course) => {
              const ink = courseInk(course.color, glass, dark);
              const position = {
                left: timeColumnWidth + (course.weekday - 1) * columnWidth + 2,
                top: (course.startPeriod - 1) * rowHeight + 3,
                width: columnWidth - 4,
                height: (course.endPeriod - course.startPeriod + 1) * rowHeight - 6,
              };
              return interactive ? <DraggableCourse
                key={course.id}
                course={course}
                {...position}
                ink={ink}
                compact={compact}
                weekSwipe={weekSwipe}
                onDragState={handleDragState}
                onMove={handleCourseMove}
                onEdit={(courseId) => router.push({ pathname: '/course-editor', params: { id: courseId } })}
              /> : <View key={course.id} style={[styles.courseBlock, position, { backgroundColor: 'transparent' }]}><CourseFace course={course} height={position.height} ink={ink} compact={compact} /></View>;
            })}
            {pageOffset === 0 ? <CurrentTimeLine columnWidth={columnWidth} color={theme.red} /> : null}
          </View>
      </View>
    );
  };

  return (
    <Screen scrollEnabled={!draggingCourseId}>
      <View style={styles.topRow}>
        <View><Text style={[styles.kicker, { color: theme.secondary }]}>2026 秋季学期 · {weekStart.getMonth() + 1}月{weekStart.getDate()}日—{weekEnd.getMonth() + 1}月{weekEnd.getDate()}日</Text><Text style={[styles.title, { color: theme.text }]}>第 {week} 周课表</Text></View>
        <MotionPressable onPress={() => router.push('/import')} style={[styles.importButton, { backgroundColor: theme.primarySoft }]}><Text style={[styles.importText, { color: theme.primary }]}>＋ 导入</Text></MotionPressable>
      </View>
      <View style={styles.weekTools}>
        <MotionPressable accessibilityLabel="上一周" onPress={() => weekTrackRef.current?.changeWeek(-1)} style={[styles.weekButton, { backgroundColor: theme.surfaceAlt }]}><AppIcon ios="chevron.left" android="chevron_left" color={theme.primary} size={18} /></MotionPressable>
        <Text style={[styles.weekHint, { color: theme.secondary }]}>左右滑动切换周次</Text>
        <MotionPressable accessibilityLabel="下一周" onPress={() => weekTrackRef.current?.changeWeek(1)} style={[styles.weekButton, { backgroundColor: theme.surfaceAlt }]}><AppIcon ios="chevron.right" android="chevron_right" color={theme.primary} size={18} /></MotionPressable>
        <MotionPressable accessibilityLabel="添加课程" onPress={() => router.push('/course-editor')} style={[styles.addButton, { backgroundColor: theme.primarySoft }]}><Text style={[styles.addText, { color: theme.primary }]}>＋ 课程</Text></MotionPressable>
      </View>
      <View style={styles.weekViewport}>
        <Card animateLayout={false} style={[styles.gridCard, glass && { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.72)' }]}>
          <WeekTrack key={`${week}:${gridWidth}`} ref={weekTrackRef} week={week} pageWidth={pageWidth} onCommit={completeWeek} renderPage={renderWeekGrid} />
        </Card>
      </View>
      <View style={styles.buttonRow}><View style={{ flex: 1 }}><PrimaryButton label={syncing ? '同步中…' : '同步 iPhone 日历'} disabled={syncing} onPress={sync} /></View></View>
      <Text style={[styles.tip, { color: theme.secondary }]}>点课程编辑详情；按住课程约 0.2 秒后拖动调整，直接横滑课表切换周数。</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, marginBottom: 10 },
  kicker: { fontSize: 12, fontWeight: '600', marginBottom: 2 }, title: { fontSize: 29, fontWeight: '600' },
  importButton: { borderRadius: 17, paddingHorizontal: 15, paddingVertical: 10 }, importText: { fontWeight: '700', fontSize: 14 },
  weekTools: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 }, weekButton: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, weekHint: { flex: 1, fontSize: 10, textAlign: 'center' }, addButton: { minHeight: 34, paddingHorizontal: 10, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, addText: { fontSize: 11, fontWeight: '600' },
  weekViewport: { overflow: 'hidden', borderRadius: 28 }, trackViewport: { overflow: 'hidden' }, weekTrack: { flexDirection: 'row' },
  gridCard: { padding: 6, borderRadius: 28, overflow: 'hidden' }, dayHeader: { flexDirection: 'row', height: 47, alignItems: 'center' }, dayCell: { alignItems: 'center', gap: 3 }, dayName: { fontSize: 11, fontWeight: '700' },
  dateDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, dayDate: { fontSize: 12, fontWeight: '700' }, grid: { position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, height: rowHeight },
  periodMarker: { width: timeColumnWidth, height: rowHeight, paddingVertical: 5, alignItems: 'center', justifyContent: 'space-between' },
  periodNumber: { width: timeColumnWidth, textAlign: 'center', fontSize: 11, lineHeight: 14, fontWeight: '800' },
  periodTime: { width: timeColumnWidth, textAlign: 'center', fontSize: 8, lineHeight: 10, fontVariant: ['tabular-nums'] },
  verticalLine: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: StyleSheet.hairlineWidth }, courseBlock: { position: 'absolute', borderRadius: 15, padding: 8, shadowColor: '#203060', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 9, elevation: 3 }, courseContents: { flex: 1 }, dropTarget: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 15, justifyContent: 'center', alignItems: 'center', zIndex: 0 }, dropHint: { fontSize: 8, fontWeight: '600', opacity: 0.8 }, courseGlyph: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.42)', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  nowLine: { position: 'absolute', height: 2, borderRadius: 1, zIndex: 8 }, nowDot: { position: 'absolute', left: -3, top: -2, width: 6, height: 6, borderRadius: 3 },
  courseName: { color: '#FFFFFF', fontSize: 11, lineHeight: 14, fontWeight: '600', textShadowColor: 'rgba(20,22,45,0.28)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, courseNameCompact: { fontSize: 10, lineHeight: 13 }, courseMeta: { color: 'rgba(255,255,255,0.96)', fontSize: 8.5, lineHeight: 10, marginTop: 4, fontWeight: '500', textShadowColor: 'rgba(20,22,45,0.24)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, courseMetaCompact: { fontSize: 8, lineHeight: 9 }, courseTeacher: { fontSize: 8, lineHeight: 10, marginTop: 5, fontWeight: '500', opacity: 0.72 },
  buttonRow: { flexDirection: 'row', marginTop: 16 }, tip: { fontSize: 12, lineHeight: 18, marginTop: 10, paddingHorizontal: 4 },
});
