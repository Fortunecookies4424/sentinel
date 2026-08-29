import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, SectionList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Typography, EmptyState } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/lib/stores/authStore';
import { fetchActivity } from '@/lib/db/activity';
import { ACTIVITY_META, type ActivityLogEntry } from '@/types';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function ActivityScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sos' | 'location' | 'check_in'>('all');

  const loadActivity = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchActivity(user.id, 100);
      setActivity(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const filtered = activity.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'sos') return item.type.startsWith('sos');
    if (filter === 'location') return item.type === 'location_shared';
    if (filter === 'check_in') return item.type.startsWith('check_in');
    return true;
  });

  // Group by date
  const sections = filtered.reduce<Record<string, ActivityLogEntry[]>>((acc, item) => {
    const label = getDateLabel(item.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  const sectionData = Object.entries(sections).map(([title, data]) => ({ title, data }));

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'sos', label: 'SOS' },
    { value: 'location', label: 'Location' },
    { value: 'check_in', label: 'Check-Ins' },
  ];

  const renderItem = ({ item, index }: { item: ActivityLogEntry; index: number }) => {
    const meta = ACTIVITY_META[item.type as keyof typeof ACTIVITY_META] ?? { color: theme.textMuted, icon: 'activity' };
    return (
      <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
        <Card elevation={1} padding={SPACING.md} style={{ marginBottom: SPACING.sm + 2 }}>
          <View style={styles.timelineRow}>
            <View style={[styles.timelineIcon, { backgroundColor: meta.color + '18' }]}>
              <Icon name={meta.icon as IconName} size={18} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography size="sm" weight="semibold" color={theme.text}>{item.title}</Typography>
              {item.description && (
                <Typography size="xs" color={theme.textSecondary} style={{ marginTop: 2 }}>{item.description}</Typography>
              )}
              <Typography size="xs" color={theme.textMuted} style={{ marginTop: 4 }}>{getRelativeTime(item.created_at)}</Typography>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Activity" subtitle="Your safety timeline" large />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={[
              styles.filterChip,
              { backgroundColor: filter === f.value ? theme.primary : theme.surface, borderColor: filter === f.value ? theme.primary : theme.border },
            ]}
          >
            <Typography
              size="xs"
              weight="medium"
              color={filter === f.value ? '#FFFFFF' : theme.textSecondary}
            >
              {f.label}
            </Typography>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.md }}>
          <ListSkeleton count={5} />
        </View>
      ) : sectionData.length === 0 ? (
        <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
          <EmptyState
            icon="activity"
            title="No activity yet"
            description="Your safety events, SOS activations, location shares, and check-ins will appear here in a timeline."
          />
        </View>
      ) : (
        <SectionList
          sections={sectionData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <Typography size="sm" weight="semibold" color={theme.textSecondary} style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm }}>
              {title}
            </Typography>
          )}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 100, borderWidth: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  timelineIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
