import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useState } from 'react';

/** Mirrors the public iOS accessibility switch; iOS 27's Liquid Glass slider is system-owned. */
export function useReduceTransparency() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((value) => { if (mounted) setEnabled(value); })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setEnabled);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  return enabled;
}
