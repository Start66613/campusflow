import { router } from 'expo-router';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { AppIcon, type AppIconProps } from '@/components/app-icon';
import { MotionPressable } from '@/components/motion';
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
      Alert.alert('宸茶缃?, `鏄庢棭 ${String(data.settings.wakeHour).padStart(2, '0')}:${String(data.settings.wakeMinute).padStart(2, '0')} 浼氬彂閫佽捣搴婃彁閱掋€俙);
    } catch (error) { Alert.alert('璁剧疆澶辫触', error instanceof Error ? error.message : '璇锋鏌ラ€氱煡鏉冮檺'); }
  };
  const toggleStudy = async (value: boolean) => {
    updateSettings({ studyReminders: value });
    if (value) {
      try { await scheduleStudyReminder(data.courses); } catch (error) { Alert.alert('鎻愰啋鏈紑鍚?, error instanceof Error ? error.message : '璇锋鏌ラ€氱煡鏉冮檺'); }
    }
  };
  return (
    <Screen>
      <View style={styles.profileHeader}><View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}><AppIcon ios="graduationcap.fill" android="school" color={theme.primary} size={30} /></View><View><Text style={[styles.name, { color: theme.text }]}>{data.settings.displayName}</Text><Text style={[styles.school, { color: theme.secondary }]}>{data.settings.schoolName} 路 鏈鐢?/Text></View></View>
      <View style={styles.actionRow}>
        <SmallAction icon={{ ios: 'square.and.arrow.down.fill', android: 'download' }} label="瀵煎叆璇捐〃" onPress={() => router.push('/import')} />
        <SmallAction icon={{ ios: 'sparkles', android: 'auto_awesome' }} label="杩炴帴 AI" onPress={() => router.push('/ai-settings')} />
        <SmallAction icon={{ ios: 'alarm.fill', android: 'alarm' }} label="鏃╁叓鎻愰啋" onPress={setAlarm} />
      </View>
      <SectionTitle title="鏅鸿兘鎻愰啋" />
      <Card style={styles.listCard}>
        <SettingRow icon={{ ios: 'book.fill', android: 'menu_book' }} title="绌洪棽瀛︿範鎻愰啋" subtitle="鏍规嵁璇捐〃瀵绘壘鏃犺鏃堕棿" right={<Switch value={data.settings.studyReminders} onValueChange={toggleStudy} trackColor={{ true: theme.primary }} />} />
        <SettingRow icon={{ ios: 'alarm.fill', android: 'alarm' }} title="鏃╁叓璧峰簥鎻愰啋" subtitle={`${String(data.settings.wakeHour).padStart(2, '0')}:${String(data.settings.wakeMinute).padStart(2, '0')} 路 鐐瑰嚮閲嶆柊璁剧疆`} onPress={setAlarm} />
        <SettingRow icon={{ ios: 'brain.head.profile.fill', android: 'psychology' }} title="AI 娣卞害鎬濊€? subtitle="澶嶆潅琛ㄨ揪浼氬涓€姝ユ牳瀵癸紝骞舵樉绀哄鐞嗘憳瑕? right={<Switch value={data.settings.aiThinking} onValueChange={(value) => updateSettings({ aiThinking: value })} trackColor={{ true: theme.primary }} />} last />
      </Card>
      <SectionTitle title="鏄剧ず妯″紡" />
      <View style={[styles.themeRow, { backgroundColor: theme.surfaceAlt }]}>
        {([['system', '璺熼殢绯荤粺'], ['light', '娴呰壊'], ['dark', '娣辫壊'], ['eye', '鎶ょ溂']] as [ThemeMode, string][]).map(([value, label]) => (
          <MotionPressable key={value} onPress={() => updateSettings({ themeMode: value })} style={[styles.themeItem, data.settings.themeMode === value && styles.themeActive, data.settings.themeMode === value && { backgroundColor: theme.surface, shadowColor: theme.shadow }]}><Text style={[styles.themeText, { color: data.settings.themeMode === value ? theme.primary : theme.secondary }]}>{label}</Text></MotionPressable>
        ))}
      </View>
      <SectionTitle title="鐣岄潰璐ㄦ劅" />
      <View style={[styles.visualRow, { backgroundColor: theme.surfaceAlt }]}>
        {([['glass', '娑叉€佺幓鐠?], ['native', '缁忓吀鍘熺敓']] as [VisualMode, string][]).map(([value, label]) => (
          <MotionPressable key={value} onPress={() => updateSettings({ visualMode: value })} style={[styles.visualItem, data.settings.visualMode === value && styles.themeActive, data.settings.visualMode === value && { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
            <AppIcon ios={value === 'glass' ? 'drop.fill' : 'rectangle.inset.filled'} android={value === 'glass' ? 'blur_on' : 'view_agenda'} color={data.settings.visualMode === value ? theme.primary : theme.secondary} size={18} />
            <Text style={[styles.themeText, { color: data.settings.visualMode === value ? theme.primary : theme.secondary }]}>{label}</Text>
          </MotionPressable>
        ))}
      </View>
      <Text style={[styles.visualNote, { color: theme.secondary }]}>{nativeGlass && !reduceTransparency ? '褰撳墠璁惧鏀寔 iOS 鍘熺敓 Liquid Glass銆? : Platform.OS === 'ios' && reduceTransparency ? '宸茶窡闅忕郴缁熲€滈檷浣庨€忔槑搴︹€濊缃紝鏀圭敤鏇存竻鏅扮殑涓嶉€忔槑鏉愯川銆? : Platform.OS === 'ios' ? '褰撳墠璁惧鏄剧ず鍏煎鏉愯川锛涘師鐢熸晥鏋滈渶瑕?iOS 26 鍙婄郴缁?API 鏀寔銆? : 'Android 浣跨敤楂樺姣旂幓鐠冩ā鎷熸潗璐紱鑻规灉鍘熺敓 Liquid Glass 浠呭湪鍏煎鐨?iPhone 涓婂彲鐢ㄣ€?}</Text>
      <SectionTitle title="鏁版嵁涓庡悓姝? />
      <Card style={styles.listCard}>
        <SettingRow icon={{ ios: 'building.columns.fill', android: 'school' }} title="婀樻江澶у鏁欏姟" subtitle="缃戦〉鐧诲綍鍚庡鍏ヨ琛ㄤ笌鎴愮哗" onPress={() => router.push('/school')} />
        <SettingRow icon={{ ios: 'cloud.fill', android: 'cloud' }} title="iCloud / 鏃ュ巻" subtitle="鐢?iOS 绯荤粺璐熻矗璺ㄨ澶囧悓姝? onPress={() => router.push('/schedule')} />
        <SettingRow icon={{ ios: 'lock.shield.fill', android: 'lock' }} title="涓汉 AI 瀵嗛挜" subtitle="浣跨敤绯荤粺瀹夊叏鍖哄姞瀵嗕繚瀛? onPress={() => router.push('/ai-settings')} last />
      </Card>
      <Text style={[styles.version, { color: theme.secondary }]}>CampusFlow 1.0.0 路 涓鸿嚜宸辩殑鏍″洯鐢熸椿鑰屽仛</Text>
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
