import { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { useSOSStore } from '@/lib/stores/sosStore';
import { useDeviceStatus } from '@/lib/useDeviceStatus';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { SPACING, RADIUS, FONT_SIZES } from '@/lib/theme';
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
  FadeIn,
  SlideInDown,
  interpolate,
} from 'react-native-reanimated';

function CountdownView({ countdown, onCancel }: { countdown: number; onCancel: () => void }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }, [countdown]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
      <View style={styles.countdownContainer}>
        <Typography size="lg" color="#FFFFFF" weight="semibold" align="center">
          Emergency SOS
        </Typography>
        <Typography size="sm" color="rgba(255,255,255,0.7)" align="center" style={{ marginTop: SPACING.xs }}>
          Activating in...
        </Typography>

        <View style={styles.countdownCircle}>
          <LinearGradient colors={[theme.danger, theme.dangerDark]} style={styles.countdownGradient}>
            <Animated.Text style={[styles.countdownNumber, scaleStyle]}>{countdown}</Animated.Text>
          </LinearGradient>
        </View>

        <Typography size="sm" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: SPACING.md, paddingHorizontal: SPACING.xl }}>
          Your trusted contacts will be notified with your live location
        </Typography>

        <View style={{ marginTop: SPACING.xl, width: '100%' }}>
          <Button
            label="Cancel SOS"
            onPress={onCancel}
            variant="secondary"
            fullWidth
            size="lg"
            icon="x"
          />
        </View>
      </View>
    </View>
  );
}

export default function SOSActiveScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phase, countdown, cancelCountdown, stopSOS, startedAt, contactsNotified, lastLocation, batteryLevel } = useSOSStore();
  const deviceStatus = useDeviceStatus();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (phase !== 'active' || !startedAt) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, startedAt]);

  // Redirect when SOS is stopped or if idle
  useEffect(() => {
    if (phase === 'idle') {
      router.replace('/(tabs)');
    }
  }, [phase]);

  const pulse = useSharedValue(0);
  useEffect(() => {
    if (phase !== 'active') return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [phase]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.5, 0.1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.5]) }],
  }));

  if (phase === 'countdown') {
    return <CountdownView countdown={countdown} onCancel={cancelCountdown} />;
  }

  if (phase !== 'active') {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    confirmDialog({
      title: 'Stop SOS?',
      message: 'This will end your emergency session and notify your contacts that the alert has been cancelled.',
      confirmLabel: 'Stop SOS',
      variant: 'danger',
      icon: 'siren',
    }, () => stopSOS('resolved'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.dangerDark }}>
      <Animated.View style={[styles.bgPulse, pulseStyle]} />

      <View style={[styles.content, { paddingTop: insets.top + SPACING.xl }]}>
        <Animated.View entering={FadeIn.springify()} style={styles.header}>
          <View style={styles.activeIcon}>
            <Icon name="siren" size={40} color="#FFFFFF" />
          </View>
          <Typography size="display" weight="bold" color="#FFFFFF">SOS ACTIVE</Typography>
          <Typography size="md" color="rgba(255,255,255,0.8)">
            Emergency alert in progress
          </Typography>
        </Animated.View>

        <Animated.View entering={SlideInDown.delay(200)} style={{ width: '100%' }}>
          <View style={styles.timerWrap}>
            <Typography size="hero" weight="bold" color="#FFFFFF" style={{ fontVariant: ['tabular-nums'] }}>
              {formatTime(elapsed)}
            </Typography>
            <Typography size="sm" color="rgba(255,255,255,0.6)">elapsed time</Typography>
          </View>
        </Animated.View>

        <Animated.View entering={SlideInDown.delay(300)} style={{ width: '100%', gap: SPACING.md }}>
          <InfoCard
            icon="users"
            label="Contacts Notified"
            value={`${contactsNotified} contact${contactsNotified === 1 ? '' : 's'}`}
          />
          <InfoCard
            icon="map-pin"
            label="Live Location"
            value={lastLocation ? `${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}` : 'Acquiring...'}
          />
          <InfoCard
            icon="battery"
            label="Battery Level"
            value={batteryLevel !== null ? `${batteryLevel}%` : deviceStatus.batteryLevel !== null ? `${deviceStatus.batteryLevel}%` : 'N/A'}
          />
          <InfoCard
            icon="smartphone"
            label="Device"
            value={deviceStatus.internetAvailable ? 'Connected' : 'Offline'}
          />
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={SlideInDown.delay(400)} style={[styles.actions, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <Card glass padding={SPACING.md} style={{ marginBottom: SPACING.md }}>
            <Typography size="xs" color="#FFFFFF" align="center" style={{ opacity: 0.9 }}>
              Your location is being shared and updated every few seconds with your emergency contacts.
            </Typography>
          </Card>
          <Button
            label="Stop SOS"
            onPress={handleStop}
            variant="secondary"
            fullWidth
            size="lg"
            icon="x"
          />
        </Animated.View>
      </View>
    </View>
  );
}

function InfoCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
      <Icon name={icon} size={20} color="#FFFFFF" />
      <View style={{ flex: 1 }}>
        <Typography size="xs" color="rgba(255,255,255,0.6)">{label}</Typography>
        <Typography size="md" weight="semibold" color="#FFFFFF">{value}</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    width: '100%',
  },
  countdownCircle: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  countdownGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bgPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220,38,38,0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  activeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  timerWrap: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  actions: {
    width: '100%',
  },
});
