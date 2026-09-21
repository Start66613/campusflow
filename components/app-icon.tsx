import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Text, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

export type AppIconProps = {
  ios: SFSymbol;
  android: AndroidSymbol;
  color: ColorValue;
  size?: number;
  style?: StyleProp<ViewStyle>;
  fallback?: string;
  active?: boolean;
};

export function AppIcon({ ios, android, color, size = 22, style, fallback = '•', active = false }: AppIconProps) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      fallback={<Text style={{ color, fontSize: size, fontWeight: '700' }}>{fallback}</Text>}
      tintColor={color}
      size={size}
      weight="semibold"
      type={active ? 'hierarchical' : 'monochrome'}
      animationSpec={active ? { effect: { type: 'bounce', wholeSymbol: true }, repeatCount: 1, speed: 1.15 } : undefined}
      resizeMode="scaleAspectFit"
      style={style}
    />
  );
}
