import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';

import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

// Render this inside the visible screen, not behind the native navigator:
// native-stack can paint an opaque scene over a root-level wallpaper on iOS.
export function AppBackdrop() {
  const theme = useAppTheme();
  const { data } = useApp();
  const glass = data.settings.visualMode === 'glass';
  const dark = theme.background === '#000000';

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      {data.settings.backgroundUri ? (
        <Image
          source={{ uri: data.settings.backgroundUri }}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { opacity: Math.min(0.82, Math.max(0.12, data.settings.backgroundOpacity ?? 0.42)) }]}
        />
      ) : glass ? (
        <Image
          source={require('../assets/images/glass-wallpaper-v1.png')}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { opacity: dark ? 0.14 : 0.82 }]}
        />
      ) : null}
      <LinearGradient
        colors={dark ? ['rgba(0,0,0,0.88)', 'rgba(10,10,18,0.82)', '#000000'] : glass ? ['rgba(242,242,247,0.10)', 'rgba(255,255,255,0.04)', 'rgba(242,242,247,0.20)'] : [theme.background, `${theme.primary}0B`, theme.background]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      {data.settings.accentPreset === 'rainbow' ? <LinearGradient colors={['rgba(170,108,247,0.12)', 'rgba(93,191,248,0.09)', 'rgba(75,207,159,0.10)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
      <View style={[styles.ambientOrb, styles.ambientOrbTop, { backgroundColor: `${theme.primary}0A` }]} />
      <View style={[styles.ambientOrb, styles.ambientOrbBottom, { backgroundColor: `${theme.green}08` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ambientOrb: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  ambientOrbTop: { top: -120, right: -105 },
  ambientOrbBottom: { bottom: 90, left: -160 },
});
