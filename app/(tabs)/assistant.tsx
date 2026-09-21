import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInRight, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { gentleLayout, MotionPressable } from '@/components/motion';
import { GlassBackdrop, Pill, Screen } from '@/components/ui';
import { hasAIKey } from '@/src/ai-config';
import { parseAssistantInput, parseLocally } from '@/src/assistant';
import { formatCurrency, formatDateTime } from '@/src/date';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_CONTENT_GAP } from '@/src/layout';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import type { AssistantCommand } from '@/src/types';

type Message = { id: string; role: 'assistant' | 'user'; text: string; detail?: string; processSummary?: string[] };

const examples = ['午饭花了 25 元', '明天下午 3 点图书馆复习两小时', '下周五交高数作业'];
const loadingStages = ['理解你的表达…', '核对时间与课程…', '准备写入对应页面…'];

export default function AssistantScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const app = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([
    { id: 'hello', role: 'assistant', text: '想记什么，直接告诉我', detail: '我能理解日程、待办、作业和消费，也能从照片里识别作业。' },
  ]);
  const dockClearance = keyboardVisible
    ? 8
    : Math.max(insets.bottom, 8) + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_CONTENT_GAP;

  useEffect(() => {
    hasAIKey().then(setAiReady).catch(() => undefined);
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }
    const timer = setInterval(() => setLoadingStage((value) => (value + 1) % loadingStages.length), 900);
    return () => clearInterval(timer);
  }, [loading]);

  const commit = (command: AssistantCommand) => {
    if (command.type === 'expense') {
      app.addExpense({ amount: command.amount, category: command.category, note: command.note, occurredAt: command.occurredAt });
      return `已记账 ${formatCurrency(command.amount)} · ${command.category}`;
    }
    if (command.type === 'task') {
      const courseId = app.data.courses.find((course) => command.courseName && command.courseName.includes(course.name))?.id;
      app.addTask({ title: command.title, dueAt: command.dueAt, courseId, completed: false, source: 'ai' });
      return `已添加待办 · ${formatDateTime(command.dueAt)}`;
    }
    if (command.type === 'event') {
      app.addEvent({ title: command.title, startAt: command.startAt, endAt: command.endAt, note: command.note, kind: 'study' });
      return `已加入日程 · ${formatDateTime(command.startAt)}`;
    }
    app.replaceCourses(command.courses);
    return `已导入 ${command.courses.length} 门课程`;
  };

  const submit = async (content = text, imageBase64?: string) => {
    if (!content.trim() && !imageBase64) return;
    const userText = imageBase64 ? '📷 请识别这张作业照片' : content.trim();
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text: userText }]);
    setText('');
    setLoading(true);
    try {
      let result;
      try {
        result = await parseAssistantInput(content || '识别图片中的作业与截止时间', imageBase64, app.data.settings.aiThinking);
      } catch (error) {
        if (imageBase64) throw error;
        result = { commands: parseLocally(content), usedAI: false, processSummary: ['识别事项类型', '提取时间信息', '完成本地写入'] };
      }
      const summaries = result.commands.map(commit);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessages((current) => [...current, {
        id: `a-${Date.now()}`, role: 'assistant', text: summaries.join('\n'),
        detail: result.usedAI ? '由 AI 识别并已写入，你可以在对应页面查看。' : '已用离线语义规则写入；配置 AI 服务后可理解更复杂的表达。',
        processSummary: result.processSummary.length ? result.processSummary : ['识别事项', '核对时间', '完成写入'],
      }]);
    } catch (error) {
      setMessages((current) => [...current, { id: `e-${Date.now()}`, role: 'assistant', text: '这次没有识别成功', detail: error instanceof Error ? error.message : '请换种说法再试一次。' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const pickHomework = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0].base64) submit('识别图片中的作业、考试或截止时间', result.assets[0].base64);
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={[styles.fill, { paddingBottom: dockClearance }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <View><Text style={[styles.kicker, { color: theme.primary }]}>CAMPUS AI</Text><Text style={[styles.title, { color: theme.text }]}>一句话，记下来</Text></View>
          <MotionPressable onPress={() => router.push('/ai-settings')} style={[styles.online, { backgroundColor: theme.primarySoft }]}><View style={[styles.onlineDot, { backgroundColor: aiReady ? theme.green : theme.orange }]} /><Text style={[styles.onlineText, { color: theme.primary }]}>{aiReady ? 'DeepSeek' : '配置 AI'}</Text></MotionPressable>
        </View>
        <ScrollView ref={scrollRef} style={styles.messageList} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((message) => (
            <Animated.View
              key={message.id}
              entering={(message.role === 'user' ? FadeInRight : FadeInLeft).duration(190).reduceMotion(ReduceMotion.System)}
              layout={gentleLayout}
              style={[styles.messageWrap, message.role === 'user' && styles.userWrap]}
            >
              {message.role === 'assistant' ? <Animated.View entering={FadeIn.delay(100).reduceMotion(ReduceMotion.System)} style={[styles.botAvatar, { backgroundColor: theme.primary }]}><AppIcon ios="sparkles" android="auto_awesome" color="#FFFFFF" size={15} fallback="✦" /></Animated.View> : null}
              <View style={[styles.bubble, message.role === 'user' ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface }, message.role === 'user' && styles.userBubble]}>
                <Text style={[styles.messageText, { color: message.role === 'user' ? '#FFFFFF' : theme.text }]}>{message.text}</Text>
                {message.detail ? <Text style={[styles.detail, { color: message.role === 'user' ? '#EEEEFF' : theme.secondary }]}>{message.detail}</Text> : null}
                {message.processSummary?.length ? (
                  <View style={styles.processArea}>
                    <MotionPressable onPress={() => setExpanded((current) => ({ ...current, [message.id]: !current[message.id] }))} style={styles.processButton}>
                      <AppIcon ios="brain.head.profile" android="psychology" color={theme.primary} size={15} />
                      <Text style={[styles.processButtonText, { color: theme.primary }]}>{expanded[message.id] ? '收起处理过程' : '查看处理过程'}</Text>
                      <AppIcon ios={expanded[message.id] ? 'chevron.up' : 'chevron.down'} android={expanded[message.id] ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} color={theme.primary} size={14} />
                    </MotionPressable>
                    {expanded[message.id] ? (
                      <Animated.View entering={FadeIn.duration(150).reduceMotion(ReduceMotion.System)} style={[styles.processList, { borderColor: theme.line, backgroundColor: theme.surfaceAlt }]}>
                        {message.processSummary.map((step, index) => <View key={`${message.id}-${index}`} style={styles.processStep}><View style={[styles.processDot, { backgroundColor: theme.primary }]} /><Text style={[styles.processText, { color: theme.secondary }]}>{step}</Text></View>)}
                        <Text style={[styles.processNote, { color: theme.secondary }]}>这是可核对的结果摘要，不展示模型内部草稿。</Text>
                      </Animated.View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </Animated.View>
          ))}
          {loading ? <Animated.View entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)} style={styles.loadingRow}><ActivityIndicator color={theme.primary} /><Text style={[styles.loadingText, { color: theme.secondary }]}>{app.data.settings.aiThinking ? loadingStages[loadingStage] : '正在理解并整理…'}</Text></Animated.View> : null}
        </ScrollView>
        <View style={styles.composerDock}>
          <View style={styles.examples}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
              {examples.map((example) => <MotionPressable key={example} onPress={() => setText(example)} pressedScale={0.94} style={{ marginRight: 8 }}><Pill tone="neutral">{example}</Pill></MotionPressable>)}
            </ScrollView>
          </View>
          <View style={[styles.composer, { backgroundColor: 'transparent', borderColor: `${theme.line}99` }]}>
            <GlassBackdrop interactive radius={29} />
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => submit()}
              placeholder="和 Campus AI 说说…"
              placeholderTextColor={theme.secondary}
              style={[styles.input, { color: theme.text }]}
              multiline
            />
            <View style={styles.composerTools}>
              <MotionPressable accessibilityLabel="选择作业照片" onPress={pickHomework} style={styles.photoButton}><AppIcon ios="plus" android="add" color={theme.text} size={27} /></MotionPressable>
              <View style={styles.composerRight}>
                <Text style={[styles.modelLabel, { color: theme.secondary }]}>{aiReady ? 'DeepSeek' : '离线快记'}{app.data.settings.aiThinking && aiReady ? ' · 思考' : ''}</Text>
                <MotionPressable accessibilityLabel="发送" disabled={loading || !text.trim()} onPress={() => submit()} pressedScale={0.9} style={[styles.send, { backgroundColor: text.trim() ? theme.primary : theme.secondary, opacity: text.trim() ? 1 : 0.7 }]}><AppIcon ios="arrow.up" android="arrow_upward" color="#FFFFFF" size={19} /></MotionPressable>
              </View>
            </View>
          </View>
          <Text style={[styles.disclaimer, { color: theme.secondary }]}>AI 可能会理解错时间，请在重要考试前核对一次。</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 18 }, header: { paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', marginBottom: 5 }, title: { fontSize: 32, fontWeight: '800', letterSpacing: -1.05 },
  online: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99 }, onlineDot: { width: 7, height: 7, borderRadius: 4 }, onlineText: { fontSize: 11, fontWeight: '800' },
  messageList: { flex: 1 }, messages: { flexGrow: 1, paddingTop: 12, paddingBottom: 20, gap: 16 }, messageWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, maxWidth: '92%' }, userWrap: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  botAvatar: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bubble: { borderRadius: 22, borderTopLeftRadius: 8, paddingHorizontal: 16, paddingVertical: 13, maxWidth: '88%' }, userBubble: { borderTopLeftRadius: 22, borderTopRightRadius: 8 },
  messageText: { fontSize: 15, lineHeight: 22, fontWeight: '500' }, detail: { fontSize: 12, lineHeight: 18, marginTop: 5 }, loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginLeft: 42 }, loadingText: { fontSize: 13 },
  processArea: { marginTop: 9 }, processButton: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 5 }, processButtonText: { fontSize: 11.5, fontWeight: '700' }, processList: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, padding: 10, gap: 7, marginTop: 4 }, processStep: { flexDirection: 'row', alignItems: 'center', gap: 7 }, processDot: { width: 5, height: 5, borderRadius: 3 }, processText: { flex: 1, fontSize: 11.5, lineHeight: 16 }, processNote: { fontSize: 9.5, lineHeight: 14, marginTop: 2 },
  composerDock: { zIndex: 20 }, examples: { paddingVertical: 9 }, composer: { minHeight: 106, borderWidth: StyleSheet.hairlineWidth, borderRadius: 29, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 9, overflow: 'hidden', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 19, elevation: 5 },
  composerTools: { minHeight: 41, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, composerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 }, modelLabel: { fontSize: 12, fontWeight: '600' },
  photoButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 42, maxHeight: 110, fontSize: 16, paddingTop: 6, paddingBottom: 6, textAlignVertical: 'top' }, send: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: 10, textAlign: 'center', paddingVertical: 7 },
});
