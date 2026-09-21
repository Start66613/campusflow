import { StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { useAppTheme } from '@/src/theme';

export default function AboutScreen() {
  const theme = useAppTheme();
  return (
    <Screen>
      <View style={[styles.logo, { backgroundColor: theme.primary }]}><Text style={styles.logoText}>CF</Text></View>
      <Text style={[styles.title, { color: theme.text }]}>CampusFlow</Text>
      <Text style={[styles.subtitle, { color: theme.secondary }]}>把课表、任务、消费与专注放在一个安静的地方。</Text>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>隐私设计</Text>
        <Text style={[styles.body, { color: theme.secondary }]}>课表、消费和任务默认只保存在设备本地。OpenAI API 密钥仅存在于你部署的后端；发送给 AI 的文字或图片只用于本次结构化识别。</Text>
      </Card>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>功能边界</Text>
        <Text style={[styles.body, { color: theme.secondary }]}>iPhone 系统日历、小组件与完整通知能力需要开发版或 TestFlight 安装包。学校教务同步需要针对学校登录方式配置适配器。</Text>
      </Card>
      <Text style={[styles.footer, { color: theme.secondary }]}>Made for one student, designed to grow.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 74, height: 74, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24 }, logoText: { color: '#FFFFFF', fontSize: 25, fontWeight: '800' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.9, textAlign: 'center', marginTop: 16 }, subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7, marginBottom: 25, paddingHorizontal: 22 },
  card: { marginBottom: 13 }, cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 }, body: { fontSize: 13, lineHeight: 21 }, footer: { fontSize: 11, textAlign: 'center', marginTop: 18 },
});
