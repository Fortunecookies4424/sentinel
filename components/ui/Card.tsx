import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { getElevation, RADIUS, SPACING } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 0 | 1 | 2 | 3 | 4;
  glass?: boolean;
  padding?: number;
}

export function Card({ children, style, elevation = 1, glass = false, padding = SPACING.lg }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: glass ? theme.glass : theme.surface,
          borderRadius: RADIUS.lg,
          padding,
          borderColor: glass ? theme.glassBorder : theme.borderLight,
          borderWidth: glass ? 1 : 0.5,
        },
        getElevation(elevation, theme),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
