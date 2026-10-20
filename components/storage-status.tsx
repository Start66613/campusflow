import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotionPressable } from './motion';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export function StorageStatus({ blocking = false }: { blocking?: boolean }) {
  const app = useApp();
  const theme = useAppTheme();
  const [busy, setBusy] = useState(false);
  const message = app.hydrationError ?? app.persistenceError;
  if (!blocking && !message && !app.restoring) return null;
  const content = <View style={[s.box, { backgroundColor: theme.surface }]}>
    {busy || (!message && blocking) || app.restoring ? <ActivityIndicator color={theme.primary} /> : null}
    <Text style={[s.title, { color: theme.text }]}>{app.restoring ? '正在恢复你的记录' : message ? '记录需要处理一下' : '正在读取你的记录'}</Text>
    {message ? <Text accessibilityRole="alert" style={[s.body, { color: theme.secondary }]}>{message}</Text> : null}
    {message ? <MotionPressable disabled={busy} onPress={async () => { setBusy(true); try { await app.retryStorage(); } finally { setBusy(false); } }} style={[s.button, { backgroundColor: theme.primarySoft }]}><Text style={{ color: theme.primary, fontWeight: '600' }}>{busy ? '正在重试' : '重试'}</Text></MotionPressable> : null}
  </View>;
  return blocking ? <SafeAreaView style={[s.blocking, { backgroundColor: theme.background }]}>{content}</SafeAreaView> : <SafeAreaView edges={['top']} pointerEvents="box-none" style={s.banner}>{content}</SafeAreaView>;
}
const s = StyleSheet.create({
  blocking: { flex: 1, justifyContent: 'center', padding: 24 }, box: { borderRadius: 22, padding: 20, gap: 12 },
  title: { fontSize: 17, fontWeight: '600' }, body: { fontSize: 14, lineHeight: 21 },
  button: { padding: 13, borderRadius: 13, alignItems: 'center' }, banner: { position: 'absolute', top: 0, left: 14, right: 14, zIndex: 100 },
});
