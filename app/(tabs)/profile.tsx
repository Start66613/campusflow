import { router } from 'expo-router';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconProps } from '@/components/app-icon';
import { MotionPressable } from '@/components/motion';
import { SegmentedControl } from '@/components/segmented-control';
import { SettingToggle } from '@/components/setting-toggle';
import { Card, Screen, SectionTitle } from '@/components/ui';
import { scheduleStudyReminder, scheduleWakeReminder } from '@/src/notifications';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import { useReduceTransparency } from '@/src/accessibility';
import type { ThemeMode, VisualMode } from '@/src/types';

type IconSpec = Pick<AppIconProps, 'ios' | 'android'>;

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { data, updateSettings } = useApp();
  const reduceTransparency = useReduceTransparency();
  const nativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const setAlarm = async () => {
    try {
      await scheduleWakeReminder(data.settings.wakeHour, data.settings.wakeMinute);
      Alert.alert('已设置', `明早 ${String(data.settings.wakeHour).padStart(2, '0')}:${String(data.settings.wakeMinute).padStart(2, '0')} 会发送起床提醒。`);
    } catch (error) { Alert.alert('设置失败', error instanceof Error ? error.message : '请检查通知权限'); }
  };
  const toggleStudy = async (value: boolean) => {
    updateSettings({ studyReminders: value });
    if (value) {
      try { await scheduleStudyReminder(data.courses); } catch (error) { Alert.alert('提醒未开启', error instanceof Error ? error.message : '请检查通知权限'); }
    }
  };
  return (
    <Screen>
      <View style={styles.profileHeader}><View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}><AppIcon ios="graduationcap.fill" android="school" color={theme.primary} size={30} /></View><View><Text style={[styles.name, { color: theme.text }]}>{data.settings.displayName}</Text><Text style={[styles.school, { color: theme.secondary }]}>{data.settings.schoolName} · 本科生</Text></View></View>
      <View style={styles.actionRow}>
        <SmallAction icon={{ ios: 'square.and.arrow.down.fill', android: 'download' }} label="导入课表" onPress={() => router.push('/import')} />
        <SmallAction icon={{ ios: 'sparkles', android: 'auto_awesome' }} label="连接 AI" onPress={() => router.push('/ai-settings')} />
        <SmallAction icon={{ ios: 'alarm.fill', android: 'alarm' }} label="早八提醒" onPress={setAlarm} />
      </View>
      <SectionTitle title="智能提醒" />
      <Card style={styles.listCard}>
        <SettingRow icon={{ ios: 'book.fill', android: 'menu_book' }} title="空闲学习提醒" subtitle="根据课表寻找无课时间" right={<SettingToggle label="空闲学习提醒" value={data.settings.studyReminders} onValueChange={toggleStudy} />} />
        <SettingRow icon={{ ios: 'alarm.fill', android: 'alarm' }} title="早八起床提醒" subtitle={`${String(data.settings.wakeHour).padStart(2, '0')}:${String(data.settings.wakeMinute).padStart(2, '0')} · 点击重新设置`} onPress={setAlarm} />
        <SettingRow icon={{ ios: 'brain.head.profile.fill', android: 'psychology' }} title="AI 深度思考" subtitle="复杂表达会多一步核对，并显示处理摘要" right={<SettingToggle label="AI 深度思考" value={data.settings.aiThinking} onValueChange={(value) => updateSettings({ aiThinking: value })} />} last />
      </Card>
      <SectionTitle title="显示模式" />
      <SegmentedControl
        items={[{ value: 'system', label: '跟随系统' }, { value: 'light', label: '浅色' }, { value: 'dark', label: '深色' }, { value: 'eye', label: '护眼' }]}
        value={data.settings.themeMode}
        onChange={(value) => updateSettings({ themeMode: value as ThemeMode })}
      />
      <SectionTitle title="界面质感" />
      <SegmentedControl
        items={([
          ['glass', '液态玻璃', 'drop.fill', 'blur_on'],
          ['native', '经典原生', 'rectangle.inset.filled', 'view_agenda'],
        ] as const).map(([value, label, ios, android]) => ({
          value,
          label,
          icon: <AppIcon ios={ios} android={android} color={data.settings.visualMode === value ? theme.primary : theme.secondary} size={18} />,
        }))}
        value={data.settings.visualMode}
        onChange={(value) => updateSettings({ visualMode: value as VisualMode })}
      />
      <Text style={[styles.visualNote, { color: theme.secondary }]}>{nativeGlass && !reduceTransparency ? '当前设备支持原生 Liquid Glass；iOS 27“设置 > 外观 > Liquid Glass”滑杆会由系统自动作用于原生材质。' : Platform.OS === 'ios' && reduceTransparency ? '已跟随系统“降低透明度”设置，改用更清晰的不透明材质。' : Platform.OS === 'ios' ? '当前设备显示兼容材质；原生效果需要 iOS 26 及系统 API 支持。' : 'Android 使用高对比玻璃模拟材质；苹果原生 Liquid Glass 仅在兼容的 iPhone 上可用。'}</Text>
      <SectionTitle title="数据与同步" />
      <Card style={styles.listCard}>
        <SettingRow icon={{ ios: 'building.columns.fill', android: 'school' }} title="湘潭大学教务" subtitle="网页登录后导入课表与成绩" onPress={() => router.push('/school')} />
        <SettingRow icon={{ ios: 'cloud.fill', android: 'cloud' }} title="iCloud / 日历" subtitle="由 iOS 系统负责跨设备同步" onPress={() => router.push('/schedule')} />
        <SettingRow icon={{ ios: 'lock.shield.fill', android: 'lock' }} title="个人 AI 密钥" subtitle="使用系统安全区加密保存" onPress={() => router.push('/ai-settings')} last />
      </Card>
      <Text style={[styles.version, { color: theme.secondary }]}>CampusFlow 1.0.0 · 为自己的校园生活而做</Text>
    </Screen>
  );
}

function SmallAction({ icon, label, onPress }: { icon: IconSpec; label: string; onPress: () => void }) {
  const theme = useAppTheme();
  return <MotionPressable onPress={onPress} pressedScale={0.96} style={[styles.smallAction, { backgroundColor: theme.surface, borderColor: theme.line, shadowColor: theme.shadow }]}><AppIcon {...icon} color={theme.primary} size={22} /><Text style={[styles.smallLabel, { color: theme.text }]}>{label}</Text></MotionPressable>;
}

function SettingRow({ icon, title, subtitle, right, onPress, last = false }: { icon: IconSpec; title: string; subtitle: string; right?: ReactNode; onPress?: () => void; last?: boolean }) {
  const theme = useAppTheme();
  const rowStyle = [styles.settingRow, !last && { borderBottomColor: theme.line, borderBottomWidth: StyleSheet.hairlineWidth }];
  const content = <><View style={[styles.settingIcon, { backgroundColor: theme.surfaceAlt }]}><AppIcon {...icon} color={theme.primary} size={19} /></View><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text><Text style={[styles.settingSubtitle, { color: theme.secondary }]}>{subtitle}</Text></View>{right ? <View style={styles.settingTrailing}>{right}</View> : <AppIcon ios="chevron.right" android="chevron_right" color={theme.secondary} size={17} />}</>;
  return onPress ? <MotionPressable onPress={onPress} style={rowStyle}>{content}</MotionPressable> : <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingTop: 12, marginBottom: 22 }, avatar: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginBottom: 5 }, school: { fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10 }, smallAction: { flex: 1, gap: 7, alignItems: 'center', borderRadius: 21, paddingVertical: 15, borderWidth: StyleSheet.hairlineWidth, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 }, smallLabel: { fontSize: 12, fontWeight: '600' },
  listCard: { paddingVertical: 0, paddingHorizontal: 15 }, settingRow: { minHeight: 74, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, settingCopy: { flex: 1, minWidth: 0 }, settingTrailing: { width: 56, height: 48, alignItems: 'center', justifyContent: 'center' }, settingTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 }, settingSubtitle: { fontSize: 11.5, lineHeight: 17 }, chevron: { fontSize: 25 },
  visualNote: { fontSize: 11, lineHeight: 17, marginTop: 8, paddingHorizontal: 4 }, version: { textAlign: 'center', fontSize: 11, marginTop: 28 },
});
