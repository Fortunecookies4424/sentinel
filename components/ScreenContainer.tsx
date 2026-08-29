import { StyleSheet, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { SPACING } from '@/lib/theme';

export function ScreenContainer({
  children,
  scroll = true,
  header,
  padding = SPACING.lg,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  header?: React.ReactNode;
  padding?: number;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View style={{ paddingBottom: insets.bottom + SPACING.lg, paddingHorizontal: padding, flex: 1 }}>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {header}
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
