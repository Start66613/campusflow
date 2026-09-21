import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const gentleEnter = (delay = 0) => FadeIn
  .delay(delay)
  .duration(190)
  .reduceMotion(ReduceMotion.System);

export const gentleLayout = LinearTransition
  .springify()
  .damping(19)
  .stiffness(180)
  .reduceMotion(ReduceMotion.System);

type MotionPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

export function MotionPressable({
  children,
  style,
  pressedScale = 0.985,
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
        scale.value = withSpring(pressedScale, { damping: 20, stiffness: 360, mass: 0.32, reduceMotion: ReduceMotion.System });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 300, mass: 0.38, reduceMotion: ReduceMotion.System });
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
