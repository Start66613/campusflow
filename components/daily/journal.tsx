import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { Choice, DailyForm, Field, TextButton, dailyStyles as s, moods, validDate } from '@/components/daily/shared';
import { Card, EmptyState, PrimaryButton } from '@/components/ui';
import { localDateKey } from '@/src/daily';
import type { DailyNote } from '@/src/daily-types';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export function JournalPanel({ date }: { date: string }) {
  const app = useApp();
  const theme = useAppTheme();
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState(0);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<DailyNote | null>(null);
  const [noteDate, setNoteDate] = useState(date);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<DailyNote['mood']>(3);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const notes = useMemo(() => app.data.daily.notes.filter((note) =>
    (!moodFilter || note.mood === moodFilter)
    && (!query.trim() || `${note.title} ${note.body} ${note.date}`.toLowerCase().includes(query.trim().toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)), [app.data.daily.notes, moodFilter, query]);
  const open = (note?: DailyNote) => {
    setEditing(note ?? null); setNoteDate(note?.date ?? date); setTitle(note?.title ?? '');
    setBody(note?.body ?? ''); setMood(note?.mood ?? 3); setError(''); setDeleting(false); setVisible(true);
  };
  const save = () => {
    if (!validDate(noteDate) || noteDate > localDateKey()) return setError('请填写今天或过去的真实日期，格式 YYYY-MM-DD');
    if (!title.trim() && !body.trim()) return setError('写下一点今天的事，再保存吧');
    try {
      app.saveDailyNote({ id: editing?.id, date: noteDate, title: title.trim(), body: body.trim(), mood });
      setVisible(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : '保存失败，请重试'); }
  };
  return <>
    <Card style={{ gap: 12 }}>
      <View style={s.row}><View style={{ flex: 1 }}><Text style={[s.sectionTitle, { color: theme.text }]}>给普通的一天留个注脚</Text><Text style={[s.caption, { color: theme.secondary }]}>开心的小事，偶尔的烦恼，都可以写在这里</Text></View><AppIcon ios="book.closed.fill" android="auto_stories" color={theme.primary} size={28} /></View>
      <PrimaryButton label="写一篇手记" onPress={() => open()} />
    </Card>
    <Field label="找回某一天" placeholder="搜索内容、标题或日期" value={query} onChangeText={setQuery} clearButtonMode="while-editing" />
    <View style={s.wrap}><Choice label="全部心情" selected={!moodFilter} onPress={() => setMoodFilter(0)} />{moods.map((label, index) => <Choice key={label} label={label} selected={moodFilter === index + 1} onPress={() => setMoodFilter(index + 1)} />)}</View>
    <Text style={[s.caption, { color: theme.secondary }]}>{notes.length} 篇手记 · 点击卡片查看或编辑</Text>
    {notes.length ? notes.map((note) => <Card key={note.id} onPress={() => open(note)} style={{ gap: 10 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.caption, { color: theme.secondary }]}>{note.date}</Text><View style={{ backgroundColor: theme.primarySoft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 }}><Text style={{ color: theme.primary, fontSize: 12 }}>{moods[note.mood - 1]}</Text></View></View>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>{note.title || '这一天的小事'}</Text>
      {note.body ? <Text numberOfLines={4} style={[s.body, { color: theme.secondary }]}>{note.body}</Text> : null}
    </Card>) : <Card><EmptyState title={query || moodFilter ? '暂时没找到这篇手记' : '第一篇，从今天开始'} body={query || moodFilter ? '换个关键词或心情试试看' : '不用写得很长，一句话也值得留下'} /></Card>}
    <DailyForm visible={visible} title={editing ? '这一天的手记' : '写下今天'} onClose={() => setVisible(false)}>
      <Field label="日期" value={noteDate} onChangeText={setNoteDate} maxLength={10} placeholder="YYYY-MM-DD" />
      <Text style={[s.label, { color: theme.secondary }]}>现在的心情</Text>
      <View style={s.wrap}>{moods.map((label, index) => <Choice key={label} label={label} selected={mood === index + 1} onPress={() => setMood((index + 1) as DailyNote['mood'])} />)}</View>
      <Field label="标题 · 可以不写" value={title} onChangeText={setTitle} maxLength={120} placeholder="今天最想记住什么？" />
      <Field label="留给自己的话" value={body} onChangeText={setBody} multiline maxLength={20000} placeholder="今天发生了什么，有什么感受…" style={{ minHeight: 240 }} />
      {error ? <Text accessibilityRole="alert" style={[s.error, { color: theme.red }]}>{error}</Text> : null}
      <PrimaryButton label="保存手记" onPress={save} />
      {editing ? deleting ? <Card style={{ gap: 10 }}><Text style={[s.body, { color: theme.text }]}>确定删除这篇手记？删除后无法撤销。</Text><View style={s.row}><TextButton label="保留" onPress={() => setDeleting(false)} /><TextButton label="确认删除" danger onPress={() => { app.deleteDailyNote(editing.id); setVisible(false); }} /></View></Card> : <TextButton label="删除手记" danger onPress={() => setDeleting(true)} /> : null}
    </DailyForm>
  </>;
}
