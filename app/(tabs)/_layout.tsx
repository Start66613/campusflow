import { Tabs } from 'expo-router';
import { GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconProps } from '@/components/app-icon';
import { motion } from '@/components/motion';
import { GlassBackdrop } from '@/components/ui';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_SIDE } from '@/src/layout';
import { selectionTick } from '@/src/native-motion';
import { selectionIndex, selectionPosition } from '@/src/selection-geometry';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';
import { useReduceTransparency } from '@/src/accessibility';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = Pick<AppIconProps, 'ios' | 'android' | 'fallback'>;
const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

const tabs: Record<string, { title: string; icon: IconName }> = {
  index: { title: '首页', icon: { ios: 'house.fill', android: 'home', fallback: '⌂' } },
  schedule: { title: '课表', icon: { ios: 'calendar', android: 'calendar_month', fallback: '□' } },
  assistant: { title: 'AI 记', icon: { ios: 'sparkles', android: 'auto_awesome', fallback: '✦' } },
  insights: { title: '数据', icon: { ios: 'chart.bar.fill', android: 'bar_chart', fallback: '▥' } },
  profile: { title: '我的', icon: { ios: 'person.crop.circle', android: 'person', fallback: '○' } },
};

export default function TabLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '首页' }} />
      <Tabs.Screen name="schedule" options={{ title: '课表' }} />
      <Tabs.Screen name="assistant" options={{ title: 'AI 记' }} />
      <Tabs.Screen name="insights" options={{ title: '数据' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
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
  const lastSelection = useRef({ index: -1, time: 0 });
  const travel = useSharedValue(0);
  const scrubbing = useSharedValue(false);
  const lastTicked = useSharedValue(state.index);
  // Gesture worklets must capture this primitive, not the navigation state.
  const selectedIndex = state.index;
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
    if (!scrubbing.value) travel.value = withSpring(state.index * itemWidth, motion.selectionSpring);
  }, [itemWidth, scrubbing, state.index, travel]);

  const lensStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: travel.value }],
  }));
  const tick = useCallback(selectionTick, []);
  const selectTab = useCallback((index: number, withHaptic: boolean) => {
    const route = state.routes[index];
    if (!route) return;
    const timestamp = Date.now();
    if (lastSelection.current.index === index && timestamp - lastSelection.current.time < 280) return;
    lastSelection.current = { index, time: timestamp };
    if (state.index === index) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) {
      travel.value = withSpring(state.index * itemWidth, motion.selectionSpring);
      return;
    }
    if (withHaptic) tick();
    navigation.navigate(route.name, route.params);
  }, [itemWidth, navigation, state.index, state.routes, tick, travel]);
  const barGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(itemWidth > 0)
      .activeOffsetX([-7, 7])
      .failOffsetY([-14, 14])
      .onStart(() => {
        scrubbing.value = true;
        lastTicked.value = selectedIndex;
      })
      .onUpdate((event) => {
        const position = selectionPosition(event.x, 5, itemWidth, count);
        travel.value = position * itemWidth;
        const index = Math.round(position);
        if (index !== lastTicked.value) {
          lastTicked.value = index;
          runOnJS(tick)();
        }
      })
      .onEnd(() => {
        const index = Math.round(travel.value / itemWidth);
        scrubbing.value = false;
        travel.value = withSpring(index * itemWidth, motion.selectionSpring);
        runOnJS(selectTab)(index, false);
      })
      .onFinalize((_event, success) => {
        if (!success && scrubbing.value) {
          scrubbing.value = false;
          travel.value = withSpring(selectedIndex * itemWidth, motion.selectionSpring);
        }
      });
    const tap = Gesture.Tap()
      .enabled(itemWidth > 0)
      .maxDistance(16)
      .maxDuration(400)
      .onEnd((event, success) => {
        if (!success) return;
        const index = selectionIndex(event.x, 5, itemWidth, count);
        travel.value = withSpring(index * itemWidth, motion.selectionSpring);
        runOnJS(selectTab)(index, true);
      });
    return Gesture.Race(pan, tap);
  }, [count, itemWidth, lastTicked, scrubbing, selectTab, selectedIndex, tick, travel]);
  if (keyboardVisible) return null;

  return (
    <GestureDetector gesture={barGesture}><View
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
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={item.title}
            onPress={() => selectTab(index, true)}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={styles.item}
          >
            <TabItemVisual item={item} index={index} focused={focused} itemWidth={itemWidth} travel={travel} activeColor={theme.primary} inactiveColor={theme.secondary} />
          </Pressable>
        );
      })}
    </View></GestureDetector>
  );
}

function TabItemVisual({ item, index, focused, itemWidth, travel, activeColor, inactiveColor }: {
  item: { title: string; icon: IconName };
  index: number;
  focused: boolean;
  itemWidth: number;
  travel: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}) {
  const activeStyle = useAnimatedStyle(() => ({
    opacity: itemWidth > 0 ? Math.max(0, 1 - Math.abs(travel.value / itemWidth - index)) : focused ? 1 : 0,
  }));
  const labelStyle = useAnimatedStyle(() => {
    const progress = itemWidth > 0 ? Math.max(0, 1 - Math.abs(travel.value / itemWidth - index)) : focused ? 1 : 0;
    return { color: interpolateColor(progress, [0, 1], [inactiveColor, activeColor]) };
  });
  return <>
    <View style={styles.iconSlot}>
      <AppIcon {...item.icon} color={inactiveColor} size={22} />
      <Animated.View pointerEvents="none" style={[styles.activeIcon, activeStyle]}><AppIcon {...item.icon} color={activeColor} size={22} active /></Animated.View>
    </View>
    <Animated.Text style={[styles.label, labelStyle]}>{item.title}</Animated.Text>
  </>;
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
  iconSlot: { width: 28, height: 25, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: -0.1 },
});
