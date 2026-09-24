import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// One motion language for navigation, controls, and content. Keep frequent
// interactions short; the spring only settles the last few pixels.
export const motion = {
  quick: 150,
  standard: 240,
  reveal: 300,
  spring: { damping: 22, stiffness: 270, mass: 0.72, reduceMotion: ReduceMotion.System },
} as const;

export const gentleEnter = (delay = 0) => new Keyframe({
  0: { transform: [{ translateY: 8 }] },
  100: { transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
}).delay(delay).duration(motion.standard).reduceMotion(ReduceMotion.System);

export const gentleLayout = LinearTransition
  .springify()
  .damping(motion.spring.damping)
  .stiffness(motion.spring.stiffness)
  .reduceMotion(ReduceMotion.System);

type MotionPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

export function MotionPressable({
  children,
  style,
  pressedScale = 0.982,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: PropsWithChildren<MotionPressableProps>) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        // A large shrink reads as a bounce, especially on small toolbar icons.
        scale.value = withTiming(Math.max(0.965, pressedScale), { duration: motion.quick, reduceMotion: ReduceMotion.System });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, motion.spring);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
