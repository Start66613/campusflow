import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolateColor, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion, MotionPressable } from '@/components/motion';
import { useAppTheme } from '@/src/theme';

export function SettingToggle({ value, onValueChange, label }: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
}) {
  const theme = useAppTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: motion.standard, reduceMotion: ReduceMotion.System });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.background === '#000000' ? '#55565F' : '#D9D9E0', theme.primary]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 20 }] }));

  return (
    <MotionPressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.touchTarget}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, { shadowColor: theme.shadow }, thumbStyle]} />
      </Animated.View>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: { width: 56, height: 48, alignItems: 'center', justifyContent: 'center' },
  track: { width: 52, height: 32, borderRadius: 16, padding: 2, justifyContent: 'center' },
  thumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.16, shadowRadius: 2, elevation: 2 },
});
