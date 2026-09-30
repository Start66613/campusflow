import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { type PropsWithChildren, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { AppIcon } from '@/components/app-icon';
import { gentleLayout, gentleTextEnter, MotionPressable } from '@/components/motion';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_CONTENT_GAP } from '@/src/layout';
import { useApp } from '@/src/store';
import { radii, useAppTheme } from '@/src/theme';
import { useReduceTransparency } from '@/src/accessibility';

export function Screen({ children, scroll = true, scrollEnabled = true, style }: PropsWithChildren<{ scroll?: boolean; scrollEnabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const content = scroll ? (
    <ScrollView scrollEnabled={scrollEnabled} bounces contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.scroll, { paddingBottom: FLOATING_TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + FLOATING_TAB_CONTENT_GAP }]} showsVerticalScrollIndicator={false}>
      <View style={style}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.fill, style]}>{children}</View>
  );
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}>
      <AppBackdrop />
      {content}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress, glassSurface = true, animateLayout = true }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; onPress?: () => void; glassSurface?: boolean; animateLayout?: boolean }>) {
  const theme = useAppTheme();
  const { data } = useApp();
  const glass = data.settings.visualMode === 'glass';
  const showGlass = glass && glassSurface;
  const cardStyle = [styles.card, { backgroundColor: showGlass ? 'transparent' : theme.surface, borderWidth: 0, shadowColor: theme.shadow, shadowOpacity: showGlass ? 0 : 0.045, elevation: showGlass ? 0 : 2 }, style];
  if (onPress) {
    return (
      <MotionPressable onPress={onPress} style={cardStyle}>
        {showGlass ? <GlassBackdrop radius={radii.card} effectStyle="regular" readable /> : null}
        {children}
      </MotionPressable>
    );
  }
  return <Animated.View layout={animateLayout ? gentleLayout : undefined} style={cardStyle}>{showGlass ? <GlassBackdrop radius={radii.card} effectStyle="regular" readable /> : null}{children}</Animated.View>;
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
        <View style={[styles.glassTopEdge, { backgroundColor: edgeColor }]} />
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
      <View style={[styles.glassTopEdge, { backgroundColor: edgeColor }]} />
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

export function EmptyState({ title, body }: { emoji?: string; title: string; body: string }) {
  const theme = useAppTheme();
  return (
    <Animated.View entering={gentleTextEnter()} style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}><AppIcon ios="tray" android="inbox" color={theme.primary} size={27} /></View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: theme.secondary }]}>{body}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 2 },
  card: {
    borderRadius: radii.card,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 22,
  },
  glassClip: { overflow: 'hidden' },
  glassEdge: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderWidth: StyleSheet.hairlineWidth },
  glassTopEdge: { position: 'absolute', top: 1, left: 16, right: 16, height: StyleSheet.hairlineWidth, opacity: 0.42 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '600' },
  sectionAction: { fontSize: 14, fontWeight: '600' },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '600' },
  button: { minHeight: 52, paddingHorizontal: 18, borderRadius: 17, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 28 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
