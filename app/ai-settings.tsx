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
    if (!apiKey.trim() && !saved) return Alert.alert('还没有填写 API Key', '请先填写 DeepSeek API Key。');
    setBusy(true);
    try {
      const previous = await getAIConfig();
      const key = apiKey.trim() || previous.apiKey;
      if (key) {
        const response = await fetch('https://api.deepseek.com/models', { headers: { Authorization: `Bearer ${key}` } });
        if (!response.ok) throw new Error(`DeepSeek 密钥验证失败（${response.status}）`);
      }
      await saveAIConfig({ apiKey: key, model });
      setApiKey('');
      setSaved(Boolean(key));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('AI 配置已保存', '联网问答也使用这把 DeepSeek Key；密钥保存在本机系统安全区，不会进入源码或日志。');
    } catch (error) {
      Alert.alert('无法保存 AI 配置', error instanceof Error ? error.message : '请检查网络和密钥');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => Alert.alert('移除所有 AI Key？', '移除后 AI 记会退回本地规则，联网问答也会关闭。', [
    { text: '取消', style: 'cancel' },
    { text: '移除', style: 'destructive', onPress: async () => { await clearAIConfig(); setSaved(false); setApiKey(''); } },
  ]);

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>个人 AI</Text>
      <Text style={[styles.subtitle, { color: theme.secondary }]}>文字、图片和联网检索均由 DeepSeek 处理，只需配置一把 Key。联网会产生额外模型 token 消耗。</Text>
      <Card style={styles.card}>
        <View style={styles.statusRow}><View style={[styles.dot, { backgroundColor: saved ? theme.green : theme.secondary }]} /><Text style={[styles.status, { color: theme.text }]}>{saved ? '已安全保存' : '尚未配置'}</Text></View>
        <Field label="DeepSeek API Key" value={apiKey} onChangeText={setApiKey} placeholder={saved ? '已保存；留空则不更换' : 'sk-…'} secureTextEntry />
        <Field label="模型" value={model} onChangeText={setModel} placeholder={DEFAULT_DEEPSEEK_MODEL} />
        <PrimaryButton label={busy ? '正在验证…' : '验证 DeepSeek 并保存'} disabled={busy} onPress={save} />
        {saved ? <PrimaryButton label="移除所有密钥" secondary onPress={remove} /> : null}
      </Card>
      <Card style={[styles.note, { backgroundColor: theme.primarySoft }]}>
        <Text style={[styles.noteTitle, { color: theme.text }]}>模型安排</Text>
        <Text style={[styles.noteBody, { color: theme.secondary }]}>• 文字与图片：DeepSeek；图片自动使用支持视觉的 deepseek-flash。{'\n'}• 联网研究：DeepSeek 内置搜索，结果附来源；只有实际搜索成功才展示联网回答。{'\n'}• 语音：后续单独接入 ASR。{Platform.OS === 'web' ? '\n• 网页预览仅保存在当前内存，真机才使用系统安全区。' : ''}</Text>
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
  title: { fontSize: 32, fontWeight: '600', marginTop: 8 },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  card: { gap: 14 }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 }, status: { fontSize: 14, fontWeight: '700' },
  field: { gap: 7 }, label: { fontSize: 12, fontWeight: '700', marginLeft: 3 },
  input: { height: 50, borderRadius: 16, paddingHorizontal: 14, fontSize: 15 },
  note: { marginTop: 16 }, noteTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 }, noteBody: { fontSize: 12.5, lineHeight: 21 },
  security: { fontSize: 11, lineHeight: 17, marginTop: 14, paddingHorizontal: 4 },
});
