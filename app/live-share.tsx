import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { showToast } from '@/components/ui/Toast';
import { useLiveShareStore } from '@/lib/stores/liveShareStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { supabase } from '@/lib/supabase';
import { getCurrentPosition, formatCoords } from '@/lib/geo';
import { SHARE_DURATIONS } from '@/types';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function LiveShareScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { active, durationMinutes, startedAt, lastLocation, startSharing, stopSharing } = useLiveShareStore();
  const { user } = useAuthStore();
  const [contactsCount, setContactsCount] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);

  useEffect(() => {
    if (user) {
      supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        .then(({ count }) => setContactsCount(count ?? 0));
    }
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (!active || !startedAt || durationMinutes === 0) {
      setRemaining(null);
      return;
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const total = durationMinutes * 60;
      const left = total - elapsed;
      setRemaining(Math.max(0, left));
      if (left <= 0) stopSharing();
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [active, startedAt, durationMinutes]);

  const handleStart = async () => {
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      showToast('info', 'Please allow location access to share your location');
    } catch {
      // continue even if location isn't immediately available
    }
    await startSharing(selectedDuration);
    showToast('success', selectedDuration === 0 ? 'Sharing location until stopped' : `Sharing for ${selectedDuration} minutes`);
  };

  const handleStop = () => {
    stopSharing();
    showToast('success', 'Location sharing stopped');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (active) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ScreenHeader title="Live Sharing" showBack onBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + SPACING.lg }}>
          <Animated.View entering={FadeIn.springify()}>
            <Card elevation={2} padding={SPACING.xl} style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
              <View style={[styles.sharingIcon, { backgroundColor: theme.success + '15' }]}>
                <Icon name="share" size={32} color={theme.success} />
              </View>
              <Typography size="lg" weight="bold" color={theme.success}>Sharing Active</Typography>
              <Typography size="sm" color={theme.textSecondary} style={{ marginTop: 4 }}>
                Your live location is being shared
              </Typography>

              {durationMinutes > 0 && remaining !== null ? (
                <View style={styles.timerWrap}>
                  <Typography size="hero" weight="bold" color={theme.text} style={{ fontVariant: ['tabular-nums'] }}>
                    {formatTime(remaining)}
                  </Typography>
                  <Typography size="xs" color={theme.textMuted}>remaining</Typography>
                </View>
              ) : (
                <View style={styles.timerWrap}>
                  <Icon name="clock" size={28} color={theme.textMuted} />
                  <Typography size="sm" color={theme.textMuted}>Sharing until stopped</Typography>
                </View>
              )}
            </Card>
          </Animated.View>

          <Card elevation={1} style={{ marginBottom: SPACING.md }}>
            <View style={styles.detailRow}>
              <Icon name="map-pin" size={20} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Typography size="xs" color={theme.textMuted}>Current Location</Typography>
                <Typography size="sm" weight="semibold" color={theme.text}>
                  {lastLocation ? formatCoords(lastLocation.latitude, lastLocation.longitude) : 'Acquiring...'}
                </Typography>
              </View>
            </View>
            <View style={[styles.detailRow, { marginTop: SPACING.md }]}>
              <Icon name="users" size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Typography size="xs" color={theme.textMuted}>Who Can View</Typography>
                <Typography size="sm" weight="semibold" color={theme.text}>{contactsCount} trusted contact{contactsCount === 1 ? '' : 's'}</Typography>
              </View>
            </View>
          </Card>

          <Card elevation={1} padding={SPACING.md} style={{ marginBottom: SPACING.lg }}>
            <View style={styles.infoRow}>
              <Icon name="info" size={16} color={theme.textMuted} />
              <Typography size="xs" color={theme.textSecondary} style={{ flex: 1 }}>
                Your location updates every few seconds. Contacts receive a link to view your position in real time.
              </Typography>
            </View>
          </Card>

          <View style={{ flex: 1 }} />
          <Button label="Stop Sharing" onPress={handleStop} variant="danger" fullWidth size="lg" icon="x" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Share Location" subtitle="Share your live location with contacts" showBack onBack={() => router.back()} />
      <ScrollViewSafe insets={insets}>
        <Animated.View entering={FadeInDown.springify()}>
          <Card elevation={2} style={{ marginBottom: SPACING.lg, alignItems: 'center' }}>
            <View style={[styles.shareIcon, { backgroundColor: theme.accent + '15' }]}>
              <Icon name="share" size={36} color={theme.accent} />
            </View>
            <Typography size="lg" weight="bold" color={theme.text} align="center">Live Location Sharing</Typography>
            <Typography size="sm" color={theme.textSecondary} align="center" style={{ marginTop: SPACING.xs }}>
              Choose how long to share your real-time location with your trusted contacts
            </Typography>
          </Card>
        </Animated.View>

        <Typography size="md" weight="semibold" color={theme.text} style={{ marginBottom: SPACING.sm + 2 }}>Duration</Typography>
        <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
          {SHARE_DURATIONS.map((dur, i) => (
            <Animated.View key={dur.value} entering={FadeInDown.delay(i * 60).springify()}>
              <Pressable
                onPress={() => setSelectedDuration(dur.value)}
                style={[
                  styles.durationCard,
                  {
                    backgroundColor: selectedDuration === dur.value ? theme.primary : theme.surface,
                    borderColor: selectedDuration === dur.value ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={[styles.durationIcon, { backgroundColor: selectedDuration === dur.value ? 'rgba(255,255,255,0.2)' : theme.primary + '12' }]}>
                  <Icon name={dur.value === 0 ? 'clock' : 'clock'} size={20} color={selectedDuration === dur.value ? '#FFFFFF' : theme.primary} />
                </View>
                <Typography size="md" weight="semibold" color={selectedDuration === dur.value ? '#FFFFFF' : theme.text}>
                  {dur.label}
                </Typography>
                {selectedDuration === dur.value && <Icon name="check" size={20} color="#FFFFFF" />}
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <Card elevation={1} padding={SPACING.md} style={{ marginBottom: SPACING.lg }}>
          <View style={styles.infoRow}>
            <Icon name="shield-check" size={16} color={theme.success} />
            <Typography size="xs" color={theme.textSecondary} style={{ flex: 1 }}>
              Location sharing is encrypted and only visible to your trusted contacts. Sharing stops automatically when the timer expires or you stop it manually.
            </Typography>
          </View>
        </Card>

        <Button label="Start Sharing" onPress={handleStart} fullWidth size="lg" icon="share" iconPosition="right" />
      </ScrollViewSafe>
    </View>
  );
}

function ScrollViewSafe({ children, insets }: { children: React.ReactNode; insets: any }) {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + SPACING.lg }}>
      {children}
    </ScrollView>
  );
}

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  sharingIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  timerWrap: { alignItems: 'center', marginTop: SPACING.lg, gap: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  shareIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  durationCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.md, borderWidth: 1.5 },
  durationIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
