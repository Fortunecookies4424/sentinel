import { useTheme } from './ThemeProvider';
import { StyleSheet } from 'react-native';
import type { Theme } from '@/lib/theme';
import { lightTheme } from '@/lib/theme';

export function createThemedStyles<T extends Record<string, any>>(
  factory: (theme: Theme) => T
): { styles: T; theme: Theme } {
  // This is a placeholder - the real usage is via useThemedStyles below
  const theme = lightTheme;
  return { styles: StyleSheet.create(factory(theme)) as T, theme };
}

export function useThemedStyles<T extends Record<string, any>>(
  factory: (theme: Theme) => T
): { styles: T; theme: Theme } {
  const { theme } = useTheme();
  return { styles: StyleSheet.create(factory(theme)) as T, theme };
}
