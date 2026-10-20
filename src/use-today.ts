import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Refresh visible dates on midnight and on return from the background. */
export function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setToday(new Date());
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return today;
}
