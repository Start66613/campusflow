import { router } from 'expo-router';
import { type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { AppIcon, type AppIconProps } from '@/components/app-icon';
import { MotionPressable } from '@/components/motion';
import { radii, useAppTheme } from '@/src/theme';

export const habitSymbols: { key: string; label: string; ios: AppIconProps['ios']; android: AppIconProps['android'] }[] = [
  { key: 'leaf', label: '成长', ios: 'leaf.fill', android: 'eco' },
  { key: 'water', label: '喝水', ios: 'drop.fill', android: 'water_drop' },
  { key: 'book', label: '阅读', ios: 'book.fill', android: 'menu_book' },
  { key: 'walk', label: '运动', ios: 'figure.walk', android: 'directions_walk' },
  { key: 'sun', label: '晨间', ios: 'sun.max.fill', android: 'light_mode' },
  { key: 'moon', label: '睡眠', ios: 'moon.fill', android: 'bedtime' },
  { key: 'heart', label: '健康', ios: 'heart.fill', android: 'favorite' },
  { key: 'pencil', label: '记录', ios: 'pencil', android: 'edit' },
  { key: 'study', label: '学习', ios: 'graduationcap.fill', android: 'school' },
  { key: 'music', label: '音乐', ios: 'music.note', android: 'music_note' },
  { key: 'star', label: '心愿', ios: 'star.fill', android: 'star' },
  { key: 'focus', label: '专注', ios: 'timer', android: 'timer' },
];
export const habitColors = ['#5E5CE6', '#258B73', '#2D83C5', '#C36A3D', '#CC5C7D', '#9572BD', '#958029', '#657B89'];
export const moods = ['低落', '疲惫', '平静', '不错', '开心'];

export function HabitSymbol({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  const item = habitSymbols.find((symbol) => symbol.key === name) ?? habitSymbols[0];
  return <AppIcon ios={item.ios} android={item.android} color={color} size={size} />;
}

export function DailyPage({ title, subtitle, children, action }: PropsWithChildren<{ title: string; subtitle?: string; action?: React.ReactNode }>) {
  const theme = useAppTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
    <AppBackdrop />
    <View style={dailyStyles.header}>
      <MotionPressable accessibilityLabel="返回" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={[dailyStyles.iconButton, { backgroundColor: theme.surfaceAlt }]}><AppIcon ios="chevron.left" android="arrow_back" color={theme.text} size={20} /></MotionPressable>
      <View style={{ flex: 1 }}><Text style={[dailyStyles.pageTitle, { color: theme.text }]}>{title}</Text>{subtitle ? <Text style={[dailyStyles.caption, { color: theme.secondary }]}>{subtitle}</Text> : null}</View>{action}
    </View>
    <KeyboardAvoidingView style={{ flex: 1, width: '100%', overflow: 'hidden' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1, width: '100%' }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={dailyStyles.pageContent}>{children}</ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function DailyForm({ visible, title, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  const theme = useAppTheme();
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
      <View style={dailyStyles.header}><View style={{ flex: 1 }}><Text style={[dailyStyles.pageTitle, { color: theme.text }]}>{title}</Text></View><TextButton label="取消" onPress={onClose} /></View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={dailyStyles.pageContent}>{children}</ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const theme = useAppTheme();
  return <View style={{ gap: 7 }}><Text style={[dailyStyles.label, { color: theme.secondary }]}>{label}</Text><TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label} placeholderTextColor={theme.secondary} style={[dailyStyles.input, { color: theme.text, backgroundColor: theme.surfaceAlt }, props.multiline ? { minHeight: 140, paddingTop: 14, textAlignVertical: 'top' } : undefined, props.style]} /></View>;
}

export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return <MotionPressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[dailyStyles.choice, { backgroundColor: selected ? theme.primarySoft : theme.surfaceAlt, borderColor: selected ? theme.primary : 'transparent' }]}><Text style={{ color: selected ? theme.primary : theme.text, fontSize: 13, fontWeight: selected ? '600' : '400' }}>{label}</Text></MotionPressable>;
}

export function TextButton({ label, onPress, danger = false, disabled = false }: { label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  const theme = useAppTheme();
  return <MotionPressable disabled={disabled} onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, opacity: disabled ? 0.4 : 1 }}><Text style={{ color: danger ? theme.red : theme.primary, fontSize: 14, fontWeight: '600' }}>{label}</Text></MotionPressable>;
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return year >= 2000 && year <= 2100 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export const dailyStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 25, fontWeight: '600' }, pageContent: { width: '100%', alignItems: 'stretch', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 32, gap: 16 },
  caption: { fontSize: 12, lineHeight: 18, marginTop: 3 }, label: { fontSize: 13, fontWeight: '500' },
  input: { minHeight: 48, borderRadius: radii.compact, paddingHorizontal: 14, fontSize: 16 },
  choice: { minHeight: 44, paddingHorizontal: 13, borderRadius: radii.compact, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  section: { gap: 13 }, sectionTitle: { fontSize: 19, fontWeight: '600' }, body: { fontSize: 14, lineHeight: 22 },
  error: { fontSize: 13, lineHeight: 20 }, divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
});
