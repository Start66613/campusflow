import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { motion, MotionPressable } from '@/components/motion';
import { GlassBackdrop, Pill, Screen } from '@/components/ui';
import { hasAIKey } from '@/src/ai-config';
import { parseAssistantInput, parseLocally } from '@/src/assistant';
import { describeHabit, habitIdentity, parseLocalHabit } from '@/src/daily-ai';
import { formatCurrency, formatDateTime, weekdays } from '@/src/date';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_CONTENT_GAP } from '@/src/layout';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import { jiahaoCopy } from '@/src/jiahao';
import { jiahaoIcons } from '@/src/jiahao-icons';
import type { AssistantCommand, CreatedRecord } from '@/src/types';
import { answerWebQuestion, type WebSource } from '@/src/web-search';

type Message = { id: string; role: 'assistant' | 'user'; text: string; detail?: string; processSummary?: string[]; sources?: WebSource[] };
type PendingWrite = { commands: AssistantCommand[]; processSummary: string[]; usedAI: boolean };
type UndoWrite = { messageId: string; records: CreatedRecord[] };

function describeCommand(command: AssistantCommand) {
  if (command.type === 'expense') return `消费 ${formatCurrency(command.amount)} · ${command.category} · ${command.note || '无备注'}`;
  if (command.type === 'task') return `待办 ${command.title} · ${formatDateTime(command.dueAt)}`;
  if (command.type === 'event') return `日程 ${command.title} · ${formatDateTime(command.startAt)}`;
  if (command.type === 'habit') return describeHabit(command.habit);
  return command.courses.map((course) => `课程 ${course.name} · ${weekdays[course.weekday - 1] ?? '星期待确认'} 第 ${course.startPeriod}—${course.endPeriod} 节 · ${course.weeks.length} 周`).join('\n');
}

const examples = ['每天阅读20分钟', '每周一三五跑步', '午饭花了 25 元', '明天下午 3 点图书馆复习两小时', '下周五交高数作业', '加一门周三 5-6 节实验课'];
const loadingStages = ['理解你的表达…', '核对时间与课程…', '准备写入对应页面…'];
const jiahaoLoadingStages = ['嘉豪正在读懂你的话…', '嘉豪正在核对时间与课程…', '等你确认后再往里豪…'];

export default function AssistantScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const app = useApp();
  const glass = app.data.settings.visualMode === 'glass';
  const scrollRef = useRef<ScrollView>(null);
  const committingRef = useRef(false);
  const submittingRef = useRef(false);
  const createdHabitsRef = useRef(new Set<string>());
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [webMode, setWebMode] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<PendingWrite | null>(null);
  const [undoWrite, setUndoWrite] = useState<UndoWrite | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'hello', role: 'assistant', text: '想记什么，直接告诉我', detail: '日程、待办、消费和重复习惯都可以说；图片也能识别课程与作业。核对后再写入。' },
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
    setMessages((current) => current.map((message) => message.id === 'hello'
      ? { ...message, text: app.data.settings.jiahaoMode ? '全体嘉豪，往里豪。想记什么？' : '想记什么，直接告诉我', detail: app.data.settings.jiahaoMode ? '作业、课表、消费、日程和习惯都能豪记；写入前你先确认。' : '日程、待办、消费和重复习惯都可以说；图片也能识别课程与作业。核对后再写入。' }
      : message));
  }, [app.data.settings.jiahaoMode]);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }
    const timer = setInterval(() => setLoadingStage((value) => (value + 1) % loadingStages.length), 900);
    return () => clearInterval(timer);
  }, [loading]);

  const commit = (command: AssistantCommand): { summary: string; records: CreatedRecord[] } => {
    if (command.type === 'expense') {
      const id = app.addExpense({ amount: command.amount, category: command.category, note: command.note, occurredAt: command.occurredAt });
      return { summary: `已记账 ${formatCurrency(command.amount)} · ${command.category}`, records: [{ kind: 'expense', id }] };
    }
    if (command.type === 'task') {
      const courseId = app.data.courses.find((course) => command.courseName && command.courseName.includes(course.name))?.id;
      const id = app.addTask({ title: command.title, dueAt: command.dueAt, courseId, completed: false, source: 'ai' });
      return { summary: `已添加待办 · ${formatDateTime(command.dueAt)}`, records: [{ kind: 'task', id }] };
    }
    if (command.type === 'event') {
      const id = app.addEvent({ title: command.title, startAt: command.startAt, endAt: command.endAt, note: command.note, kind: 'study' });
      return { summary: `已加入日程 · ${formatDateTime(command.startAt)}`, records: [{ kind: 'event', id }] };
    }
    if (command.type === 'habit') {
      const identity = habitIdentity(command.habit);
      if (createdHabitsRef.current.has(identity) || app.data.daily.habits.some((habit) => !habit.archived && habitIdentity(habit) === identity)) {
        return { summary: `「${command.habit.title}」已有相同安排，未重复添加`, records: [] };
      }
      const id = app.saveHabit(command.habit);
      createdHabitsRef.current.add(identity);
      return { summary: `已加入日常 · ${command.habit.title}`, records: [{ kind: 'habit', id }] };
    }
    if (!command.courses.length) return { summary: '课程安排缺少星期、节次或周次，尚未写入课表。', records: [] };
    const ids = app.addCourses(command.courses);
    return { summary: `已尝试添加 ${command.courses.length} 门课程到课表，请核对周次与地点`, records: ids.map((id) => ({ kind: 'course', id })) };
  };

  const confirmPending = async () => {
    if (!pending || committingRef.current) return;
    committingRef.current = true;
    createdHabitsRef.current.clear();
    const results: { summary: string; records: CreatedRecord[] }[] = [];
    try {
    for (const command of pending.commands) results.push(commit(command));
    const messageId = `a-${Date.now()}`;
    setMessages((current) => [...current, {
      id: messageId, role: 'assistant', text: `${app.data.settings.jiahaoMode ? '全体嘉豪，写入成功：\n' : ''}${results.map((item) => item.summary).join('\n')}`,
      detail: app.data.settings.jiahaoMode ? '已按你的确认完成写入；有问题可以立即撤销。' : pending.usedAI ? '已按确认内容写入。' : '已按离线识别结果写入。',
      processSummary: pending.processSummary,
    }]);
    setUndoWrite({ messageId, records: results.flatMap((item) => item.records) });
    setPending(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (error) {
      // Roll back only records from this batch; preserved earlier data never participates.
      app.undoCreated(results.flatMap((result) => result.records));
      createdHabitsRef.current.clear();
      setMessages((current) => [...current, { id: `failed-${Date.now()}`, role: 'assistant', text: '这次没有完成写入', detail: error instanceof Error ? error.message : '请核对内容后重试。' }]);
    } finally { committingRef.current = false; }
  };

  const undoPendingWrite = () => {
    if (!undoWrite) return;
    app.undoCreated(undoWrite.records);
    createdHabitsRef.current.clear();
    setUndoWrite(null);
    setMessages((current) => [...current, { id: `undo-${Date.now()}`, role: 'assistant', text: app.data.settings.jiahaoMode ? '嘉豪已撤回刚才的写入，原始记录没变。' : '已撤销刚才写入的内容。' }]);
  };

  const submit = async (content = text, imageBase64?: string) => {
    if (!content.trim() && !imageBase64) return;
    if (pending || submittingRef.current) return;
    submittingRef.current = true;
    const userText = imageBase64 ? '📷 请识别这张课程或作业图片' : content.trim();
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text: userText }]);
    setText('');
    setLoading(true);
    try {
      if (webMode && !imageBase64) {
        const answer = await answerWebQuestion(content.trim(), Boolean(app.data.settings.jiahaoMode));
        setMessages((current) => [...current, { id: `w-${Date.now()}`, role: 'assistant', text: answer.answer, detail: app.data.settings.jiahaoMode ? '嘉豪联网检索仅供参考，不会自动改动课表或日程。' : '联网问答只提供参考，不会自动写入课表或日程。', sources: answer.sources }]);
        return;
      }
      if (!aiReady && /课程|课表|实验课|上课/.test(content)) throw new Error('添加课程请先在「个人 AI」中配置 DeepSeek，避免离线规则误写。');
      let result;
      try {
        result = await parseAssistantInput(content || '识别图片中的作业与截止时间', imageBase64, app.data.settings.aiThinking, assistantContext, Boolean(app.data.settings.jiahaoMode));
      } catch (error) {
        if (imageBase64 || aiReady) throw error;
        const localHabit = parseLocalHabit(content);
        result = { commands: parseLocally(content), usedAI: false, processSummary: localHabit.recognized && localHabit.message ? [localHabit.message] : app.data.settings.jiahaoMode ? ['嘉豪识别事项', '核对时间信息', '等你确认后写入'] : ['识别事项类型', '提取时间信息', '等待确认写入'] };
      }
      if (result.commands.length === 0) {
        setMessages((current) => [...current, {
          id: `a-${Date.now()}`, role: 'assistant', text: app.data.settings.jiahaoMode ? '这条还不能安全地往里豪' : '还不能安全地写入',
          detail: imageBase64
            ? '图片里没有识别到同时具备星期、节次和周次的课程，或明确的作业截止时间。请补充信息后再试；现有课表未更改。'
            : result.processSummary.join('\n') || '请补充习惯的重复频率、课程周次或事项时间；现有数据未更改。',
          processSummary: result.processSummary,
        }]);
        return;
      }
      setPending({ commands: result.commands, usedAI: result.usedAI, processSummary: result.processSummary.length ? result.processSummary : ['识别事项', '核对时间', '等待确认'] });
    } catch (error) {
      setMessages((current) => [...current, { id: `e-${Date.now()}`, role: 'assistant', text: app.data.settings.jiahaoMode ? '嘉豪这次没识别准' : '这次没有识别成功', detail: error instanceof Error ? error.message : '请换种说法再试一次。' }]);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const pickHomework = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0].base64) submit('识别图片中的课程或实验安排、作业、考试和截止时间；明确的课程请作为 courses 命令加入课表。', result.assets[0].base64);
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={styles.keyboardFrame}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.fill, { paddingBottom: dockClearance }]}>
        <View style={styles.header}>
          <View><Text style={[styles.kicker, { color: theme.primary }]}>{app.data.settings.jiahaoMode ? 'JIAHAO AI' : 'CAMPUS AI'}</Text><Text style={[styles.title, { color: theme.text }]}>{app.data.settings.jiahaoMode ? jiahaoCopy.assistant : '一句话，记下来'}</Text></View>
          <MotionPressable onPress={() => router.push('/ai-settings')} style={[styles.online, { backgroundColor: glass ? 'transparent' : theme.primarySoft }]}>
            {glass ? <GlassBackdrop radius={99} tintColor={theme.primary} tintStrength="soft" readable lightweight /> : null}
            <View style={[styles.onlineDot, { backgroundColor: aiReady ? theme.green : theme.orange }]} />
            <Text style={[styles.onlineText, { color: glass ? theme.text : theme.primary }]}>{aiReady ? 'DeepSeek' : '配置 AI'}</Text>
          </MotionPressable>
        </View>
        <ScrollView ref={scrollRef} style={styles.messageList} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((message) => (
            <Animated.View
              key={message.id}
              entering={FadeIn.duration(motion.standard).reduceMotion(ReduceMotion.System)}
              style={[styles.messageWrap, message.role === 'user' && styles.userWrap]}
            >
              {message.role === 'assistant' ? <View style={[styles.botAvatar, { backgroundColor: theme.primary }]}>{app.data.settings.jiahaoMode ? <Image source={jiahaoIcons.assistant} style={styles.botPortrait} /> : <AppIcon ios="sparkles" android="auto_awesome" color="#FFFFFF" size={15} fallback="✦" />}</View> : null}
              <View style={[styles.bubble, message.role === 'user' ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface }, message.role === 'user' && styles.userBubble]}>
                <Text style={[styles.messageText, { color: message.role === 'user' ? '#FFFFFF' : theme.text }]}>{message.text}</Text>
                {message.detail ? <Text style={[styles.detail, { color: message.role === 'user' ? '#EEEEFF' : theme.secondary }]}>{message.detail}</Text> : null}
                {undoWrite?.messageId === message.id ? <MotionPressable onPress={undoPendingWrite} style={[styles.undoButton, { borderColor: theme.primary }]}><Text style={[styles.undoText, { color: theme.primary }]}>撤销刚才的写入</Text></MotionPressable> : null}
                {message.sources?.length ? <View style={styles.sourceList}>{message.sources.map((source, index) => <MotionPressable key={source.url} onPress={() => Linking.openURL(source.url).catch(() => undefined)}><Text style={[styles.sourceLink, { color: theme.primary }]}>[{index + 1}] {source.title}</Text></MotionPressable>)}</View> : null}
                {message.processSummary?.length ? (
                  <View style={styles.processArea}>
                    <MotionPressable onPress={() => setExpanded((current) => ({ ...current, [message.id]: !current[message.id] }))} style={styles.processButton}>
                      {app.data.settings.jiahaoMode ? <Image source={jiahaoIcons.thinking} style={styles.processPortrait} /> : <AppIcon ios="brain.head.profile" android="psychology" color={theme.primary} size={15} />}
                      <Text style={[styles.processButtonText, { color: theme.primary }]}>{expanded[message.id] ? '收起处理过程' : '查看处理过程'}</Text>
                      <AppIcon ios={expanded[message.id] ? 'chevron.up' : 'chevron.down'} android={expanded[message.id] ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} color={theme.primary} size={14} />
                    </MotionPressable>
                    {expanded[message.id] ? (
                      <Animated.View entering={FadeIn.duration(motion.quick).reduceMotion(ReduceMotion.System)} style={[styles.processList, { borderColor: theme.line, backgroundColor: theme.surfaceAlt }]}>
                        {message.processSummary.map((step, index) => <View key={`${message.id}-${index}`} style={styles.processStep}><View style={[styles.processDot, { backgroundColor: theme.primary }]} /><Text style={[styles.processText, { color: theme.secondary }]}>{step}</Text></View>)}
                        <Text style={[styles.processNote, { color: theme.secondary }]}>这是可核对的结果摘要，不展示模型内部草稿。</Text>
                      </Animated.View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </Animated.View>
          ))}
          {pending ? <View style={[styles.preview, { backgroundColor: app.data.settings.visualMode === 'glass' ? 'transparent' : theme.surface }]}>
            {app.data.settings.visualMode === 'glass' ? <GlassBackdrop radius={20} readable /> : null}
            <Text style={[styles.previewTitle, { color: theme.text }]}>{app.data.settings.jiahaoMode ? '嘉豪先核对，确认后再写入' : '确认后才会写入'}</Text>
            <Text style={[styles.previewNote, { color: theme.secondary }]}>请核对金额、日期、习惯目标与重复频率；不对就取消并重新描述。</Text>
            {pending.commands.map((command, index) => <Text key={index} style={[styles.previewItem, { color: theme.text }]}>{describeCommand(command)}</Text>)}
            <View style={styles.previewActions}>
              <MotionPressable onPress={() => setPending(null)} style={[styles.previewCancel, { borderColor: theme.line }]}><Text style={[styles.previewActionText, { color: theme.secondary }]}>取消</Text></MotionPressable>
              <MotionPressable onPress={confirmPending} style={[styles.previewConfirm, { backgroundColor: theme.primary }]}><Text style={[styles.previewActionText, { color: '#FFFFFF' }]}>{app.data.settings.jiahaoMode ? '确认往里豪' : '确认写入'}</Text></MotionPressable>
            </View>
          </View> : null}
          {loading ? <Animated.View entering={FadeIn.duration(motion.quick).reduceMotion(ReduceMotion.System)} style={styles.loadingRow}><ActivityIndicator color={theme.primary} /><Text style={[styles.loadingText, { color: theme.secondary }]}>{webMode ? (app.data.settings.jiahaoMode ? '嘉豪正在查证网页来源…' : '搜索并核对网页来源…') : app.data.settings.aiThinking ? (app.data.settings.jiahaoMode ? jiahaoLoadingStages : loadingStages)[loadingStage] : app.data.settings.jiahaoMode ? '嘉豪正在整理…' : '正在理解并整理…'}</Text></Animated.View> : null}
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
              placeholder={webMode ? '问政策、方向或学习方法…' : app.data.settings.jiahaoMode ? jiahaoCopy.assistantHint : '和 Campus AI 说说…'}
              placeholderTextColor={theme.secondary}
              style={[styles.input, { color: theme.text }]}
              multiline
            />
            <View style={styles.composerTools}>
              <MotionPressable accessibilityLabel="选择课程或作业照片" disabled={loading || Boolean(pending)} onPress={pickHomework} style={styles.photoButton}>{app.data.settings.jiahaoMode ? <Image source={jiahaoIcons.camera} style={styles.toolPortrait} /> : <AppIcon ios="plus" android="add" color={theme.text} size={27} />}</MotionPressable>
              <MotionPressable accessibilityRole="button" accessibilityState={{ selected: webMode }} accessibilityLabel="切换联网问答" onPress={() => setWebMode((value) => !value)} style={[styles.webButton, { backgroundColor: glass ? 'transparent' : webMode ? theme.primarySoft : theme.surfaceAlt }]}>
                {glass ? <GlassBackdrop radius={13} tintColor={webMode ? theme.primary : undefined} tintStrength="soft" readable lightweight /> : null}
                {app.data.settings.jiahaoMode ? <Image source={jiahaoIcons.web} style={styles.webPortrait} /> : <AppIcon ios="globe" android="public" color={webMode ? theme.primary : theme.secondary} size={16} />}
              <Text style={[styles.webLabel, { color: glass ? theme.text : webMode ? theme.primary : theme.secondary }]}>{app.data.settings.jiahaoMode ? '豪查' : '联网'}</Text>
              </MotionPressable>
              <View style={styles.composerRight}>
                <Text style={[styles.modelLabel, { color: theme.secondary }]}>{webMode ? '研究' : aiReady ? 'DeepSeek' : '离线快记'}{app.data.settings.jiahaoMode && aiReady && !webMode ? ' · 嘉豪' : ''}{app.data.settings.aiThinking && aiReady && !webMode ? ' · 思考' : ''}</Text>
                <MotionPressable accessibilityLabel="发送" disabled={loading || Boolean(pending) || !text.trim()} onPress={() => submit()} pressedScale={0.9} style={[styles.send, { backgroundColor: text.trim() && !pending ? theme.primary : theme.secondary, opacity: text.trim() && !pending ? 1 : 0.7 }]}>{app.data.settings.jiahaoMode ? <Image source={jiahaoIcons.send} style={styles.sendPortrait} /> : <AppIcon ios="arrow.up" android="arrow_upward" color="#FFFFFF" size={19} />}</MotionPressable>
              </View>
            </View>
          </View>
          <Text style={[styles.disclaimer, { color: theme.secondary }]}>{webMode ? '网页可能过时；重要政策请打开来源核对原文。' : 'AI 可能会理解错时间，请在重要考试前核对一次。'}</Text>
        </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardFrame: { flex: 1 }, fill: { flex: 1, paddingHorizontal: 18 }, header: { paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', marginBottom: 5 }, title: { fontSize: 32, fontWeight: '600' },
  online: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99 }, onlineDot: { width: 7, height: 7, borderRadius: 4 }, onlineText: { fontSize: 11, fontWeight: '600' },
  messageList: { flex: 1 }, messages: { flexGrow: 1, paddingTop: 12, paddingBottom: 20, gap: 16 }, messageWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, maxWidth: '92%' }, userWrap: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  botAvatar: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, botPortrait: { width: '100%', height: '100%' },
  bubble: { borderRadius: 22, borderTopLeftRadius: 8, paddingHorizontal: 16, paddingVertical: 13, maxWidth: '88%' }, userBubble: { borderTopLeftRadius: 22, borderTopRightRadius: 8 },
  messageText: { fontSize: 15, lineHeight: 22, fontWeight: '500' }, detail: { fontSize: 12, lineHeight: 18, marginTop: 5 }, loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginLeft: 42 }, loadingText: { fontSize: 13 },
  processArea: { marginTop: 9 }, processButton: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 5 }, processButtonText: { fontSize: 11.5, fontWeight: '700' }, processList: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, padding: 10, gap: 7, marginTop: 4 }, processStep: { flexDirection: 'row', alignItems: 'center', gap: 7 }, processDot: { width: 5, height: 5, borderRadius: 3 }, processText: { flex: 1, fontSize: 11.5, lineHeight: 16 }, processNote: { fontSize: 9.5, lineHeight: 14, marginTop: 2 },
  processPortrait: { width: 16, height: 16, borderRadius: 5 },
  preview: { alignSelf: 'stretch', borderRadius: 20, padding: 15, gap: 8 }, previewTitle: { fontSize: 15, fontWeight: '600' }, previewNote: { fontSize: 12, lineHeight: 18 }, previewItem: { fontSize: 13, lineHeight: 19, paddingVertical: 6 }, previewActions: { flexDirection: 'row', gap: 9, marginTop: 4 }, previewCancel: { flex: 1, minHeight: 38, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, previewConfirm: { flex: 1.5, minHeight: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, previewActionText: { fontSize: 13, fontWeight: '600' }, undoButton: { marginTop: 9, alignSelf: 'flex-start', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 }, undoText: { fontSize: 12, fontWeight: '600' },
  sourceList: { marginTop: 10, gap: 7 }, sourceLink: { fontSize: 11, lineHeight: 16, textDecorationLine: 'underline' },
  composerDock: { zIndex: 20 }, examples: { paddingVertical: 9 }, composer: { minHeight: 106, borderWidth: StyleSheet.hairlineWidth, borderRadius: 29, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 9, overflow: 'hidden', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 19, elevation: 5 },
  composerTools: { minHeight: 41, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, composerRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 9 }, modelLabel: { fontSize: 11, fontWeight: '600' }, webButton: { minHeight: 32, borderRadius: 13, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, webLabel: { fontSize: 11, fontWeight: '700' },
  photoButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  toolPortrait: { width: 32, height: 32, borderRadius: 10 }, webPortrait: { width: 20, height: 20, borderRadius: 6 },
  input: { minHeight: 42, maxHeight: 110, fontSize: 16, paddingTop: 6, paddingBottom: 6, textAlignVertical: 'top' }, send: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, sendPortrait: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  disclaimer: { fontSize: 10, textAlign: 'center', paddingVertical: 7 },
});
