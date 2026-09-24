import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { motion, MotionPressable } from '@/components/motion';
import { GlassBackdrop } from '@/components/ui';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

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
  const segmentWidth = width > 0 ? (width - 8) / items.length : 0;
  const position = useSharedValue(0);

  useEffect(() => {
    if (!segmentWidth) return;
    position.value = withSpring(selected * segmentWidth, motion.spring);
  }, [position, selected, segmentWidth]);

  const lensStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.track, { backgroundColor: glass ? 'transparent' : theme.surfaceAlt }]}>
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
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync().catch(() => undefined);
              onChange(item.value);
            }}
            style={styles.item}
          >
            {item.icon}
            <Text numberOfLines={1} style={[styles.label, { color: active ? theme.primary : theme.secondary }]}>{item.label}</Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { minHeight: 48, padding: 4, borderRadius: 18, flexDirection: 'row', alignItems: 'stretch' },
  lens: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: 15, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 7, elevation: 1 },
  item: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 3 },
  label: { fontSize: 12, fontWeight: '700' },
});
