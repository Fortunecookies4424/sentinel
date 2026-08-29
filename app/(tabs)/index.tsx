import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Typography, StatusBadge } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useSOSStore } from '@/lib/stores/sosStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { useDeviceStatus } from '@/lib/useDeviceStatus';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import { Pressable, Linking } from 'react-native';

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const deviceStatus = useDeviceStatus();
  const { phase, startCountdown, countdown } = useSOSStore();
  const { user, profile } = useAuthStore();

  // Navigate to SOS active screen when phase changes
  useEffect(() => {
    if (phase === 'countdown' || phase === 'active') {
      router.push('/sos-active');
    }
  }, [phase]);

  const [contactsCount, setContactsCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    import('@/lib/supabase').then(async ({ supabase }) => {
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setContactsCount(count ?? 0);

      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentActivity(data ?? []);
    });
  }, [user]);

  // Pulse animation for SOS button
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0.4, 0.15, 0.4]),
  }));

  const handleSOSPress = () => {
    startCountdown();
  };

  const quickActions: { icon: IconName; label: string; color: string; onPress: () => void }[] = [
    { icon: 'share', label: 'Share\nLocation', color: '#2563EB', onPress: () => router.push('/live-share') },
    { icon: 'check-circle', label: 'Check\nIn', color: '#059669', onPress: () => router.push('/(tabs)/activity') },
    { icon: 'phone', label: 'Call\nContact', color: '#0891B2', onPress: () => Linking.openURL('tel:911') },
    { icon: 'map', label: 'Open\nMap', color: '#7C3AED', onPress: () => router.push('/(tabs)/map') },
  ];

  const batteryIcon: IconName = deviceStatus.batteryLevel !== null && deviceStatus.batteryLevel < 20 ? 'battery-low' : 'battery';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader
        title={`Hello, ${profile?.full_name?.split(' ')[0] ?? 'there'}`}
        subtitle="You're protected"
        large
        rightIcon="bell"
        onRightPress={() => router.push('/(tabs)/profile')}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + 100 }}
        entering={FadeInDown.springify()}
      >
        {/* Status Overview */}
        <Card elevation={2} style={{ marginBottom: SPACING.lg }}>
          <View style={styles.statusHeader}>
            <View>
              <Typography size="xs" color={theme.textMuted} weight="medium">CURRENT STATUS</Typography>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <Typography size="xl" weight="bold" color={theme.success}>Safe</Typography>
              </View>
            </View>
            <StatusBadge label="All systems active" color={theme.success} icon="shield-check" />
          </View>

          <View style={styles.statusGrid}>
            <StatusCard
              icon={batteryIcon}
              label="Battery"
              value={deviceStatus.batteryLevel !== null ? `${deviceStatus.batteryLevel}%` : 'N/A'}
              color={deviceStatus.batteryLevel !== null && deviceStatus.batteryLevel < 20 ? theme.danger : theme.text}
              theme={theme}
            />
            <StatusCard
              icon={deviceStatus.gpsAvailable ? 'map-pin' : 'map-pin'}
              label="GPS"
              value={deviceStatus.gpsAvailable ? 'Active' : 'Off'}
              color={deviceStatus.gpsAvailable ? theme.success : theme.warning}
              theme={theme}
            />
            <StatusCard
              icon={deviceStatus.internetAvailable ? 'wifi' : 'wifi-off'}
              label="Internet"
              value={deviceStatus.internetAvailable ? 'Online' : 'Offline'}
              color={deviceStatus.internetAvailable ? theme.success : theme.danger}
              theme={theme}
            />
            <StatusCard
              icon="users"
              label="Contacts"
              value={String(contactsCount)}
              color={theme.text}
              theme={theme}
            />
          </View>
        </Card>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Animated.View style={[styles.pulseRing, pulseStyle, { borderColor: theme.danger }]} />
          <Pressable onPress={handleSOSPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
            <LinearGradient
              colors={[theme.danger, theme.dangerDark]}
              style={styles.sosButton}
            >
              <Icon name="siren" size={40} color="#FFFFFF" />
              <Typography size="xl" weight="bold" color="#FFFFFF" style={{ marginTop: SPACING.xs }}>SOS</Typography>
              <Typography size="xs" color="rgba(255,255,255,0.8)">Hold to activate</Typography>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <Typography size="md" weight="semibold" color={theme.text} style={{ marginBottom: SPACING.sm + 2 }}>Quick Actions</Typography>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(i * 80).springify()}
              style={{ flex: 1 }}
            >
              <Pressable
                onPress={action.onPress}
                style={({ pressed }) => [styles.quickAction, { backgroundColor: theme.surface, borderColor: theme.borderLight, opacity: pressed ? 0.8 : 1 }]}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                  <Icon name={action.icon} size={22} color={action.color} />
                </View>
                <Typography size="xs" color={theme.textSecondary} weight="medium" align="center" style={{ lineHeight: 16 }}>
                  {action.label}
                </Typography>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Current Location */}
        <Typography size="md" weight="semibold" color={theme.text} style={{ marginTop: SPACING.lg, marginBottom: SPACING.sm + 2 }}>Current Location</Typography>
        <Card elevation={1} style={{ marginBottom: SPACING.lg }}>
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, { backgroundColor: theme.accent + '15' }]}>
              <Icon name="map-pin" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography size="sm" weight="semibold" color={theme.text}>
                {deviceStatus.location ? `${deviceStatus.location.latitude.toFixed(4)}, ${deviceStatus.location.longitude.toFixed(4)}` : 'Location unavailable'}
              </Typography>
              <Typography size="xs" color={theme.textMuted} style={{ marginTop: 2 }}>
                {deviceStatus.location?.accuracy ? `Accuracy: ±${Math.round(deviceStatus.location.accuracy)}m` : 'Enable GPS for precise location'}
              </Typography>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/map')}>
              <Icon name="chevron-right" size={20} color={theme.textMuted} />
            </Pressable>
          </View>
        </Card>

        {/* Recent Activity */}
        <Typography size="md" weight="semibold" color={theme.text} style={{ marginBottom: SPACING.sm + 2 }}>Recent Activity</Typography>
        {recentActivity.length > 0 ? (
          <View style={{ gap: SPACING.sm }}>
            {recentActivity.map((item) => (
              <Card key={item.id} elevation={1} padding={SPACING.md}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: (item.type.includes('sos') ? theme.danger : item.type.includes('check') ? theme.success : theme.accent) + '15' }]}>
                    <Icon
                      name={item.type.includes('sos') ? 'siren' : item.type.includes('check') ? 'check' : 'activity'}
                      size={16}
                      color={item.type.includes('sos') ? theme.danger : item.type.includes('check') ? theme.success : theme.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography size="sm" weight="medium" color={theme.text}>{item.title}</Typography>
                    {item.description && <Typography size="xs" color={theme.textMuted} style={{ marginTop: 2 }}>{item.description}</Typography>}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card elevation={1} padding={SPACING.xl}>
            <Typography size="sm" color={theme.textMuted} align="center">
              No recent activity. Your safety events will appear here.
            </Typography>
          </Card>
        )}
      </Animated.ScrollView>
    </View>
  );
}

function StatusCard({ icon, label, value, color, theme }: { icon: IconName; label: string; value: string; color: string; theme: any }) {
  return (
    <View style={styles.statusCard}>
      <Icon name={icon} size={20} color={color} />
      <Typography size="xs" color={theme.textMuted} style={{ marginTop: 4 }}>{label}</Typography>
      <Typography size="md" weight="semibold" color={color}>{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xl,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  sosButton: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
