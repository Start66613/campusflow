import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { MotionPressable } from '@/components/motion';
import { Card, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
import { courseIconOptions } from '@/src/course-icons';
import { pickPersistentImage } from '@/src/local-images';
import { parseCourseWeeks, periodEnds, periodStarts } from '@/src/periods';
import { useApp } from '@/src/store';
import { courseColors, useAppTheme } from '@/src/theme';
import type { CourseIcon, CourseType } from '@/src/types';

const extraColors = ['#D85B83', '#E8A441', '#697B88', '#3559AE'];
const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const types: { value: CourseType; label: string }[] = [
  { value: 'major', label: '专业课' }, { value: 'general', label: '公共课' }, { value: 'lab', label: '实验课' }, { value: 'elective', label: '选修课' },
];

export default function CourseEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const app = useApp();
  const theme = useAppTheme();
  const existing = app.data.courses.find((course) => course.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [teacher, setTeacher] = useState(existing?.teacher ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [weekday, setWeekday] = useState(existing?.weekday ?? 1);
  const [startPeriod, setStartPeriod] = useState(existing?.startPeriod ?? 1);
  const [endPeriod, setEndPeriod] = useState(existing?.endPeriod ?? 2);
  const [startTime, setStartTime] = useState(existing?.startTime ?? periodStarts[0]);
  const [endTime, setEndTime] = useState(existing?.endTime ?? periodEnds[1]);
  const [weeks, setWeeks] = useState(existing?.weeks.join(',') ?? '1-18');
  const [color, setColor] = useState(existing?.color ?? courseColors[0]);
  const [type, setType] = useState<CourseType>(existing?.type ?? 'major');
  const [icon, setIcon] = useState<CourseIcon>(existing?.icon ?? 'book');
  const [backgroundUri, setBackgroundUri] = useState(existing?.backgroundUri);
  const previewColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : courseColors[0];

  const updateStart = (value: number) => {
    const next = Math.max(1, Math.min(12, value));
    setStartPeriod(next);
    setStartTime(periodStarts[next - 1]);
    if (next > endPeriod) { setEndPeriod(next); setEndTime(periodEnds[next - 1]); }
  };
  const updateEnd = (value: number) => {
    const next = Math.max(startPeriod, Math.min(12, value));
    setEndPeriod(next);
    setEndTime(periodEnds[next - 1]);
  };
  const chooseBackground = async () => {
    try {
      const uri = await pickPersistentImage('course');
      if (uri) setBackgroundUri(uri);
    } catch (error) { Alert.alert('无法选择图片', error instanceof Error ? error.message : '请稍后重试'); }
  };
  const save = () => {
    try {
      if (!name.trim()) throw new Error('请填写课程名称。');
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime) throw new Error('时间请填写为 HH:mm，且结束时间要晚于开始时间。');
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error('自定义颜色请填写 6 位十六进制色值，例如 #5B67F1。');
      const draft = { name: name.trim(), teacher: teacher.trim(), location: location.trim(), weekday, startPeriod, endPeriod, startTime, endTime, weeks: parseCourseWeeks(weeks), color: color.toUpperCase(), type, icon, backgroundUri };
      if (existing) app.updateCourse({ ...existing, ...draft }); else app.addCourse(draft);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.back();
    } catch (error) { Alert.alert('请检查课程信息', error instanceof Error ? error.message : '无法保存课程'); }
  };
  const remove = () => {
    if (!existing) return;
    Alert.alert('删除这门课程？', `${existing.name} 将从课表移除，此操作无法撤销。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除课程', style: 'destructive', onPress: () => { app.deleteCourse(existing.id); router.back(); } },
    ]);
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>{existing ? '编辑课程' : '添加课程'}</Text>
      <Text style={[styles.subtitle, { color: theme.secondary }]}>课程名称、老师、地点、周次、时间与外观都可以自定义。</Text>
      <SectionTitle title="基本信息" />
      <Card style={styles.card}>
        <Field label="课程名称 *" value={name} onChangeText={setName} placeholder="例如：大学物理实验" />
        <Field label="教师" value={teacher} onChangeText={setTeacher} placeholder="教师姓名" />
        <Field label="上课地点" value={location} onChangeText={setLocation} placeholder="教学楼与教室" />
        <Text style={[styles.label, { color: theme.secondary }]}>课程类型</Text>
        <View style={styles.wrap}>{types.map((item) => <Choice key={item.value} label={item.label} selected={type === item.value} onPress={() => setType(item.value)} />)}</View>
      </Card>

      <SectionTitle title="上课时间" />
      <Card style={styles.card}>
        <Text style={[styles.label, { color: theme.secondary }]}>星期</Text>
        <View style={styles.wrap}>{days.map((label, index) => <Choice key={label} label={label} selected={weekday === index + 1} onPress={() => setWeekday(index + 1)} />)}</View>
        <View style={styles.periodRow}><Stepper label="开始节次" value={startPeriod} onChange={updateStart} min={1} max={12} /><Stepper label="结束节次" value={endPeriod} onChange={updateEnd} min={startPeriod} max={12} /></View>
        <View style={styles.periodRow}><View style={styles.flex}><Field label="开始时间" value={startTime} onChangeText={setStartTime} placeholder="08:00" keyboardType="numbers-and-punctuation" /></View><View style={styles.flex}><Field label="结束时间" value={endTime} onChangeText={setEndTime} placeholder="09:40" keyboardType="numbers-and-punctuation" /></View></View>
        <Field label="上课周次" value={weeks} onChangeText={setWeeks} placeholder="1-18，或 1-18单、2-18双" />
        <Text style={[styles.hint, { color: theme.secondary }]}>支持连续周、单周/双周以及用逗号分隔的多个周次。</Text>
      </Card>

      <SectionTitle title="课程外观" />
      <Card style={styles.card}>
        <Text style={[styles.label, { color: theme.secondary }]}>课程色</Text>
        <View style={styles.colors}>{[...courseColors, ...extraColors].map((choice) => <MotionPressable key={choice} accessibilityLabel={`课程颜色 ${choice}`} accessibilityState={{ selected: color.toUpperCase() === choice.toUpperCase() }} onPress={() => setColor(choice)} style={[styles.colorChoice, { backgroundColor: choice, borderColor: color.toUpperCase() === choice.toUpperCase() ? theme.text : 'transparent' }]}>{color.toUpperCase() === choice.toUpperCase() ? <Text style={styles.colorCheck}>✓</Text> : null}</MotionPressable>)}</View>
        <Field label="自定义色值" value={color} onChangeText={setColor} placeholder="#5B67F1" autoCapitalize="characters" />
        <Text style={[styles.label, { color: theme.secondary }]}>课程标志</Text>
        <View style={styles.iconGrid}>{courseIconOptions.map((item) => <MotionPressable key={item.value} accessibilityLabel={`${item.label}课程标志`} accessibilityState={{ selected: icon === item.value }} onPress={() => setIcon(item.value)} style={[styles.iconChoice, { backgroundColor: icon === item.value ? theme.primarySoft : theme.surfaceAlt, borderColor: icon === item.value ? theme.primary : 'transparent' }]}><AppIcon ios={item.ios} android={item.android} color={icon === item.value ? theme.primary : theme.secondary} size={22} /><Text style={[styles.iconLabel, { color: theme.text }]}>{item.label}</Text></MotionPressable>)}</View>
        <MotionPressable onPress={chooseBackground} style={[styles.backgroundPreview, { backgroundColor: `${previewColor}55` }]}>{backgroundUri ? <Image source={{ uri: backgroundUri }} style={styles.backgroundImage} resizeMode="cover" /> : <AppIcon ios="photo.fill" android="image" color={theme.primary} size={27} />}<View style={styles.backgroundCaption}><Text style={styles.backgroundCaptionText}>{backgroundUri ? '更换课程背景' : '添加课程背景图'}</Text></View></MotionPressable>
        {backgroundUri ? <PrimaryButton label="移除课程背景" secondary onPress={() => setBackgroundUri(undefined)} /> : null}
      </Card>
      <View style={styles.actions}><PrimaryButton label={existing ? '保存课程修改' : '添加到课表'} onPress={save} />{existing ? <PrimaryButton label="删除课程" secondary onPress={remove} /> : null}</View>
    </Screen>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const theme = useAppTheme();
  return <View style={styles.field}><Text style={[styles.label, { color: theme.secondary }]}>{label}</Text><TextInput {...props} placeholderTextColor={theme.secondary} style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]} /></View>;
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return <MotionPressable onPress={onPress} style={[styles.choice, { backgroundColor: selected ? theme.primarySoft : theme.surfaceAlt, borderColor: selected ? theme.primary : theme.line }]}><Text style={{ color: selected ? theme.primary : theme.text, fontSize: 12, fontWeight: '700' }}>{label}</Text></MotionPressable>;
}

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number }) {
  const theme = useAppTheme();
  return <View style={styles.flex}><Text style={[styles.label, { color: theme.secondary }]}>{label}</Text><View style={[styles.stepper, { backgroundColor: theme.surfaceAlt }]}><MotionPressable accessibilityLabel={`${label}减少`} onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepButton}><Text style={[styles.stepSymbol, { color: theme.primary }]}>−</Text></MotionPressable><Text style={[styles.stepValue, { color: theme.text }]}>{value}</Text><MotionPressable accessibilityLabel={`${label}增加`} onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepButton}><Text style={[styles.stepSymbol, { color: theme.primary }]}>＋</Text></MotionPressable></View></View>;
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', marginTop: 8 }, subtitle: { fontSize: 12, lineHeight: 19, marginTop: 7 }, card: { gap: 13 }, label: { fontSize: 12, fontWeight: '700' }, hint: { fontSize: 11, lineHeight: 16 }, field: { gap: 6 }, input: { minHeight: 48, borderRadius: 15, paddingHorizontal: 13, fontSize: 15 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { minHeight: 37, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  periodRow: { flexDirection: 'row', gap: 12 }, flex: { flex: 1, gap: 6 }, stepper: { height: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, stepButton: { width: 42, height: 48, alignItems: 'center', justifyContent: 'center' }, stepSymbol: { fontSize: 23, fontWeight: '600' }, stepValue: { fontSize: 17, fontWeight: '800' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, colorChoice: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, colorCheck: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 }, iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, iconChoice: { width: 67, minHeight: 62, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, iconLabel: { fontSize: 10, fontWeight: '700' },
  backgroundPreview: { height: 110, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, backgroundImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: 0.68 }, backgroundCaption: { position: 'absolute', bottom: 8, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5, backgroundColor: 'rgba(16,22,39,0.68)' }, backgroundCaptionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' }, actions: { gap: 10, marginTop: 20 },
});
