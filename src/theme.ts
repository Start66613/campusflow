import { useColorScheme } from 'react-native';

import { useApp } from './store';
import type { AccentPreset } from './types';

export const courseColors = ['#5B67F1', '#23A89A', '#F28A5B', '#A35BD8', '#E25574', '#4D8ED8'];

export const lightTheme = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  // An overlay fill stays visible both on the gray page and inside white cards.
  surfaceAlt: 'rgba(118,118,128,0.12)',
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
  secondary: '#6B7168',
  green: '#39805E',
  orange: '#A96C18',
  red: '#BB5250',
  tab: 'rgba(255,253,242,0.82)',
};

export const radii = {
  card: 28,
  control: 17,
  compact: 13,
  round: 999,
} as const;

export const rainbowGradient = ['#7059D8', '#3EAFE0', '#39B891'] as const;

export type AppTheme = typeof lightTheme;

export const accentOptions: { value: AccentPreset; label: string; swatch: string }[] = [
  { value: 'purple', label: '紫色', swatch: '#5E5CE6' },
  { value: 'blue', label: '蓝色', swatch: '#176BD8' },
  { value: 'mint', label: '浅绿', swatch: '#168B72' },
  { value: 'sky', label: '浅蓝', swatch: '#1687C9' },
  { value: 'black', label: '黑色', swatch: '#242428' },
  { value: 'coral', label: '珊瑚', swatch: '#DA5B68' },
  { value: 'rainbow', label: '炫彩', swatch: '#7C5CE8' },
];

const accentColors: Record<AccentPreset, { primary: string; soft: string; darkPrimary: string; darkSoft: string }> = {
  purple: { primary: '#5E5CE6', soft: '#EEEEFF', darkPrimary: '#7D7AFF', darkSoft: '#30305E' },
  blue: { primary: '#176BD8', soft: '#E8F1FF', darkPrimary: '#559DFF', darkSoft: '#193456' },
  mint: { primary: '#168B72', soft: '#E4F5EE', darkPrimary: '#48C9A4', darkSoft: '#184B40' },
  sky: { primary: '#1687C9', soft: '#E5F5FF', darkPrimary: '#56B8EC', darkSoft: '#1A4051' },
  black: { primary: '#242428', soft: '#E8E8EB', darkPrimary: '#63636B', darkSoft: '#303034' },
  coral: { primary: '#CF5165', soft: '#FFEAF0', darkPrimary: '#F47E91', darkSoft: '#542B37' },
  rainbow: { primary: '#7059D8', soft: '#F0EAFF', darkPrimary: '#9C85F5', darkSoft: '#3D315E' },
};

export function useAppTheme(): AppTheme {
  const system = useColorScheme();
  const { data } = useApp();
  if (data.settings.jiahaoMode) return {
    ...darkTheme,
    background: '#000000', surface: '#1C1830', surfaceAlt: '#312846',
    line: '#50446B', primary: '#BFA3FF', primarySoft: '#362957',
    secondary: '#B8ACCA', tab: 'rgba(25,19,43,0.88)',
  };
  const base = data.settings.themeMode === 'eye' ? eyeTheme
    : data.settings.themeMode === 'dark' ? darkTheme
      : data.settings.themeMode === 'light' ? lightTheme
        : system === 'dark' ? darkTheme : lightTheme;
  const accent = accentColors[data.settings.accentPreset ?? 'purple'] ?? accentColors.purple;
  const dark = base.background === '#000000';
  return { ...base, primary: dark ? accent.darkPrimary : accent.primary, primarySoft: dark ? accent.darkSoft : accent.soft };
}
