import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ComponentProps } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconProps } from '@/components/app-icon';
import { GlassBackdrop } from '@/components/ui';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_SIDE } from '@/src/layout';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = Pick<AppIconProps, 'ios' | 'android' | 'fallback'>;

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
        animation: 'fade',
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
  const travel = useSharedValue(0);
  const stretch = useSharedValue(1);
  const count = state.routes.length;
  const innerWidth = Math.max(0, width - 10);
  const itemWidth = count ? innerWidth / count : 0;
  const glass = data.settings.visualMode === 'glass';

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (!itemWidth) return;
    travel.value = withSpring(state.index * itemWidth, {
      damping: 19,
      stiffness: 190,
      mass: 0.72,
      reduceMotion: ReduceMotion.System,
    });
    stretch.value = withSequence(
      withTiming(1.13, { duration: 105, reduceMotion: ReduceMotion.System }),
      withSpring(1, { damping: 12, stiffness: 230, mass: 0.42, reduceMotion: ReduceMotion.System }),
    );
  }, [itemWidth, state.index, stretch, travel]);

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
      <GlassBackdrop radius={FLOATING_TAB_BAR_HEIGHT / 2} />
      {itemWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.lens, { width: itemWidth, shadowColor: theme.shadow }, lensStyle]}
        >
          <GlassBackdrop radius={29} effectStyle="clear" tintColor={theme.primary} tintStrength="soft" />
          <View style={styles.lensRim} />
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
  lens: {
    position: 'absolute',
    left: 5,
    top: 4,
    bottom: 4,
    borderRadius: 29,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  lensRim: {
    ...StyleSheet.absoluteFill,
    borderRadius: 29,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.82)',
  },
  item: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center', gap: 1 },
  label: { fontSize: 10, letterSpacing: -0.1 },
});
