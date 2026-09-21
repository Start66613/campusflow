import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren, ReactNode } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gentleEnter, gentleLayout, MotionPressable } from '@/components/motion';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle> }>) {
  const theme = useAppTheme();
  const { data } = useApp();
  const glass = data.settings.visualMode === 'glass';
  const content = scroll ? (
    <ScrollView bounces contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Animated.View entering={gentleEnter()} style={style}>{children}</Animated.View>
    </ScrollView>
  ) : (
    <Animated.View entering={FadeIn.duration(280).reduceMotion(ReduceMotion.System)} style={[styles.fill, style]}>{children}</Animated.View>
  );
  const dark = theme.background === '#000000';
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}>
      {glass ? (
        <Image
          source={require('../assets/images/glass-wallpaper-v1.png')}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { opacity: dark ? 0.14 : 0.82 }]}
        />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={dark ? ['rgba(0,0,0,0.88)', 'rgba(10,10,18,0.82)', '#000000'] : glass ? ['rgba(242,242,247,0.10)', 'rgba(255,255,255,0.04)', 'rgba(242,242,247,0.20)'] : [theme.background, `${theme.primary}0B`, theme.background]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.ambientOrb, styles.ambientOrbTop, { backgroundColor: `${theme.primary}0A` }]} />
      <View pointerEvents="none" style={[styles.ambientOrb, styles.ambientOrbBottom, { backgroundColor: `${theme.green}08` }]} />
      {content}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; onPress?: () => void }>) {
  const theme = useAppTheme();
  if (onPress) {
    return (
      <MotionPressable onPress={onPress} style={[styles.card, { backgroundColor: theme.surface, borderColor: `${theme.line}B8`, shadowColor: theme.shadow }, style]}>
        {children}
      </MotionPressable>
    );
  }
  return <Animated.View layout={gentleLayout} style={[styles.card, { backgroundColor: theme.surface, borderColor: `${theme.line}B8`, shadowColor: theme.shadow }, style]}>{children}</Animated.View>;
}

export function GlassBackdrop({
  interactive = false,
  style,
  radius = 999,
  tintColor,
  tintStrength = 'strong',
  effectStyle = 'regular',
}: {
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  tintColor?: string;
  tintStrength?: 'soft' | 'strong';
  effectStyle?: 'clear' | 'regular';
}) {
  const theme = useAppTheme();
  const { data } = useApp();
  const dark = theme.background === '#000000';
  const glass = data.settings.visualMode === 'glass';
  const edgeColor = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.76)';
  const tintWithAlpha = (alpha: string) => tintColor?.match(/^#[0-9A-Fa-f]{6}$/) ? `${tintColor}${alpha}` : tintColor;

  if (!glass) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: tintColor ? tintWithAlpha(tintStrength === 'soft' ? '24' : 'FF') : theme.surface, borderColor: theme.line, borderWidth: StyleSheet.hairlineWidth }, style]}
      />
    );
  }

  if (Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable()) {
    return (
      <View pointerEvents="none" style={[styles.glassClip, StyleSheet.absoluteFill, { borderRadius: radius }, style]}>
        <GlassView
          glassEffectStyle={effectStyle}
          tintColor={tintColor ? tintWithAlpha(tintStrength === 'soft' ? '42' : 'D0') : undefined}
          colorScheme={dark ? 'dark' : 'light'}
          isInteractive={interactive}
          style={StyleSheet.absoluteFill}
        />
        {tintColor ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tintWithAlpha(tintStrength === 'soft' ? '16' : '72') }]} /> : null}
        <LinearGradient
          colors={dark ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.01)'] : ['rgba(255,255,255,0.40)', 'rgba(255,255,255,0.03)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glassEdge, { borderRadius: radius, borderColor: edgeColor }]} />
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={[styles.glassClip, StyleSheet.absoluteFill, { borderRadius: radius }, style]}>
      <BlurView intensity={Platform.OS === 'android' ? 48 : 58} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={tintColor
          ? [tintWithAlpha(tintStrength === 'soft' ? '52' : 'E8') ?? tintColor, tintWithAlpha(tintStrength === 'soft' ? '28' : 'C4') ?? tintColor]
          : dark ? ['rgba(255,255,255,0.12)', 'rgba(20,20,26,0.38)'] : ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.26)']}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glassEdge, { borderRadius: radius, borderColor: edgeColor }]} />
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const theme = useAppTheme();
  return (
    <Animated.View entering={gentleEnter(40)} style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action ? <MotionPressable onPress={onAction}><Text style={[styles.sectionAction, { color: theme.primary }]}>{action}</Text></MotionPressable> : null}
    </Animated.View>
  );
}

export function Pill({ children, tone = 'primary' }: PropsWithChildren<{ tone?: 'primary' | 'green' | 'orange' | 'neutral' }>) {
  const theme = useAppTheme();
  const background = tone === 'green' ? `${theme.green}22` : tone === 'orange' ? `${theme.orange}22` : tone === 'neutral' ? theme.surfaceAlt : theme.primarySoft;
  const color = tone === 'green' ? theme.green : tone === 'orange' ? theme.orange : tone === 'neutral' ? theme.secondary : theme.primary;
  return <Animated.View entering={FadeIn.duration(160).reduceMotion(ReduceMotion.System)} style={[styles.pill, { backgroundColor: background }]}><Text style={[styles.pillText, { color }]}>{children}</Text></Animated.View>;
}

export function PrimaryButton({ label, onPress, icon, disabled = false, secondary = false }: { label: string; onPress: () => void; icon?: ReactNode; disabled?: boolean; secondary?: boolean }) {
  const theme = useAppTheme();
  return (
    <MotionPressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, {
        backgroundColor: secondary ? theme.primarySoft : theme.primary,
        opacity: disabled ? 0.45 : 1,
      }]}
    >
      {icon}
      <Text style={[styles.buttonText, { color: secondary ? theme.primary : '#FFFFFF' }]}>{label}</Text>
    </MotionPressable>
  );
}

export function EmptyState({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  const theme = useAppTheme();
  return (
    <Animated.View entering={gentleEnter()} style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: theme.secondary }]}>{body}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 126 },
  ambientOrb: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  ambientOrbTop: { top: -120, right: -105 },
  ambientOrbBottom: { bottom: 90, left: -160 },
  card: {
    borderRadius: 28,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.055,
    shadowRadius: 22,
    elevation: 2,
  },
  glassClip: { overflow: 'hidden' },
  glassEdge: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderWidth: StyleSheet.hairlineWidth },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.45 },
  sectionAction: { fontSize: 14, fontWeight: '600' },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '600' },
  button: { minHeight: 52, paddingHorizontal: 18, borderRadius: 17, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 28 },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
