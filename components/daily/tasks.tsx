import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { Choice, DailyForm, Field, TextButton, dailyStyles as s, validDate } from '@/components/daily/shared';
import { MotionPressable } from '@/components/motion';
import { Card, EmptyState, PrimaryButton } from '@/components/ui';
import { localDateKey } from '@/src/daily';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import type { Task } from '@/src/types';

export function DailyTasks({ date }: { date: string }) {
  const app = useApp();
  const theme = useAppTheme();
  const today = localDateKey();
  const [filter, setFilter] = useState('pending');
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(date);
  const [dueTime, setDueTime] = useState('23:59');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const open = (task?: Task) => {
    const due = task ? new Date(task.dueAt) : null;
    setEditing(task ?? null); setTitle(task?.title ?? ''); setDueDate(due ? localDateKey(due) : date);
    setDueTime(due ? `${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}` : '23:59');
    setError(''); setDeleting(false); setVisible(true);
  };
  const tasks = app.data.tasks.filter((task) => filter === 'all' || (filter === 'done' ? task.completed : !task.completed))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueAt.localeCompare(b.dueAt));
  const save = () => {
    if (!title.trim()) return setError('请填写待办内容');
    if (!validDate(dueDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime)) return setError('请填写真实日期和 24 小时制时间');
    try {
      const dueAt = new Date(`${dueDate}T${dueTime}:00`).toISOString();
      if (editing) app.updateTask({ ...editing, title: title.trim(), dueAt });
      else app.addTask({ title: title.trim(), dueAt, source: 'manual', completed: false });
      setVisible(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : '保存失败'); }
  };
  return <>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.sectionTitle, { color: theme.text }]}>待办也放在这里</Text><TextButton label="＋ 添加待办" onPress={() => open()} /></View>
    <View style={s.wrap}>{[{ value: 'pending', label: '待完成' }, { value: 'done', label: '已完成' }, { value: 'all', label: '全部' }].map((item) => <Choice key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />)}</View>
    <Card style={{ gap: 4 }}>{tasks.length ? tasks.map((task) => <View key={task.id} style={[s.row, { minHeight: 64, paddingVertical: 8 }]}>
      <MotionPressable accessibilityRole="checkbox" accessibilityLabel={`完成 ${task.title}`} accessibilityState={{ checked: task.completed }} onPress={() => app.toggleTask(task.id)} style={{ width: 42, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><AppIcon ios={task.completed ? 'checkmark.circle.fill' : 'circle'} android={task.completed ? 'check_circle' : 'radio_button_unchecked'} color={task.completed ? theme.green : theme.primary} size={25} /></MotionPressable>
      <MotionPressable accessibilityLabel={`编辑待办 ${task.title}`} onPress={() => open(task)} style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}><Text style={{ fontSize: 15, color: theme.text, textDecorationLine: task.completed ? 'line-through' : 'none' }}>{task.title}</Text><Text style={[s.caption, { color: theme.secondary }]}>{task.completed ? '已完成' : `截止 ${localDateKey(new Date(task.dueAt))}${localDateKey(new Date(task.dueAt)) < today ? ' · 已逾期' : ''}`}</Text></MotionPressable>
      <TextButton label="编辑" onPress={() => open(task)} />
    </View>) : <EmptyState title={filter === 'done' ? '完成后会留在这里' : '暂时没有待办'} body="临时想到的事，可以在这里记下来" />}</Card>
    <DailyForm visible={visible} title={editing ? '编辑待办' : '记下一件事'} onClose={() => setVisible(false)}>
      <Field label="待办内容" value={title} onChangeText={setTitle} placeholder="要做什么？" maxLength={200} />
      <Field label="截止日期" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" maxLength={10} />
      <Field label="截止时间" value={dueTime} onChangeText={setDueTime} placeholder="23:59" maxLength={5} />
      {error ? <Text accessibilityRole="alert" style={[s.error, { color: theme.red }]}>{error}</Text> : null}
      <PrimaryButton label="保存待办" onPress={save} />
      {editing ? deleting ? <Card style={{ gap: 10 }}><Text style={[s.body, { color: theme.text }]}>确定删除这条待办？删除后无法撤销。</Text><View style={s.row}><TextButton label="保留" onPress={() => setDeleting(false)} /><TextButton label="确认删除" danger onPress={() => { app.deleteTask(editing.id); setVisible(false); }} /></View></Card> : <TextButton label="删除待办" danger onPress={() => setDeleting(true)} /> : null}
    </DailyForm>
  </>;
}
