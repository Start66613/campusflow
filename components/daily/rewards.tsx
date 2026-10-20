import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { DailyForm, Field, TextButton, dailyStyles as s } from '@/components/daily/shared';
import { Card, EmptyState, PrimaryButton } from '@/components/ui';
import { dailyBalance, localDateKey } from '@/src/daily';
import type { DailyReward } from '@/src/daily-types';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export function RewardsPanel() {
  const app = useApp();
  const theme = useAppTheme();
  const balance = dailyBalance(app.data.daily);
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState<DailyReward | null>(null);
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('30');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [redeeming, setRedeeming] = useState<DailyReward | null>(null);
  const [notice, setNotice] = useState('');
  const open = (reward?: DailyReward) => { setEditing(reward ?? null); setTitle(reward?.title ?? ''); setCost(String(reward?.cost ?? 30)); setError(''); setDeleting(false); setForm(true); };
  const redeem = () => {
    if (!redeeming) return;
    if (app.redeemDailyReward(redeeming.id)) {
      setNotice(`已兑换「${redeeming.title}」，记得好好奖励自己`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } else setNotice('积分不足，或这个心愿已被修改，请稍后再试');
    setRedeeming(null);
  };
  return <>
    <Card style={{ gap: 12 }}>
      <View style={s.row}><View style={{ width: 52, height: 52, borderRadius: 19, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}><AppIcon ios="gift.fill" android="redeem" color={theme.primary} size={26} /></View><View style={{ flex: 1 }}><Text style={[s.label, { color: theme.secondary }]}>属于你的努力积分</Text><Text style={{ color: theme.primary, fontSize: 38, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{balance}</Text></View></View>
      <Text style={[s.body, { color: theme.secondary }]}>每个习惯每天首次完成获得 5 分。积攒一点小坚持，兑换自己定下的小奖励。</Text>
      <Text style={[s.caption, { color: theme.secondary }]}>重复打卡不会重复得分；撤销打卡保留已经赚到的积分。心愿仅用于自我奖励，不涉及付款或实物发放。</Text>
    </Card>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.sectionTitle, { color: theme.text }]}>我的心愿清单</Text><TextButton label="＋ 新心愿" onPress={() => open()} /></View>
    {notice ? <Card><Text accessibilityRole="alert" style={[s.body, { color: theme.primary }]}>{notice}</Text></Card> : null}
    {app.data.daily.rewards.length ? app.data.daily.rewards.map((reward) => <Card key={reward.id} style={{ gap: 12 }}>
      <View style={s.row}><View style={{ flex: 1 }}><Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>{reward.title}</Text><Text style={[s.caption, { color: theme.secondary }]}>{reward.cost} 积分{balance < reward.cost ? ` · 还差 ${reward.cost - balance} 分` : ' · 可以兑换了'}</Text></View><TextButton label="编辑" onPress={() => open(reward)} /></View>
      <PrimaryButton label={balance >= reward.cost ? '兑现这个小期待' : '继续积攒中'} disabled={balance < reward.cost} secondary={balance < reward.cost} onPress={() => setRedeeming(reward)} />
    </Card>) : <Card><EmptyState title="给坚持一个小奖励" body="一杯喜欢的饮料、一场电影，或一个放空的下午，都可以成为你的心愿" /></Card>}
    <Text style={[s.sectionTitle, { color: theme.text }]}>已经兑现的快乐</Text>
    <Card style={{ gap: 12 }}>{app.data.daily.redemptions.length ? [...app.data.daily.redemptions].reverse().map((record) => <View key={record.id} style={s.row}><AppIcon ios="checkmark.seal.fill" android="verified" color={theme.green} size={24} /><View style={{ flex: 1 }}><Text style={{ color: theme.text, fontSize: 15 }}>{record.title}</Text><Text style={[s.caption, { color: theme.secondary }]}>{localDateKey(new Date(record.createdAt))}</Text></View><Text style={{ color: theme.secondary, fontSize: 15, fontVariant: ['tabular-nums'] }}>−{record.cost}</Text></View>) : <Text style={[s.body, { color: theme.secondary }]}>兑换后会在这里留下记录</Text>}</Card>
    <DailyForm visible={form} title={editing ? '编辑心愿' : '一个小心愿'} onClose={() => setForm(false)}>
      <Field label="想给自己的奖励" value={title} onChangeText={setTitle} maxLength={120} placeholder="例如：周末看一场电影" />
      <Field label="需要的积分" value={cost} onChangeText={setCost} keyboardType="number-pad" maxLength={7} />
      {error ? <Text accessibilityRole="alert" style={[s.error, { color: theme.red }]}>{error}</Text> : null}
      <PrimaryButton label="保存心愿" onPress={() => { try { app.saveDailyReward({ id: editing?.id, title: title.trim(), cost: /^\d+$/.test(cost) ? Number(cost) : NaN }); setForm(false); } catch (caught) { setError(caught instanceof Error ? caught.message : '请检查心愿名称与积分'); } }} />
      {editing ? deleting ? <Card style={{ gap: 10 }}><Text style={[s.body, { color: theme.text }]}>从清单删除这个心愿？过去的兑换记录会保留。</Text><View style={s.row}><TextButton label="保留" onPress={() => setDeleting(false)} /><TextButton label="确认删除" danger onPress={() => { app.deleteDailyReward(editing.id); setForm(false); }} /></View></Card> : <TextButton label="删除心愿" danger onPress={() => setDeleting(true)} /> : null}
    </DailyForm>
    <DailyForm visible={Boolean(redeeming)} title="给自己的奖励" onClose={() => setRedeeming(null)}>{redeeming ? <><Text style={{ color: theme.text, fontSize: 24, fontWeight: '600' }}>{redeeming.title}</Text><Text style={[s.body, { color: theme.secondary }]}>使用 {redeeming.cost} 积分兑换，完成后余额为 {Math.max(0, balance - redeeming.cost)} 分。兑换会记录到你的心愿历史中。</Text><PrimaryButton label="确认兑换" disabled={balance < redeeming.cost} onPress={redeem} /></> : null}</DailyForm>
  </>;
}
