import { Platform } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
  hero: 48,
} as const;

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  glass: string;
  glassBorder: string;
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  // Semantic
  danger: string;
  dangerDark: string;
  dangerLight: string;
  success: string;
  successDark: string;
  successLight: string;
  warning: string;
  warningDark: string;
  accent: string;
  // Borders & misc
  border: string;
  borderLight: string;
  overlay: string;
  // Shadows
  shadow: string;
  shadowColor: string;
}

export const lightTheme: Theme = {
  mode: 'light',
  background: '#F0F4FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.9)',
  text: '#0A1628',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  primary: '#0F2A4A',
  primaryDark: '#061730',
  primaryLight: '#1E4178',
  danger: '#DC2626',
  dangerDark: '#991B1B',
  dangerLight: '#FEE2E2',
  success: '#059669',
  successDark: '#065F46',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningDark: '#92400E',
  accent: '#2563EB',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  overlay: 'rgba(10,22,40,0.5)',
  shadow: 'rgba(15,42,74,0.08)',
  shadowColor: '#0F2A4A',
};

export const darkTheme: Theme = {
  mode: 'dark',
  background: '#061730',
  surface: '#0F2A4A',
  surfaceElevated: '#15365E',
  glass: 'rgba(15,42,74,0.65)',
  glassBorder: 'rgba(255,255,255,0.12)',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#0A1628',
  primary: '#1E4178',
  primaryDark: '#0F2A4A',
  primaryLight: '#2D5A9F',
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerLight: 'rgba(239,68,68,0.15)',
  success: '#10B981',
  successDark: '#059669',
  successLight: 'rgba(16,185,129,0.15)',
  warning: '#F59E0B',
  warningDark: '#D97706',
  accent: '#3B82F6',
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.06)',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.3)',
  shadowColor: '#000000',
};

export function getElevation(elevation: number, theme: Theme) {
  if (Platform.OS === 'web') {
    const map: Record<number, { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number }> = {
      0: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
      1: { shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      2: { shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      3: { shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      4: { shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
    };
    return map[elevation] ?? map[2];
  }
  const map: Record<number, { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number }> = {
    0: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 1 },
    2: { shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 2 },
    3: { shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
    4: { shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 8 },
  };
  return map[elevation] ?? map[2];
}
