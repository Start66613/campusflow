import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, Switch, Text, View } from 'react-native';

import { Choice, DailyPage, Field, HabitSymbol, dailyStyles as s, habitColors, habitSymbols, validDate } from '@/components/daily/shared';
import { habitTemplates } from '@/components/daily/templates';
import { MotionPressable } from '@/components/motion';
import { Card, PrimaryButton } from '@/components/ui';
import { localDateKey } from '@/src/daily';
import type { HabitMode, HabitPeriod } from '@/src/daily-types';
import { requestDailyNotificationPermission } from '@/src/daily-notifications';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export default function HabitEditor() {
  const params = useLocalSearchParams<{ id?: string; template?: string }>();
  const app = useApp();
  const theme = useAppTheme();
  const existing = app.data.daily.habits.find((habit) => habit.id === params.id);
  const preset = habitTemplates.find((item) => item.key === params.template)?.habit;
  const initial = existing ?? preset;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'leaf');
  const [color, setColor] = useState(initial?.color ?? habitColors[0]);
  const [category, setCategory] = useState(initial?.category ?? '生活');
  const [mode, setMode] = useState<HabitMode>(initial?.mode ?? 'check');
  const [target, setTarget] = useState(String(initial?.target ?? 1));
  const [unit, setUnit] = useState(initial?.unit ?? '次');
  const [weekdays, setWeekdays] = useState(initial?.weekdays ?? [1, 2, 3, 4, 5, 6, 7]);
  const [everyNDays, setEveryNDays] = useState(String(existing?.everyNDays ?? 1));
  const [period, setPeriod] = useState<HabitPeriod>(initial?.period ?? 'any');
  const [startDate, setStartDate] = useState(existing?.startDate ?? localDateKey());
  const [endDate, setEndDate] = useState(existing?.endDate ?? '');
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime ?? '');
  const [important, setImportant] = useState(existing?.important ?? false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [savedId, setSavedId] = useState<string>();
  const save = async () => {
    if (saving) return;
    if (!title.trim()) return setError('给这个习惯起个名字吧');
    if (!validDate(startDate) || (endDate && !validDate(endDate))) return setError('日期格式为 YYYY-MM-DD，请填写真实日期');
    if (endDate && endDate < startDate) return setError('结束日期不能早于开始日期');
    if (!weekdays.length) return setError('至少选择一个执行日');
    if (!/^\d+$/.test(everyNDays) || Number(everyNDays) < 1 || Number(everyNDays) > 365) return setError('重复间隔请填写 1～365 天');
    if (mode !== 'check' && (!Number.isFinite(Number(target)) || Number(target) <= 0 || Number(target) > 100000)) return setError('目标数量应大于 0，不超过 100000');
    if (reminderTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) return setError('提醒时间请使用 24 小时格式，例如 20:30');
    if (!/^#[\dA-Fa-f]{6}$/.test(color)) return setError('颜色格式为 # 加 6 位十六进制色值');
    setSaving(true);
    setError('');
    try {
      let notice = '';
      if (reminderTime) {
        if (Platform.OS === 'web') notice = '习惯已保存，网页不会发送系统提醒。请在手机 App 中编辑提醒时间并开启通知。';
        else if (reminderTime !== existing?.reminderTime || !existing) {
          try {
            if (!await requestDailyNotificationPermission()) notice = '习惯已保存，通知权限尚未开启，暂时无法提醒。可以在系统设置中开启通知后重新打开 App。';
          } catch { notice = '习惯已保存，但这次未能开启通知。请检查系统通知设置后重新打开 App。'; }
        }
      }
      const id = app.saveHabit({ id: existing?.id ?? savedId, title: title.trim(), icon, color, category: category.trim() || '生活', mode, target: mode === 'check' ? 1 : Number(target), unit: mode === 'minutes' ? '分钟' : unit.trim() || '次', weekdays, everyNDays: Number(everyNDays), period, startDate, endDate: endDate || undefined, reminderTime: reminderTime || undefined, important, archived: existing?.archived ?? false });
      setSavedId(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (notice) setSavedNotice(notice);
      else router.canGoBack() ? router.back() : router.replace('/daily');
    } catch (caught) { setError(caught instanceof Error ? caught.message : '保存失败，请检查输入'); }
    finally { setSaving(false); }
  };
  return <><Stack.Screen options={{ headerShown: false }} /><DailyPage title={existing ? '编辑习惯' : '一个小习惯'} subtitle="从轻松做到的一件事开始">
    <Card style={{ gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 10 }}><View style={{ width: 70, height: 70, borderRadius: 25, backgroundColor: `${/^#[\dA-Fa-f]{6}$/.test(color) ? color : habitColors[0]}20`, alignItems: 'center', justifyContent: 'center' }}><HabitSymbol name={icon} color={color} size={31} /></View><Text style={{ fontSize: 20, fontWeight: '600', color: theme.text }}>{title.trim() || '让生活慢慢变好'}</Text></View>
      <Field label="习惯名称" value={title} onChangeText={setTitle} placeholder="例如：睡前读书" maxLength={60} />
      <Field label="分类 · 可以自己取名" value={category} onChangeText={setCategory} placeholder="生活 / 学习 / 健康" maxLength={20} />
      <View style={s.wrap}>{habitSymbols.map((item) => <MotionPressable key={item.key} accessibilityLabel={item.label} accessibilityState={{ selected: icon === item.key }} onPress={() => setIcon(item.key)} style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: icon === item.key ? theme.primarySoft : theme.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: icon === item.key ? theme.primary : 'transparent' }}><HabitSymbol name={item.key} color={icon === item.key ? theme.primary : theme.secondary} /></MotionPressable>)}</View>
      <View style={s.wrap}>{habitColors.map((value) => <MotionPressable key={value} accessibilityLabel={`颜色 ${value}`} accessibilityState={{ selected: color === value }} onPress={() => setColor(value)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: value, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 19 }}>{color === value ? '✓' : ''}</Text></MotionPressable>)}</View>
      <Field label="自定义颜色" value={color} onChangeText={setColor} autoCapitalize="characters" maxLength={7} />
    </Card>
    <Card style={s.section}><Text style={[s.sectionTitle, { color: theme.text }]}>怎样才算完成</Text><View style={s.wrap}>{([{ value: 'check', label: '完成打卡' }, { value: 'count', label: '累计数量' }, { value: 'minutes', label: '累计时长' }] as const).map((item) => <Choice key={item.value} label={item.label} selected={mode === item.value} onPress={() => { setMode(item.value); if (item.value === 'minutes') { setTarget('20'); setUnit('分钟'); } else if (item.value === 'count') { setTarget('1'); setUnit('次'); } }} />)}</View>
      {mode !== 'check' ? <View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1 }}><Field label="每日目标" value={target} onChangeText={setTarget} keyboardType="decimal-pad" maxLength={8} /></View><View style={{ flex: 1 }}><Field label="单位" value={mode === 'minutes' ? '分钟' : unit} editable={mode !== 'minutes'} onChangeText={setUnit} maxLength={8} /></View></View> : null}
      <Text style={[s.caption, { color: theme.secondary }]}>按目标累计进度，完成后可撤销。计时习惯可以关联番茄钟。</Text>
    </Card>
    <Card style={s.section}><Text style={[s.sectionTitle, { color: theme.text }]}>安排进生活里</Text><View style={s.wrap}>{[1, 2, 3, 4, 5, 6, 7].map((day) => <Choice key={day} label={['一', '二', '三', '四', '五', '六', '日'][day - 1]} selected={weekdays.includes(day)} onPress={() => setWeekdays((values) => values.includes(day) ? values.filter((value) => value !== day) : [...values, day])} />)}</View>
      <Field label="每隔几天执行一次" value={everyNDays} onChangeText={setEveryNDays} keyboardType="number-pad" maxLength={3} />
      <Text style={[s.caption, { color: theme.secondary }]}>从开始日期计算间隔，同时满足所选星期才会显示。每天重复填 1。</Text>
      <Field label="开始日期" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" maxLength={10} />
      <Field label="结束日期 · 留空则持续进行" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" maxLength={10} />
      <View style={s.wrap}>{([{ value: 'any', label: '随时' }, { value: 'morning', label: '早晨' }, { value: 'afternoon', label: '午后' }, { value: 'evening', label: '晚上' }] as const).map((item) => <Choice key={item.value} label={item.label} selected={period === item.value} onPress={() => setPeriod(item.value)} />)}</View>
      <Field label="提醒时间 · 不需要提醒可留空" value={reminderTime} onChangeText={setReminderTime} placeholder="例如 20:30" maxLength={5} />
      <View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}><Text style={[s.body, { color: theme.text }]}>标为重要</Text><Text style={[s.caption, { color: theme.secondary }]}>让最在意的习惯排在前面</Text></View><Switch accessibilityLabel="标为重要" value={important} onValueChange={setImportant} trackColor={{ true: theme.primary }} /></View>
    </Card>
    {error ? <Text accessibilityRole="alert" style={[s.error, { color: theme.red }]}>{error}</Text> : null}
    {savedNotice ? <Card style={{ gap: 12 }}><Text accessibilityRole="alert" style={[s.body, { color: theme.text }]}>{savedNotice}</Text><PrimaryButton label="完成" onPress={() => router.canGoBack() ? router.back() : router.replace('/daily')} /></Card> : null}
    <PrimaryButton label={saving ? '正在保存…' : '保存习惯'} disabled={saving} onPress={() => void save()} />
  </DailyPage></>;
}
