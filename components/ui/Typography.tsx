import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZES, FONT_WEIGHTS, SPACING } from '@/lib/theme';
import { Icon, type IconName } from './Icon';

export function Typography({
  children,
  size = 'md',
  weight = 'regular',
  color,
  align,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  size?: keyof typeof FONT_SIZES;
  weight?: keyof typeof FONT_WEIGHTS;
  color?: string;
  align?: 'auto' | 'left' | 'center' | 'right' | 'justify';
  style?: TextStyle;
  numberOfLines?: number;
}) {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        styles.text,
        {
          fontSize: FONT_SIZES[size],
          fontWeight: FONT_WEIGHTS[weight] as unknown as '400',
          color: color ?? theme.text,
          textAlign: align,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

export function StatusBadge({
  label,
  color,
  icon,
}: {
  label: string;
  color: string;
  icon: IconName;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + '20', borderColor: color + '40' },
      ]}
    >
      <Icon name={icon} size={14} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name={icon} size={36} color={theme.textMuted} />
      </View>
      <Typography size="lg" weight="semibold" color={theme.text} align="center" style={{ marginTop: SPACING.md }}>
        {title}
      </Typography>
      {description && (
        <Typography size="sm" color={theme.textSecondary} align="center" style={{ marginTop: SPACING.xs, paddingHorizontal: SPACING.xl }}>
          {description}
        </Typography>
      )}
      {action && <View style={{ marginTop: SPACING.lg }}>{action}</View>}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  actionLabel,
}: {
  title: string;
  action?: () => void;
  actionLabel?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Typography size="md" weight="semibold" color={theme.text}>
        {title}
      </Typography>
      {action && actionLabel && (
        <PressableText onPress={action} color={theme.accent}>
          {actionLabel}
        </PressableText>
      )}
    </View>
  );
}

import { Pressable } from 'react-native';

export function PressableText({
  children,
  onPress,
  color,
  size = 'sm',
  weight = 'medium',
}: {
  children: React.ReactNode;
  onPress: () => void;
  color: string;
  size?: keyof typeof FONT_SIZES;
  weight?: keyof typeof FONT_WEIGHTS;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Text style={{ fontSize: FONT_SIZES[size], fontWeight: FONT_WEIGHTS[weight] as unknown as '400', color }}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    lineHeight: 22,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold as unknown as '600',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
});
