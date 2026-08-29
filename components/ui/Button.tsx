import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import { RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import { Icon, type IconName } from './Icon';
import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/themeStore';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: theme.primary, text: theme.textInverse, border: 'transparent' };
      case 'secondary':
        return { bg: theme.surface, text: theme.text, border: theme.border };
      case 'danger':
        return { bg: theme.danger, text: '#FFFFFF', border: 'transparent' };
      case 'success':
        return { bg: theme.success, text: '#FFFFFF', border: 'transparent' };
      case 'ghost':
        return { bg: 'transparent', text: theme.primary, border: 'transparent' };
      case 'outline':
        return { bg: 'transparent', text: theme.primary, border: theme.primary };
    }
  };

  const colors = getColors();
  const sizeConfig = {
    sm: { height: 38, fontSize: FONT_SIZES.sm, iconSize: 16, paddingH: SPACING.md },
    md: { height: 48, fontSize: FONT_SIZES.md, iconSize: 20, paddingH: SPACING.lg },
    lg: { height: 56, fontSize: FONT_SIZES.lg, iconSize: 22, paddingH: SPACING.xl },
  };
  const sc = sizeConfig[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          height: sc.height,
          paddingHorizontal: sc.paddingH,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderRadius: RADIUS.md,
          opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Icon name={icon} size={sc.iconSize} color={colors.text} />
          )}
          <Text
            style={[
              styles.label,
              { color: colors.text, fontSize: sc.fontSize },
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon name={icon} size={sc.iconSize} color={colors.text} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontWeight: FONT_WEIGHTS.semibold as unknown as '600',
    letterSpacing: 0.3,
  },
});

// Touchable ripple wrapper for general pressable surfaces
export function RipplePressable({
  children,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const reduceMotion = useThemeStore.getState();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
