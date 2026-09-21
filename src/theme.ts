import { useColorScheme } from 'react-native';

import { useApp } from './store';

export const courseColors = ['#5B67F1', '#23A89A', '#F28A5B', '#A35BD8', '#E25574', '#4D8ED8'];

export const lightTheme = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F2F7',
  text: '#1C1C1E',
  secondary: '#8E8E93',
  line: '#E5E5EA',
  primary: '#5E5CE6',
  primarySoft: '#EEEEFF',
  green: '#30A46C',
  orange: '#FF9F0A',
  red: '#FF453A',
  shadow: '#000000',
  tab: 'rgba(249,249,249,0.78)',
};

export const darkTheme = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceAlt: '#2C2C2E',
  text: '#F2F2F7',
  secondary: '#98989D',
  line: '#38383A',
  primary: '#7D7AFF',
  primarySoft: '#30305E',
  green: '#30D158',
  orange: '#FF9F0A',
  red: '#FF453A',
  shadow: '#000000',
  tab: 'rgba(28,28,30,0.78)',
};

export const eyeTheme = {
  ...lightTheme,
  background: '#F3F1E4',
  surface: '#FFFDF2',
  surfaceAlt: '#EDEADC',
  line: '#DEDAC8',
  primary: '#4F725E',
  primarySoft: '#DFEBDD',
  tab: 'rgba(255,253,242,0.82)',
};

export const radii = {
  card: 26,
  control: 17,
  compact: 13,
  round: 999,
} as const;

export type AppTheme = typeof lightTheme;

export function useAppTheme(): AppTheme {
  const system = useColorScheme();
  const { data } = useApp();
  if (data.settings.themeMode === 'eye') return eyeTheme;
  if (data.settings.themeMode === 'dark') return darkTheme;
  if (data.settings.themeMode === 'light') return lightTheme;
  return system === 'dark' ? darkTheme : lightTheme;
}
