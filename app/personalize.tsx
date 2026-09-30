import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { MotionPressable } from '@/components/motion';
import { Card, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
import { pickPersistentImage } from '@/src/local-images';
import { useApp } from '@/src/store';
import { accentOptions, useAppTheme } from '@/src/theme';
import type { AccentPreset } from '@/src/types';

export default function PersonalizeScreen() {
  const theme = useAppTheme();
  const { data, hydrated, updateSettings } = useApp();
  const [name, setName] = useState(data.settings.displayName);
  const [school, setSchool] = useState(data.settings.schoolName);
  const [major, setMajor] = useState(data.settings.major ?? '');
  const [goal, setGoal] = useState(data.settings.studyGoal ?? '');
  const [avatar, setAvatar] = useState(data.settings.avatarUri);
  const [background, setBackground] = useState(data.settings.backgroundUri);
  const [opacity, setOpacity] = useState(data.settings.backgroundOpacity ?? 0.42);
  const [accent, setAccent] = useState<AccentPreset>(data.settings.accentPreset ?? 'purple');

  useEffect(() => {
    if (!hydrated) return;
    setName(data.settings.displayName);
    setSchool(data.settings.schoolName);
    setMajor(data.settings.major ?? '');
    setGoal(data.settings.studyGoal ?? '');
    setAvatar(data.settings.avatarUri);
    setBackground(data.settings.backgroundUri);
    setOpacity(data.settings.backgroundOpacity ?? 0.42);
    setAccent(data.settings.accentPreset ?? 'purple');
  }, [hydrated]);

  const selectImage = async (kind: 'avatar' | 'background') => {
    try {
      const uri = await pickPersistentImage(kind);
      if (!uri) return;
      if (kind === 'avatar') setAvatar(uri); else setBackground(uri);
    } catch (error) {
      Alert.alert('无法选取图片', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const save = () => {
    if (!name.trim() || !school.trim()) return Alert.alert('请补全信息', '昵称和学校名称不能为空。');
    updateSettings({ displayName: name.trim(), schoolName: school.trim(), major: major.trim(), studyGoal: goal.trim(), avatarUri: avatar, backgroundUri: background, backgroundOpacity: opacity, accentPreset: accent });
    router.back();
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>把它变成你的样子</Text>
      <Text style={[styles.subtitle, { color: theme.secondary }]}>照片只保存在本机，不会随 AI 请求上传。头像、背景和色彩可以随时更换。</Text>
      <SectionTitle title="个人信息" />
      <Card style={styles.card}>
        <MotionPressable accessibilityRole="button" accessibilityLabel="更换个人头像" onPress={() => selectImage('avatar')} style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatarImage} /> : <AppIcon ios="person.crop.circle.fill" android="account_circle" color={theme.primary} size={38} />}</View>
          <View><Text style={[styles.avatarTitle, { color: theme.text }]}>更换头像</Text><Text style={[styles.hint, { color: theme.secondary }]}>从相册选择并裁剪</Text></View>
        </MotionPressable>
        <Field label="昵称" value={name} onChangeText={setName} placeholder="怎么称呼你" />
        <Field label="学校" value={school} onChangeText={setSchool} placeholder="学校名称" />
        <Field label="专业" value={major} onChangeText={setMajor} placeholder="用于生成更贴近你的学习建议" />
        <Field label="目标" value={goal} onChangeText={setGoal} placeholder="例如：考研、前端开发、保研" />
      </Card>

      <SectionTitle title="整体色调" />
      <Card style={styles.card}>
        <View style={styles.swatches}>{accentOptions.map((option) => (
          <MotionPressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: accent === option.value }} accessibilityLabel={`${option.label}主题`} onPress={() => setAccent(option.value)} style={[styles.swatchItem, accent === option.value && { borderColor: option.swatch, backgroundColor: `${option.swatch}16` }]}>
            <View style={[styles.swatch, { backgroundColor: option.swatch }]}>{accent === option.value ? <Text style={styles.check}>✓</Text> : null}</View>
            <Text style={[styles.swatchLabel, { color: theme.text }]}>{option.label}</Text>
          </MotionPressable>
        ))}</View>
        <Text style={[styles.hint, { color: theme.secondary }]}>炫彩模式会保留清晰的主色文字，并在背景加入柔和多色光晕。</Text>
      </Card>

      <SectionTitle title="自定义背景" />
      <Card style={styles.card}>
        <MotionPressable onPress={() => selectImage('background')} style={[styles.backgroundPreview, { backgroundColor: theme.primarySoft }]}>
          {background ? <Image source={{ uri: background }} style={styles.previewImage} resizeMode="cover" /> : <AppIcon ios="photo.fill" android="wallpaper" color={theme.primary} size={32} />}
          <View style={styles.previewLabel}><Text style={styles.previewLabelText}>{background ? '更换背景图片' : '从相册添加背景'}</Text></View>
        </MotionPressable>
        {background ? <PrimaryButton label="恢复默认背景" secondary onPress={() => setBackground(undefined)} /> : null}
        <Text style={[styles.fieldLabel, { color: theme.secondary }]}>背景可见度</Text>
        <View style={styles.opacityRow}>{([['柔和', 0.24], ['平衡', 0.42], ['鲜明', 0.68]] as const).map(([label, value]) => (
          <MotionPressable key={label} onPress={() => setOpacity(value)} style={[styles.opacityOption, { backgroundColor: opacity === value ? theme.primarySoft : theme.surfaceAlt, borderColor: opacity === value ? theme.primary : theme.line }]}><Text style={{ color: opacity === value ? theme.primary : theme.secondary, fontWeight: '700' }}>{label}</Text></MotionPressable>
        ))}</View>
        <Text style={[styles.hint, { color: theme.secondary }]}>课程与文字仍会有独立底色，避免照片影响可读性。</Text>
      </Card>
      <View style={styles.save}><PrimaryButton label="保存我的设计" onPress={save} /></View>
    </Screen>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const theme = useAppTheme();
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: theme.secondary }]}>{label}</Text><TextInput {...props} placeholderTextColor={theme.secondary} style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt }]} /></View>;
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '600', marginTop: 8 }, subtitle: { fontSize: 12, lineHeight: 19, marginTop: 8 },
  card: { gap: 13 }, avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 3 }, avatar: { width: 62, height: 62, borderRadius: 21, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, avatarImage: { width: '100%', height: '100%' }, avatarTitle: { fontSize: 16, fontWeight: '700' }, hint: { fontSize: 11, lineHeight: 17 },
  field: { gap: 6 }, fieldLabel: { fontSize: 12, fontWeight: '700' }, input: { minHeight: 48, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, swatchItem: { minWidth: 76, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 17, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', gap: 5 }, swatch: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, check: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' }, swatchLabel: { fontSize: 11, fontWeight: '700' },
  backgroundPreview: { height: 132, borderRadius: 21, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, previewImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' }, previewLabel: { position: 'absolute', bottom: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(20,25,45,0.72)' }, previewLabelText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }, opacityRow: { flexDirection: 'row', gap: 8 }, opacityOption: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, save: { marginTop: 20 },
});
