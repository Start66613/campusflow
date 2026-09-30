import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

import { motion, MotionPressable } from '@/components/motion';
import { GlassBackdrop } from '@/components/ui';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import { selectionIndex, selectionPosition } from '@/src/selection-geometry';

type Segment = { value: string; label: string; icon?: ReactNode };

export function SegmentedControl({ items, value, onChange }: {
  items: Segment[];
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useAppTheme();
  const { data } = useApp();
  const glass = data.settings.visualMode === 'glass';
  const [width, setWidth] = useState(0);
  const selected = Math.max(0, items.findIndex((item) => item.value === value));
  // Never capture `items` in a worklet: icons are React elements (FiberNode).
  const values = items.map((item) => item.value);
  const count = values.length;
  const segmentWidth = width > 0 && count > 0 ? (width - 8) / count : 0;
  const position = useSharedValue(0);
  const scrubbing = useSharedValue(false);
  const lastTicked = useSharedValue(selected);
  const lastSelection = useRef({ index: -1, time: 0 });

  useEffect(() => {
    if (!segmentWidth) return;
    if (!scrubbing.value) position.value = withSpring(selected * segmentWidth, motion.selectionSpring);
  }, [position, scrubbing, selected, segmentWidth]);

  const lensStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));
  const tick = useCallback(() => { Haptics.selectionAsync().catch(() => undefined); }, []);
  const select = useCallback((index: number, withHaptic: boolean) => {
    const nextValue = values[index];
    if (!nextValue || nextValue === value) return;
    const timestamp = Date.now();
    if (lastSelection.current.index === index && timestamp - lastSelection.current.time < 280) return;
    lastSelection.current = { index, time: timestamp };
    if (withHaptic) tick();
    onChange(nextValue);
  }, [values, onChange, tick, value]);
  const selectionGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(segmentWidth > 0)
      .activeOffsetX([-7, 7])
      .failOffsetY([-12, 12])
      .onStart(() => {
        scrubbing.value = true;
        lastTicked.value = selected;
      })
      .onUpdate((event) => {
        position.value = selectionPosition(event.x, 4, segmentWidth, count) * segmentWidth;
        const index = Math.round(position.value / segmentWidth);
        if (index !== lastTicked.value) {
          lastTicked.value = index;
          runOnJS(tick)();
        }
      })
      .onEnd(() => {
        const index = Math.round(position.value / segmentWidth);
        scrubbing.value = false;
        position.value = withSpring(index * segmentWidth, motion.selectionSpring);
        runOnJS(select)(index, false);
      })
      .onFinalize((_event, success) => {
        if (!success && scrubbing.value) {
          scrubbing.value = false;
          position.value = withSpring(selected * segmentWidth, motion.selectionSpring);
        }
      });
    const tap = Gesture.Tap()
      .enabled(segmentWidth > 0)
      .maxDistance(16)
      .onEnd((event, success) => {
        if (!success) return;
        const index = selectionIndex(event.x, 4, segmentWidth, count);
        position.value = withSpring(index * segmentWidth, motion.selectionSpring);
        runOnJS(select)(index, true);
      });
    return Gesture.Race(pan, tap);
  }, [count, lastTicked, position, scrubbing, segmentWidth, select, selected, tick]);

  return (
    <GestureDetector gesture={selectionGesture}><View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.track, { backgroundColor: glass ? 'transparent' : theme.surfaceAlt }]}>
      {glass ? <GlassBackdrop radius={18} effectStyle="regular" /> : null}
      {segmentWidth > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.lens, { width: segmentWidth, backgroundColor: glass ? 'transparent' : theme.surface, shadowColor: theme.shadow }, lensStyle]}>
          {glass ? <GlassBackdrop radius={15} effectStyle="regular" tintColor={theme.primary} tintStrength="soft" /> : null}
        </Animated.View>
      ) : null}
      {items.map((item, index) => {
        const active = selected === index;
        return (
          <MotionPressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => select(index, true)}
            style={styles.item}
          >
            {item.icon}
            <SegmentLabel label={item.label} index={index} active={active} width={segmentWidth} position={position} activeColor={theme.primary} inactiveColor={theme.secondary} />
          </MotionPressable>
        );
      })}
    </View></GestureDetector>
  );
}

function SegmentLabel({ label, index, active, width, position, activeColor, inactiveColor }: {
  label: string;
  index: number;
  active: boolean;
  width: number;
  position: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}) {
  const style = useAnimatedStyle(() => {
    const progress = width > 0 ? Math.max(0, 1 - Math.abs(position.value / width - index)) : active ? 1 : 0;
    return { color: interpolateColor(progress, [0, 1], [inactiveColor, activeColor]) };
  });
  return <Animated.Text numberOfLines={1} style={[styles.label, style]}>{label}</Animated.Text>;
}

const styles = StyleSheet.create({
  track: { minHeight: 48, padding: 4, borderRadius: 18, flexDirection: 'row', alignItems: 'stretch' },
  lens: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: 15, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 7, elevation: 1 },
  item: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 3 },
  label: { fontSize: 12, fontWeight: '700' },
});
