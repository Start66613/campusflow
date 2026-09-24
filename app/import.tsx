import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/components/motion';
import { Card, PrimaryButton, Screen } from '@/components/ui';
import { parseTimetableImage } from '@/src/assistant';
import { parseCourseCsv } from '@/src/importer';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import type { Course } from '@/src/types';

export default function ImportScreen() {
  const theme = useAppTheme();
  const app = useApp();
  const [busy, setBusy] = useState(false);

  const acceptCourses = (courses: Course[], source: string) => {
    if (!courses.length) return Alert.alert('没有识别到完整课程', '请检查图片中是否有课程名称、星期、节次和上课周次；原课表未更改。');
    Alert.alert('识别完成', `${source}读取到 ${courses.length} 门课程，是否替换当前课表？手动添加或编辑过的课程也会被替换。`, [
      { text: '取消', style: 'cancel' },
      { text: '导入', onPress: () => { app.replaceCourses(courses); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); } },
    ]);
  };

  const importPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('需要照片权限', '请允许访问相册，以选择教务系统课表截图。');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.85 });
    if (result.canceled || !result.assets[0].base64) return;
    setBusy(true);
    try { acceptCourses(await parseTimetableImage(result.assets[0].base64), 'AI 从截图中'); }
    catch (error) { Alert.alert('截图导入失败', error instanceof Error ? error.message : '请稍后重试'); }
    finally { setBusy(false); }
  };

  const importCsv = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain'], copyToCacheDirectory: true });
    if (result.canceled) return;
    setBusy(true);
    try {
      const text = await (await fetch(result.assets[0].uri)).text();
      acceptCourses(parseCourseCsv(text), 'CSV 文件中');
    } catch (error) { Alert.alert('文件无法导入', error instanceof Error ? error.message : '请检查 CSV 格式'); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>把课表带进 CampusFlow</Text>
      <Text style={[styles.subtitle, { color: theme.secondary }]}>推荐使用截图 AI 识别；学校适配器接好后，可一键同步课表和成绩。</Text>
      <View style={styles.methodRow}>
        <MethodCard emoji="✨" title="AI 识图" body="选择课表截图" onPress={importPhoto} accent="#E9E9FF" />
        <MethodCard emoji="⇧" title="CSV 文件" body="稳定、可校对" onPress={importCsv} accent="#E1F3EB" />
      </View>
      <Text style={[styles.section, { color: theme.text }]}>连接学校教务系统</Text>
      <Card style={styles.formCard}>
        <Text style={[styles.schoolTitle, { color: theme.text }]}>湘潭大学 · 正方新教务</Text>
        <Text style={[styles.privacy, { color: theme.secondary }]}>在内置学校网页里亲自登录，然后打开课表或成绩页面一键导入。CampusFlow 不读取、不保存你的教务密码。</Text>
        <PrimaryButton label="打开教务系统" onPress={() => router.push('/school')} />
      </Card>
      <Card style={[styles.template, { backgroundColor: theme.primarySoft }]}>
        <Text style={[styles.templateTitle, { color: theme.text }]}>CSV 表头模板</Text>
        <Text selectable style={[styles.templateCode, { color: theme.secondary }]}>课程,老师,教室,星期,开始节次,结束节次,开始时间,结束时间,周次,类型</Text>
      </Card>
    </Screen>
  );
}

function MethodCard({ emoji, title, body, onPress, accent }: { emoji: string; title: string; body: string; onPress: () => void; accent: string }) {
  const theme = useAppTheme();
  return <MotionPressable onPress={onPress} pressedScale={0.97} style={[styles.method, { backgroundColor: theme.surface, borderColor: theme.line, shadowColor: theme.shadow }]}><View style={[styles.methodIcon, { backgroundColor: accent }]}><Text style={styles.methodEmoji}>{emoji}</Text></View><Text style={[styles.methodTitle, { color: theme.text }]}>{title}</Text><Text style={[styles.methodBody, { color: theme.secondary }]}>{body}</Text></MotionPressable>;
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.9, marginTop: 8 }, subtitle: { fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  methodRow: { flexDirection: 'row', gap: 12 }, method: { flex: 1, borderRadius: 23, padding: 16, borderWidth: StyleSheet.hairlineWidth, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 1 }, methodIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, methodEmoji: { fontSize: 20 }, methodTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 }, methodBody: { fontSize: 12 },
  section: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, marginTop: 28, marginBottom: 12 }, formCard: { gap: 14 }, schoolTitle: { fontSize: 16, fontWeight: '800' }, privacy: { fontSize: 11, lineHeight: 17 },
  template: { marginTop: 16 }, templateTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 }, templateCode: { fontSize: 11, lineHeight: 17 },
});
