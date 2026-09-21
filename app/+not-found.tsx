import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme';

export default function NotFoundScreen() {
  const theme = useAppTheme();
  return (
    <>
      <Stack.Screen options={{ title: '页面不存在' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.emoji}>🧭</Text>
        <Text style={[styles.title, { color: theme.text }]}>走错教室了</Text>
        <Text style={[styles.body, { color: theme.secondary }]}>这个页面不存在，回到首页继续吧。</Text>
        <Link href="/" style={[styles.link, { color: theme.primary }]}>返回首页</Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, emoji: { fontSize: 42 }, title: { fontSize: 24, fontWeight: '900', marginTop: 14 }, body: { fontSize: 14, marginTop: 7 }, link: { marginTop: 22, fontSize: 15, fontWeight: '800' },
});
