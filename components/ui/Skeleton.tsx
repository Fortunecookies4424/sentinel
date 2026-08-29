import { StyleSheet, View, type DimensionValue } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { RADIUS, SPACING } from '@/lib/theme';

export function Skeleton({ width, height, radius = RADIUS.sm }: { width: DimensionValue; height: DimensionValue; radius?: number }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,42,74,0.06)',
        borderRadius: radius,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: SPACING.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
});
