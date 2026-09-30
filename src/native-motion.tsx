import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Haptics from 'expo-haptics';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

// Expo Go does not ship third-party native modules. Keep its test path on Expo APIs.
export const hasCustomNativeRuntime = Platform.OS !== 'web'
  && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export function OptionalHapticProvider({ children }: PropsWithChildren) {
  if (Platform.OS === 'ios' && hasCustomNativeRuntime) {
    try {
      const { HapticProvider } = require('@renegades/react-native-tickle') as typeof import('@renegades/react-native-tickle');
      return <HapticProvider>{children}</HapticProvider>;
    } catch {
      // An older development build may not contain the new native module yet.
    }
  }
  return <>{children}</>;
}

export function selectionTick() {
  if (Platform.OS === 'ios' && hasCustomNativeRuntime) {
    try {
      const { startHaptic } = require('@renegades/react-native-tickle') as typeof import('@renegades/react-native-tickle');
      startHaptic([{
        type: 'transient',
        relativeTime: 0,
        parameters: [{ type: 'intensity', value: 0.32 }, { type: 'sharpness', value: 0.48 }],
      }], []);
      return;
    } catch {
      // Preserve feedback if the custom native module is absent or unavailable.
    }
  }
  Haptics.selectionAsync().catch(() => undefined);
}
