import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gentleLayout, gentleTextEnter, motion, MotionPressable } from '@/components/motion';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import { useReduceTransparency } from '@/src/accessibility';

export function Screen({ children, scroll = true, scrollEnabled = true, style }: PropsWithChildren<{ scroll?: boolean; scrollEnabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  const theme = useAppTheme();
  const { data } = useApp();
  const glass = data.settings.visualMode === 'glass';
  const focused = useIsFocused();
  const firstFocus = useRef(true);
  const focusProgress = useSharedValue(1);
  useEffect(() => {
    if (!focused) return;
    if (firstFocus.current) { firstFocus.current = false; return; }
    focusProgress.value = 0;
    focusProgress.value = withTiming(1, { duration: motion.page, reduceMotion: ReduceMotion.System });
  }, [focused, focusProgress]);
  // Transform can repeat on focus; fading this ancestor can hide native GlassView.
  const focusStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - focusProgress.value) * 12 }] }));
  const content = scroll ? (
    <ScrollView scrollEnabled={scrollEnabled} bounces contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Animated.View style={[focusStyle, style]}>{children}</Animated.View>
    </ScrollView>
  ) : (
    <Animated.View style={[styles.fill, focusStyle, style]}>{children}</Animated.View>
  );
  const dark = theme.background === '#000000';
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}>
      {data.settings.backgroundUri ? (
        <Image
          source={{ uri: data.settings.backgroundUri }}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { opacity: Math.min(0.82, Math.max(0.12, data.settings.backgroundOpacity ?? 0.42)) }]}
        />
      ) : glass ? (
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
      {data.settings.accentPreset === 'rainbow' ? <LinearGradient pointerEvents="none" colors={['rgba(170,108,247,0.12)', 'rgba(93,191,248,0.09)', 'rgba(75,207,159,0.10)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
      <View pointerEvents="none" style={[styles.ambientOrb, styles.ambientOrbTop, { backgroundColor: `${theme.primary}0A` }]} />
      <View pointerEvents="none" style={[styles.ambientOrb, styles.ambientOrbBottom, { backgroundColor: `${theme.green}08` }]} />
      {content}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress, glassSurface = true }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; onPress?: () => void; glassSurface?: boolean }>) {
  const theme = useAppTheme();
  const { data } = useApp();
  const glass = data.settings.visualMode === 'glass';
  const showGlass = glass && glassSurface;
  const cardStyle = [styles.card, { backgroundColor: showGlass ? 'transparent' : theme.surface, borderColor: `${theme.line}B8`, shadowColor: theme.shadow }, style];
  if (onPress) {
    return (
      <MotionPressable onPress={onPress} style={cardStyle}>
        {showGlass ? <GlassBackdrop radius={28} effectStyle="regular" readable /> : null}
        {children}
      </MotionPressable>
    );
  }
  return <Animated.View layout={gentleLayout} style={cardStyle}>{showGlass ? <GlassBackdrop radius={28} effectStyle="regular" readable /> : null}{children}</Animated.View>;
}

export function GlassBackdrop({
  interactive = false,
  style,
  radius = 999,
  tintColor,
  tintStrength = 'strong',
  effectStyle = 'regular',
  readable = false,
}: {
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  tintColor?: string;
  tintStrength?: 'soft' | 'strong';
  effectStyle?: 'clear' | 'regular';
  readable?: boolean;
}) {
  const theme = useAppTheme();
  const { data } = useApp();
  const dark = theme.background === '#000000';
  const glass = data.settings.visualMode === 'glass';
  const reduceTransparency = useReduceTransparency();
  const edgeColor = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.76)';
  const tintWithAlpha = (alpha: string) => tintColor?.match(/^#[0-9A-Fa-f]{6}$/) ? `${tintColor}${alpha}` : tintColor;

  if (!glass || reduceTransparency) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: tintColor ? tintWithAlpha(tintStrength === 'soft' ? '32' : 'E8') : theme.surface, borderColor: theme.line, borderWidth: StyleSheet.hairlineWidth }, style]}
      />
    );
  }

  if (Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable()) {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius }, style]}>
        <GlassView
          glassEffectStyle={effectStyle}
          tintColor={tintColor ? tintWithAlpha(tintStrength === 'soft' ? '32' : 'A0') : undefined}
          colorScheme={dark ? 'dark' : 'light'}
          isInteractive={interactive}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
        {tintColor ? <View style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: tintWithAlpha(tintStrength === 'soft' ? '12' : '38') }]} /> : null}
        {readable ? <View style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: dark ? 'rgba(15,15,24,0.32)' : 'rgba(255,255,255,0.36)' }]} /> : null}
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
          : dark ? ['rgba(255,255,255,0.12)', readable ? 'rgba(20,20,26,0.62)' : 'rgba(20,20,26,0.38)'] : ['rgba(255,255,255,0.78)', readable ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.26)']}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glassEdge, { borderRadius: radius, borderColor: edgeColor }]} />
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const theme = useAppTheme();
  return (
    <Animated.View entering={gentleTextEnter(30)} style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action ? <MotionPressable onPress={onAction}><Text style={[styles.sectionAction, { color: theme.primary }]}>{action}</Text></MotionPressable> : null}
    </Animated.View>
  );
}

export function Pill({ children, tone = 'primary' }: PropsWithChildren<{ tone?: 'primary' | 'green' | 'orange' | 'neutral' }>) {
  const theme = useAppTheme();
  const background = tone === 'green' ? `${theme.green}22` : tone === 'orange' ? `${theme.orange}22` : tone === 'neutral' ? theme.surfaceAlt : theme.primarySoft;
  const color = tone === 'green' ? theme.green : tone === 'orange' ? theme.orange : tone === 'neutral' ? theme.secondary : theme.primary;
  return <View style={[styles.pill, { backgroundColor: background }]}><Text style={[styles.pillText, { color }]}>{children}</Text></View>;
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
    <Animated.View entering={gentleTextEnter()} style={styles.empty}>
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
