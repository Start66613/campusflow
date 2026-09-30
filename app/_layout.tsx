import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppProvider, useApp } from '@/src/store';
import { OptionalHapticProvider } from '@/src/native-motion';
import { useAppTheme } from '@/src/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <GestureHandlerRootView style={{ flex: 1 }}><OptionalHapticProvider><AppProvider><RootLayoutNav /></AppProvider></OptionalHapticProvider></GestureHandlerRootView>;
}

function RootLayoutNav() {
  const { data } = useApp();
  const theme = useAppTheme();
  const dark = data.settings.themeMode === 'dark' || (data.settings.themeMode === 'system' && theme.background === '#000000');
  const navigationTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.surface,
      border: theme.line,
      primary: theme.primary,
      text: theme.text,
      notification: theme.red,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} animated />
      <Stack screenOptions={{
        animation: 'fade_from_bottom',
        gestureEnabled: true,
        contentStyle: { backgroundColor: theme.background },
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.primary,
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.text, fontWeight: '600' },
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="import" options={{ title: '导入课表', presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="school" options={{ title: '湘潭大学教务', presentation: 'modal', animation: 'slide_from_right' }} />
        <Stack.Screen name="ai-settings" options={{ title: '个人 AI', presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="focus" options={{ title: '专注计时', presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="personalize" options={{ title: '个性化', presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="course-editor" options={{ title: '编辑课程', presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal" options={{ title: '关于 CampusFlow', presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </ThemeProvider>
  );
}
