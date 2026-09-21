import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const examples = ['鍗堥キ鑺变簡 25 鍏?, '鏄庡ぉ涓嬪崍 3 鐐瑰浘涔﹂澶嶄範涓ゅ皬鏃?, '涓嬪懆浜斾氦楂樻暟浣滀笟'];
const loadingStages = ['鐞嗚В浣犵殑琛ㄨ揪鈥?, '鏍稿鏃堕棿涓庤绋嬧€?, '鍑嗗鍐欏叆瀵瑰簲椤甸潰鈥?];

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
    { id: 'hello', role: 'assistant', text: '鎯宠浠€涔堬紝鐩存帴鍛婅瘔鎴?, detail: '鎴戣兘鐞嗚В鏃ョ▼銆佸緟鍔炪€佷綔涓氬拰娑堣垂锛屼篃鑳戒粠鐓х墖閲岃瘑鍒綔涓氥€? },
  ]);
  const assistantContext = useMemo(() => ({
    courses: app.data.courses.map(({ name, weekday, startTime, endTime }) => ({ name, weekday, startTime, endTime })),
    tasks: app.data.tasks.map(({ title, dueAt, completed }) => ({ title, dueAt, completed })),
  }), [app.data.courses, app.data.tasks]);
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
      return `宸茶璐?${formatCurrency(command.amount)} 路 ${command.category}`;
    }
    if (command.type === 'task') {
      const courseId = app.data.courses.find((course) => command.courseName && command.courseName.includes(course.name))?.id;
      app.addTask({ title: command.title, dueAt: command.dueAt, courseId, completed: false, source: 'ai' });
      return `宸叉坊鍔犲緟鍔?路 ${formatDateTime(command.dueAt)}`;
    }
    if (command.type === 'event') {
      app.addEvent({ title: command.title, startAt: command.startAt, endAt: command.endAt, note: command.note, kind: 'study' });
      return `宸插姞鍏ユ棩绋?路 ${formatDateTime(command.startAt)}`;
    }
    app.replaceCourses(command.courses);
    return `宸插鍏?${command.courses.length} 闂ㄨ绋媊;
  };

  const submit = async (content = text, imageBase64?: string) => {
    if (!content.trim() && !imageBase64) return;
    const userText = imageBase64 ? '馃摲 璇疯瘑鍒繖寮犱綔涓氱収鐗? : content.trim();
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text: userText }]);
    setText('');
    setLoading(true);
    try {
      let result;
      try {
        result = await parseAssistantInput(content || '璇嗗埆鍥剧墖涓殑浣滀笟涓庢埅姝㈡椂闂?, imageBase64, app.data.settings.aiThinking, assistantContext);
      } catch (error) {
        if (imageBase64) throw error;
        result = { commands: parseLocally(content), usedAI: false, processSummary: ['璇嗗埆浜嬮」绫诲瀷', '鎻愬彇鏃堕棿淇℃伅', '瀹屾垚鏈湴鍐欏叆'] };
      }
      const summaries = result.commands.map(commit);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessages((current) => [...current, {
        id: `a-${Date.now()}`, role: 'assistant', text: summaries.join('\n'),
        detail: result.usedAI ? '鐢?AI 璇嗗埆骞跺凡鍐欏叆锛屼綘鍙互鍦ㄥ搴旈〉闈㈡煡鐪嬨€? : '宸茬敤绂荤嚎璇箟瑙勫垯鍐欏叆锛涢厤缃?AI 鏈嶅姟鍚庡彲鐞嗚В鏇村鏉傜殑琛ㄨ揪銆?,
        processSummary: result.processSummary.length ? result.processSummary : ['璇嗗埆浜嬮」', '鏍稿鏃堕棿', '瀹屾垚鍐欏叆'],
      }]);
    } catch (error) {
      setMessages((current) => [...current, { id: `e-${Date.now()}`, role: 'assistant', text: '杩欐娌℃湁璇嗗埆鎴愬姛', detail: error instanceof Error ? error.message : '璇锋崲绉嶈娉曞啀璇曚竴娆°€? }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const pickHomework = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0].base64) submit('璇嗗埆鍥剧墖涓殑浣滀笟銆佽€冭瘯鎴栨埅姝㈡椂闂?, result.assets[0].base64);
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={[styles.fill, { paddingBottom: dockClearance }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <View><Text style={[styles.kicker, { color: theme.primary }]}>CAMPUS AI</Text><Text style={[styles.title, { color: theme.text }]}>涓€鍙ヨ瘽锛岃涓嬫潵</Text></View>
          <MotionPressable onPress={() => router.push('/ai-settings')} style={[styles.online, { backgroundColor: theme.primarySoft }]}><View style={[styles.onlineDot, { backgroundColor: aiReady ? theme.green : theme.orange }]} /><Text style={[styles.onlineText, { color: theme.primary }]}>{aiReady ? 'DeepSeek' : '閰嶇疆 AI'}</Text></MotionPressable>
        </View>
        <ScrollView ref={scrollRef} style={styles.messageList} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((message) => (
            <Animated.View
              key={message.id}
              entering={(message.role === 'user' ? FadeInRight : FadeInLeft).duration(190).reduceMotion(ReduceMotion.System)}
              layout={gentleLayout}
              style={[styles.messageWrap, message.role === 'user' && styles.userWrap]}
            >
              {message.role === 'assistant' ? <Animated.View entering={FadeIn.delay(100).reduceMotion(ReduceMotion.System)} style={[styles.botAvatar, { backgroundColor: theme.primary }]}><AppIcon ios="sparkles" android="auto_awesome" color="#FFFFFF" size={15} fallback="鉁? /></Animated.View> : null}
              <View style={[styles.bubble, message.role === 'user' ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface }, message.role === 'user' && styles.userBubble]}>
                <Text style={[styles.messageText, { color: message.role === 'user' ? '#FFFFFF' : theme.text }]}>{message.text}</Text>
                {message.detail ? <Text style={[styles.detail, { color: message.role === 'user' ? '#EEEEFF' : theme.secondary }]}>{message.detail}</Text> : null}
                {message.processSummary?.length ? (
                  <View style={styles.processArea}>
                    <MotionPressable onPress={() => setExpanded((current) => ({ ...current, [message.id]: !current[message.id] }))} style={styles.processButton}>
                      <AppIcon ios="brain.head.profile" android="psychology" color={theme.primary} size={15} />
                      <Text style={[styles.processButtonText, { color: theme.primary }]}>{expanded[message.id] ? '鏀惰捣澶勭悊杩囩▼' : '鏌ョ湅澶勭悊杩囩▼'}</Text>
                      <AppIcon ios={expanded[message.id] ? 'chevron.up' : 'chevron.down'} android={expanded[message.id] ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} color={theme.primary} size={14} />
                    </MotionPressable>
                    {expanded[message.id] ? (
                      <Animated.View entering={FadeIn.duration(150).reduceMotion(ReduceMotion.System)} style={[styles.processList, { borderColor: theme.line, backgroundColor: theme.surfaceAlt }]}>
                        {message.processSummary.map((step, index) => <View key={`${message.id}-${index}`} style={styles.processStep}><View style={[styles.processDot, { backgroundColor: theme.primary }]} /><Text style={[styles.processText, { color: theme.secondary }]}>{step}</Text></View>)}
                        <Text style={[styles.processNote, { color: theme.secondary }]}>杩欐槸鍙牳瀵圭殑缁撴灉鎽樿锛屼笉灞曠ず妯″瀷鍐呴儴鑽夌銆?/Text>
                      </Animated.View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </Animated.View>
          ))}
          {loading ? <Animated.View entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)} style={styles.loadingRow}><ActivityIndicator color={theme.primary} /><Text style={[styles.loadingText, { color: theme.secondary }]}>{app.data.settings.aiThinking ? loadingStages[loadingStage] : '姝ｅ湪鐞嗚В骞舵暣鐞嗏€?}</Text></Animated.View> : null}
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
              placeholder="鍜?Campus AI 璇磋鈥?
              placeholderTextColor={theme.secondary}
              style={[styles.input, { color: theme.text }]}
              multiline
            />
            <View style={styles.composerTools}>
              <MotionPressable accessibilityLabel="閫夋嫨浣滀笟鐓х墖" onPress={pickHomework} style={styles.photoButton}><AppIcon ios="plus" android="add" color={theme.text} size={27} /></MotionPressable>
              <View style={styles.composerRight}>
                <Text style={[styles.modelLabel, { color: theme.secondary }]}>{aiReady ? 'DeepSeek' : '绂荤嚎蹇'}{app.data.settings.aiThinking && aiReady ? ' 路 鎬濊€? : ''}</Text>
                <MotionPressable accessibilityLabel="鍙戦€? disabled={loading || !text.trim()} onPress={() => submit()} pressedScale={0.9} style={[styles.send, { backgroundColor: text.trim() ? theme.primary : theme.secondary, opacity: text.trim() ? 1 : 0.7 }]}><AppIcon ios="arrow.up" android="arrow_upward" color="#FFFFFF" size={19} /></MotionPressable>
              </View>
            </View>
          </View>
          <Text style={[styles.disclaimer, { color: theme.secondary }]}>AI 鍙兘浼氱悊瑙ｉ敊鏃堕棿锛岃鍦ㄩ噸瑕佽€冭瘯鍓嶆牳瀵逛竴娆°€?/Text>
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
