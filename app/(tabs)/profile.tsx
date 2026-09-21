import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { AppIcon, type AppIconProps } from '@/components/app-icon';
import { MotionPressable } from '@/components/motion';
import { Card, Screen, SectionTitle } from '@/components/ui';
import { scheduleStudyReminder, scheduleWakeReminder } from '@/src/notifications';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import type { ThemeMode, VisualMode } from '@/src/types';

type IconSpec = Pick<AppIconProps, 'ios' | 'android'>;

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { data, updateSettings } = useApp();
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
        <SettingRow icon={{ ios: 'book.fill', android: 'menu_book' }} title="空闲学习提醒" subtitle="根据课表寻找无课时间" right={<Switch value={data.settings.studyReminders} onValueChange={toggleStudy} trackColor={{ true: theme.primary }} />} />
        <SettingRow icon={{ ios: 'alarm.fill', android: 'alarm' }} title="早八起床提醒" subtitle={`${String(data.settings.wakeHour).padStart(2, '0')}:${String(data.settings.wakeMinute).padStart(2, '0')} · 点击重新设置`} onPress={setAlarm} />
        <SettingRow icon={{ ios: 'brain.head.profile.fill', android: 'psychology' }} title="AI 深度思考" subtitle="复杂表达会多一步核对，并显示处理摘要" right={<Switch value={data.settings.aiThinking} onValueChange={(value) => updateSettings({ aiThinking: value })} trackColor={{ true: theme.primary }} />} last />
      </Card>
      <SectionTitle title="显示模式" />
      <View style={[styles.themeRow, { backgroundColor: theme.surfaceAlt }]}>
        {([['system', '跟随系统'], ['light', '浅色'], ['dark', '深色'], ['eye', '护眼']] as [ThemeMode, string][]).map(([value, label]) => (
          <MotionPressable key={value} onPress={() => updateSettings({ themeMode: value })} style={[styles.themeItem, data.settings.themeMode === value && styles.themeActive, data.settings.themeMode === value && { backgroundColor: theme.surface, shadowColor: theme.shadow }]}><Text style={[styles.themeText, { color: data.settings.themeMode === value ? theme.primary : theme.secondary }]}>{label}</Text></MotionPressable>
        ))}
      </View>
      <SectionTitle title="界面质感" />
      <View style={[styles.visualRow, { backgroundColor: theme.surfaceAlt }]}>
        {([['glass', '液态玻璃'], ['native', '经典原生']] as [VisualMode, string][]).map(([value, label]) => (
          <MotionPressable key={value} onPress={() => updateSettings({ visualMode: value })} style={[styles.visualItem, data.settings.visualMode === value && styles.themeActive, data.settings.visualMode === value && { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
            <AppIcon ios={value === 'glass' ? 'drop.fill' : 'rectangle.inset.filled'} android={value === 'glass' ? 'blur_on' : 'view_agenda'} color={data.settings.visualMode === value ? theme.primary : theme.secondary} size={18} />
            <Text style={[styles.themeText, { color: data.settings.visualMode === value ? theme.primary : theme.secondary }]}>{label}</Text>
          </MotionPressable>
        ))}
      </View>
      <Text style={[styles.visualNote, { color: theme.secondary }]}>iPhone 使用系统 GlassEffect；Android 使用实时模糊与 Material 图标适配。</Text>
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
  return <MotionPressable onPress={onPress} style={[styles.settingRow, !last && { borderBottomColor: theme.line, borderBottomWidth: StyleSheet.hairlineWidth }]}><View style={[styles.settingIcon, { backgroundColor: theme.surfaceAlt }]}><AppIcon {...icon} color={theme.primary} size={19} /></View><View style={{ flex: 1 }}><Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text><Text style={[styles.settingSubtitle, { color: theme.secondary }]}>{subtitle}</Text></View>{right ?? <AppIcon ios="chevron.right" android="chevron_right" color={theme.secondary} size={17} />}</MotionPressable>;
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingTop: 12, marginBottom: 22 }, avatar: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginBottom: 5 }, school: { fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10 }, smallAction: { flex: 1, gap: 7, alignItems: 'center', borderRadius: 21, paddingVertical: 15, borderWidth: StyleSheet.hairlineWidth, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 }, smallLabel: { fontSize: 12, fontWeight: '600' },
  listCard: { paddingVertical: 0, paddingHorizontal: 15 }, settingRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12 }, settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, settingTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 }, settingSubtitle: { fontSize: 11.5 }, chevron: { fontSize: 25 },
  themeRow: { flexDirection: 'row', padding: 3, borderRadius: 14 }, themeItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 11 }, themeActive: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 }, themeText: { fontSize: 12, fontWeight: '600' },
  visualRow: { flexDirection: 'row', padding: 4, borderRadius: 17, gap: 4 }, visualItem: { flex: 1, minHeight: 48, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, visualNote: { fontSize: 11, lineHeight: 17, marginTop: 8, paddingHorizontal: 4 }, version: { textAlign: 'center', fontSize: 11, marginTop: 28 },
});
