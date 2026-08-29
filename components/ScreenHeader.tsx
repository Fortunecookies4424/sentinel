import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { Pressable } from 'react-native';
import { SPACING } from '@/lib/theme';

export function ScreenHeader({
  title,
  subtitle,
  showBack,
  onBack,
  rightIcon,
  onRightPress,
  large,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  large?: boolean;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm, backgroundColor: theme.background }]}>
      <View style={styles.row}>
        {showBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 }]}
            hitSlop={12}
          >
            <Icon name="chevron-left" size={22} color={theme.text} />
          </Pressable>
        )}
        <View style={styles.titleWrap}>
          <Typography
            size={large ? 'xxl' : 'xl'}
            weight="bold"
            color={theme.text}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography size="sm" color={theme.textSecondary} style={{ marginTop: 2 }}>
              {subtitle}
            </Typography>
          )}
        </View>
        {rightIcon && (
          <Pressable
            onPress={onRightPress}
            style={({ pressed }) => [styles.rightBtn, { backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 }]}
            hitSlop={12}
          >
            <Icon name={rightIcon} size={20} color={theme.text} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  rightBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
