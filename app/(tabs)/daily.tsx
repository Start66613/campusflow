import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';

import { JournalPanel } from '@/components/daily/journal';
import { RewardsPanel } from '@/components/daily/rewards';
import { DailyPage } from '@/components/daily/shared';
import { TodayPanel } from '@/components/daily/today';
import { TracesPanel } from '@/components/daily/traces';
import { MotionReveal } from '@/components/motion';
import { SegmentedControl } from '@/components/segmented-control';
import { localDateKey } from '@/src/daily';

const sections = [{ value: 'today', label: '今日' }, { value: 'journal', label: '手记' }, { value: 'traces', label: '足迹' }, { value: 'rewards', label: '心愿' }];

export default function DailyScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const [section, setSection] = useState(sections.some((item) => item.value === params.section) ? params.section! : 'today');
  const [date, setDate] = useState(localDateKey());
  // Keep an intentionally selected historical day, but advance "today" after midnight/resume.
  useEffect(() => {
    let previous = localDateKey();
    const refresh = () => {
      const next = localDateKey();
      if (next !== previous) { setDate((current) => current === previous ? next : current); previous = next; }
    };
    const timer = setInterval(refresh, 30_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return <DailyPage tabRoot title="我的日常" subtitle="照顾学习，也照顾生活">
    <SegmentedControl items={sections} value={section} onChange={setSection} />
    <MotionReveal key={section} style={{ width: '100%', minWidth: 0, gap: 16 }}>
      {section === 'today' ? <TodayPanel date={date} onDate={setDate} /> : null}
      {section === 'journal' ? <JournalPanel date={date} /> : null}
      {section === 'traces' ? <TracesPanel date={date} onDate={(value) => { setDate(value); setSection('today'); }} /> : null}
      {section === 'rewards' ? <RewardsPanel /> : null}
    </MotionReveal>
    <View style={{ height: 4 }} />
  </DailyPage>;
}
