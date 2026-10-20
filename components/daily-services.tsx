import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { syncDailyNotifications } from '@/src/daily-notifications';
import { useApp } from '@/src/store';

export function DailyServices() {
  const { data, hydrated } = useApp();
  const latest = useRef(data.daily);
  latest.current = data.daily;
  useEffect(() => {
    if (!hydrated || Platform.OS === 'web') return;
    const reconcile = () => { syncDailyNotifications(latest.current).catch(() => console.warn('日常提醒同步失败，请检查系统通知权限后重新打开应用')); };
    const debounce = setTimeout(reconcile, 500);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') reconcile(); });
    const today = new Date();
    const midnight = new Date(today);
    midnight.setHours(24, 0, 5, 0);
    const rollover = setTimeout(reconcile, midnight.getTime() - today.getTime());
    const renewal = setInterval(reconcile, 12 * 3600_000);
    return () => { clearTimeout(debounce); clearTimeout(rollover); clearInterval(renewal); listener.remove(); };
  }, [data.daily, hydrated]);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const redirect = (response: Notifications.NotificationResponse | null) => {
      const route = response?.notification.request.content.data?.route;
      // Only the app's two notification destinations are allowed.
      if (route === '/daily' || route === '/focus') router.push(route);
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(redirect);
    redirect(Notifications.getLastNotificationResponse());
    return () => subscription.remove();
  }, []);
  return null;
}
