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
  quick: 105,
  page: 190,
  standard: 225,
  reveal: 290,
  spring: { damping: 24, stiffness: 300, mass: 0.78, reduceMotion: ReduceMotion.System },
  springSoft: { damping: 25, stiffness: 225, mass: 0.8, overshootClamping: true, reduceMotion: ReduceMotion.System },
  selectionSpring: { damping: 25, stiffness: 330, mass: 0.82, reduceMotion: ReduceMotion.System },
  pressSpring: { damping: 22, stiffness: 380, mass: 0.62, reduceMotion: ReduceMotion.System },
} as const;

export const gentleEnter = (delay = 0) => new Keyframe({
  0: { transform: [{ translateY: 11 }] },
  100: { transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
}).delay(delay).duration(motion.standard).reduceMotion(ReduceMotion.System);

// Only use on content without a native GlassView ancestor.
export const gentleTextEnter = (delay = 0) => new Keyframe({
  0: { opacity: 0.65, transform: [{ translateY: 10 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
}).delay(delay).duration(motion.standard).reduceMotion(ReduceMotion.System);

export const gentleTextExit = () => new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }] },
  100: { opacity: 0, transform: [{ translateY: -5 }], easing: Easing.in(Easing.cubic) },
}).duration(160).reduceMotion(ReduceMotion.System);

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
        scale.value = withTiming(Math.max(0.965, pressedScale), { duration: motion.quick, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, motion.pressSpring);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
