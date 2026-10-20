import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { buildDailyReviewSnapshot } from '@/src/daily-ai';
import { useAppTheme } from '@/src/theme';
import { PrimaryButton } from './ui';

type Snapshot = ReturnType<typeof buildDailyReviewSnapshot>;
export function DailyReviewShare({ snapshot }: { snapshot: Snapshot }) {
  const theme = useAppTheme();
  const report = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [imageUri, setImageUri] = useState('');
  const share = async () => {
    if (sharing || !report.current) return;
    setSharing(true); setError('');
    try {
      if (Platform.OS !== 'web' && !(await Sharing.isAvailableAsync())) throw new Error('此设备暂时无法打开系统分享');
      // Capture a deliberately opaque, text-only report: native glass layers are not screenshot-safe.
      const uri = await captureRef(report.current, { format: 'png', quality: 1, result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile' });
      if (Platform.OS === 'web') {
        setImageUri(uri);
        const anchor = document.createElement('a');
        anchor.href = uri; anchor.download = `CampusFlow-日常周报-${snapshot.through}.png`;
        anchor.click();
      } else await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '分享我的日常周报' });
    } catch (caught) { setError(caught instanceof Error ? caught.message : '周报图片生成失败，请稍后重试'); }
    finally { setSharing(false); }
  };
  return <View style={{ gap: 14 }}>
    <View ref={report} collapsable={false} style={[s.report, { borderColor: theme.primary }]}>
      <Text style={[s.brand, { color: theme.primary }]}>CAMPUSFLOW · 日常周报</Text>
      <Text style={s.title}>这一周的你，也有进步</Text>
      <Text style={s.date}>{snapshot.from} — {snapshot.through}</Text>
      <View style={s.metrics}>{[[`${snapshot.totals.completed}/${snapshot.totals.planned}`, '习惯完成'], [String(snapshot.focus.minutes), '专注分钟'], [String(snapshot.focus.sessions), '专注次数']].map(([value, label]) => <View key={label} style={{ flex: 1 }}><Text style={s.value}>{value}</Text><Text style={s.label}>{label}</Text></View>)}</View>
      <View style={s.days}>{snapshot.days.map((day) => <View key={day.date} style={{ flex: 1, gap: 8, alignItems: 'center' }}><Text style={s.label}>{day.completed}</Text><View style={s.track}><View style={{ width: '100%', height: `${day.planned ? day.completed / day.planned * 100 : 0}%`, borderRadius: 7, backgroundColor: theme.primary }} /></View><Text style={s.label}>{Number(day.date.slice(-2))}日</Text></View>)}</View>
      <Text style={s.foot}>按已记录的习惯与专注汇总 · 今天仍在进行中</Text>
      <Text style={[s.end, { color: theme.primary }]}>慢慢来，每一点都算数</Text>
    </View>
    <Text style={{ color: theme.secondary, fontSize: 12, lineHeight: 19 }}>图片只包含上方汇总，不含手记、心情、备注和习惯名称。</Text>
    <PrimaryButton secondary disabled={sharing} label={sharing ? '正在生成图片' : Platform.OS === 'web' ? '保存周报图片' : '分享周报图片'} onPress={share} />
    {imageUri && Platform.OS === 'web' ? <View style={{ gap: 10 }}><Text style={{ color: theme.secondary, fontSize: 13 }}>周报已生成。如果没有自动下载，可以点击或长按下方图片保存。</Text><a href={imageUri} download={`CampusFlow-日常周报-${snapshot.through}.png`}><img src={imageUri} alt="本次生成的日常周报" style={{ display: 'block', width: '100%', borderRadius: 18 }} /></a></View> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: theme.red, fontSize: 13 }}>{error}</Text> : null}
  </View>;
}
const s = StyleSheet.create({
  report: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, borderTopWidth: 5, gap: 17 },
  brand: { fontSize: 11, fontWeight: '600', letterSpacing: 1 }, title: { fontSize: 21, fontWeight: '600', color: '#24242B' }, date: { color: '#676776', fontSize: 12 },
  metrics: { flexDirection: 'row', paddingVertical: 12, gap: 10 }, value: { color: '#24242B', fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] }, label: { fontSize: 11, color: '#676776' },
  days: { flexDirection: 'row', gap: 9 }, track: { width: 20, height: 65, borderRadius: 7, backgroundColor: '#F0F0F5', justifyContent: 'flex-end', overflow: 'hidden' }, foot: { color: '#737381', fontSize: 11, lineHeight: 18 }, end: { fontSize: 15, fontWeight: '600', paddingTop: 3 },
});
