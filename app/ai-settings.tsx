import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, PrimaryButton, Screen } from '@/components/ui';
import { clearAIConfig, DEFAULT_DEEPSEEK_MODEL, getAIConfig, saveAIConfig } from '@/src/ai-config';
import { useAppTheme } from '@/src/theme';

export default function AISettingsScreen() {
  const theme = useAppTheme();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_DEEPSEEK_MODEL);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAIConfig().then((config) => {
      setSaved(Boolean(config.apiKey));
      setModel(config.model);
    }).catch(() => undefined);
  }, []);

  const save = async () => {
    if (!apiKey.trim() && !saved) return Alert.alert('还没有填写 API Key', '请粘贴 DeepSeek API Key。');
    setBusy(true);
    try {
      const previous = await getAIConfig();
      const key = apiKey.trim() || previous.apiKey;
      const response = await fetch('https://api.deepseek.com/models', { headers: { Authorization: `Bearer ${key}` } });
      if (!response.ok) throw new Error(`密钥验证失败（${response.status}）`);
      await saveAIConfig({ apiKey: key, model });
      setApiKey('');
      setSaved(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('AI 已连接', '密钥已写入系统安全存储，不会进入源码、日志或普通 App 数据。');
    } catch (error) {
      Alert.alert('无法连接 DeepSeek', error instanceof Error ? error.message : '请检查网络和密钥');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => Alert.alert('移除 API Key？', '移除后 AI 记会自动退回本地语义规则。', [
    { text: '取消', style: 'cancel' },
    { text: '移除', style: 'destructive', onPress: async () => { await clearAIConfig(); setSaved(false); setApiKey(''); } },
  ]);

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>个人 AI</Text>
      <Text style={[styles.subtitle, { color: theme.secondary }]}>文字和图片识别先统一走 DeepSeek，避免维护多套密钥。你的 Key 只从本机通过 HTTPS 发送给 DeepSeek。</Text>
      <Card style={styles.card}>
        <View style={styles.statusRow}><View style={[styles.dot, { backgroundColor: saved ? theme.green : theme.secondary }]} /><Text style={[styles.status, { color: theme.text }]}>{saved ? '已安全保存' : '尚未配置'}</Text></View>
        <Field label="DeepSeek API Key" value={apiKey} onChangeText={setApiKey} placeholder={saved ? '已保存；留空则不更换' : 'sk-…'} secureTextEntry />
        <Field label="模型" value={model} onChangeText={setModel} placeholder={DEFAULT_DEEPSEEK_MODEL} />
        <PrimaryButton label={busy ? '正在验证…' : '验证并安全保存'} disabled={busy} onPress={save} />
        {saved ? <PrimaryButton label="移除密钥" secondary onPress={remove} /> : null}
      </Card>
      <Card style={[styles.note, { backgroundColor: theme.primarySoft }]}>
        <Text style={[styles.noteTitle, { color: theme.text }]}>模型安排</Text>
        <Text style={[styles.noteBody, { color: theme.secondary }]}>• 对话与图片：DeepSeek {DEFAULT_DEEPSEEK_MODEL}{'\n'}• 语音：下一步接 Qwen Audio ASR 流式识别，中文和湘语更合适。{Platform.OS === 'web' ? '\n• 网页预览仅保存在当前内存，真机才使用系统安全区。' : ''}</Text>
      </Card>
      <Text style={[styles.security, { color: theme.secondary }]}>提示：个人直连适合你自己使用。以后若公开发布，应该改成由你控制的后端代理，并给每位用户做配额和风控。</Text>
    </Screen>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const theme = useAppTheme();
  return <View style={styles.field}><Text style={[styles.label, { color: theme.secondary }]}>{label}</Text><TextInput {...props} autoCapitalize="none" autoCorrect={false} placeholderTextColor={theme.secondary} style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt }]} /></View>;
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginTop: 8 },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  card: { gap: 14 }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 }, status: { fontSize: 14, fontWeight: '700' },
  field: { gap: 7 }, label: { fontSize: 12, fontWeight: '700', marginLeft: 3 },
  input: { height: 50, borderRadius: 16, paddingHorizontal: 14, fontSize: 15 },
  note: { marginTop: 16 }, noteTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 }, noteBody: { fontSize: 12.5, lineHeight: 21 },
  security: { fontSize: 11, lineHeight: 17, marginTop: 14, paddingHorizontal: 4 },
});
