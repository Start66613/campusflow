import { Tabs } from 'expo-router';
import { GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconProps } from '@/components/app-icon';
import { GlassBackdrop } from '@/components/ui';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_SIDE } from '@/src/layout';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import { useReduceTransparency } from '@/src/accessibility';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = Pick<AppIconProps, 'ios' | 'android' | 'fallback'>;
const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

const tabs: Record<string, { title: string; icon: IconName }> = {
  index: { title: '棣栭〉', icon: { ios: 'house.fill', android: 'home', fallback: '鈱? } },
  schedule: { title: '璇捐〃', icon: { ios: 'calendar', android: 'calendar_month', fallback: '鈻? } },
  assistant: { title: 'AI 璁?, icon: { ios: 'sparkles', android: 'auto_awesome', fallback: '鉁? } },
  insights: { title: '鏁版嵁', icon: { ios: 'chart.bar.fill', android: 'bar_chart', fallback: '鈻? } },
  profile: { title: '鎴戠殑', icon: { ios: 'person.crop.circle', android: 'person', fallback: '鈼? } },
};

export default function TabLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '棣栭〉' }} />
      <Tabs.Screen name="schedule" options={{ title: '璇捐〃' }} />
      <Tabs.Screen name="assistant" options={{ title: 'AI 璁? }} />
      <Tabs.Screen name="insights" options={{ title: '鏁版嵁' }} />
      <Tabs.Screen name="profile" options={{ title: '鎴戠殑' }} />
    </Tabs>
  );
}

function LiquidTabBar({ state, navigation }: TabBarProps) {
  const theme = useAppTheme();
  const { data } = useApp();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const previousIndex = useRef(state.index);
  const measured = useRef(false);
  const reducedMotion = useReducedMotion();
  const travel = useSharedValue(0);
  const stretch = useSharedValue(1);
  const count = state.routes.length;
  const innerWidth = Math.max(0, width - 10);
  const itemWidth = count ? innerWidth / count : 0;
  const glass = data.settings.visualMode === 'glass';
  const reduceTransparency = useReduceTransparency();
  const nativeGlass = glass && !reduceTransparency && Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const dark = theme.background === '#000000';

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (!itemWidth) return;
    if (!measured.current || state.index === previousIndex.current) {
      travel.value = state.index * itemWidth;
      previousIndex.current = state.index;
      measured.current = true;
      return;
    }
    previousIndex.current = state.index;
    travel.value = withSpring(state.index * itemWidth, {
      damping: 18,
      stiffness: 205,
      mass: 0.82,
      reduceMotion: ReduceMotion.System,
    });
    stretch.value = withSequence(
      withTiming(1.3, { duration: 115, reduceMotion: ReduceMotion.System }),
      withSpring(1, { damping: 11, stiffness: 220, mass: 0.48, reduceMotion: ReduceMotion.System }),
    );
  }, [glass, itemWidth, reducedMotion, state.index, stretch, travel]);

  const lensStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: travel.value }, { scaleX: stretch.value }, { scaleY: 1 - (stretch.value - 1) * 0.2 }],
  }));
  if (keyboardVisible) return null;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.bar,
        {
          bottom: Math.max(insets.bottom, 8),
          shadowColor: theme.shadow,
          shadowOpacity: glass ? 0.13 : 0.08,
        },
      ]}
    >
      {nativeGlass ? (
        <>
          <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme={dark ? 'dark' : 'light'} style={styles.nativeBar} />
          <GlassContainer pointerEvents="none" spacing={18} style={StyleSheet.absoluteFill}>
            {itemWidth > 0 ? (
              <AnimatedGlassView
                glassEffectStyle="regular"
                colorScheme={dark ? 'dark' : 'light'}
                tintColor={`${theme.primary}5C`}
                style={[styles.lens, { width: itemWidth }, lensStyle]}
              />
            ) : null}
        </GlassContainer>
        </>
      ) : (
        <>
          <GlassBackdrop radius={FLOATING_TAB_BAR_HEIGHT / 2} />
          {itemWidth > 0 ? (
            <Animated.View pointerEvents="none" style={[styles.lens, { width: itemWidth }, lensStyle]}>
              <GlassBackdrop radius={29} effectStyle="clear" tintColor={theme.primary} tintStrength="soft" />
            </Animated.View>
          ) : null}
        </>
      )}
      {itemWidth > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.lensOptics, { width: itemWidth, borderColor: dark ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.82)' }, lensStyle]}>
          {glass && !reduceTransparency ? <LinearGradient colors={dark ? ['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.01)', 'rgba(255,255,255,0.06)'] : ['rgba(255,255,255,0.38)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.12)']} locations={[0, 0.58, 1]} start={{ x: 0.06, y: 0 }} end={{ x: 0.94, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
          {glass && !reduceTransparency ? <LinearGradient colors={dark ? ['rgba(255,255,255,0.42)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.76)', 'rgba(255,255,255,0)']} style={styles.specular} /> : null}
        </Animated.View>
      ) : null}
      {state.routes.map((route, index) => {
        const item = tabs[route.name] ?? tabs.index;
        const focused = state.index === index;
        const color = focused ? theme.primary : theme.secondary;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={item.title}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync().catch(() => undefined);
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={styles.item}
          >
            <AppIcon {...item.icon} color={color} size={focused ? 23 : 22} active={focused} />
            <Text style={[styles.label, { color, fontWeight: focused ? '700' : '600' }]}>{item.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: FLOATING_TAB_BAR_SIDE,
    right: FLOATING_TAB_BAR_SIDE,
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: FLOATING_TAB_BAR_HEIGHT / 2,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 9 },
    shadowRadius: 22,
    elevation: 12,
  },
  nativeBar: {
    ...StyleSheet.absoluteFill,
    borderRadius: FLOATING_TAB_BAR_HEIGHT / 2,
  },
  lens: {
    position: 'absolute',
    left: 5,
    top: 4,
    bottom: 4,
    borderRadius: 29,
  },
  lensOptics: {
    position: 'absolute',
    left: 5,
    top: 4,
    bottom: 4,
    borderRadius: 29,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  specular: { position: 'absolute', left: 12, top: 2, width: 46, height: 13, borderRadius: 999, transform: [{ rotate: '-7deg' }] },
  item: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center', gap: 1 },
  label: { fontSize: 10, letterSpacing: -0.1 },
});
