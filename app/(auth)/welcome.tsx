import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { SPACING, RADIUS } from '@/lib/theme';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryDark }]}>
      {/* Decorative glow */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={[styles.content, { paddingTop: insets.top + SPACING.xxl }]}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Icon name="shield-check" size={48} color={theme.textInverse} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Typography size="hero" weight="bold" color={theme.textInverse} align="center" style={{ letterSpacing: -1 }}>
            Sentinel
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <Typography size="lg" color="rgba(255,255,255,0.7)" align="center" style={{ marginTop: SPACING.sm }}>
            Your personal safety companion. Always ready, always there.
          </Typography>
        </Animated.View>

        <View style={styles.features}>
          <Animated.View entering={FadeInDown.delay(400)}>
            <FeatureItem icon="siren" label="Instant SOS alerts" />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(500)}>
            <FeatureItem icon="map-pin" label="Live location sharing" />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(600)}>
            <FeatureItem icon="users" label="Trusted contacts network" />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(700)}>
            <FeatureItem icon="lock" label="Privacy-first design" />
          </Animated.View>
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(800)}
        style={[styles.actions, { paddingBottom: insets.bottom + SPACING.lg }]}
      >
        <Button label="Get Started" onPress={() => router.push('/(auth)/register')} variant="primary" fullWidth size="lg" icon="chevron-right" iconPosition="right" />
        <View style={{ height: SPACING.md }} />
        <Button
          label="I already have an account"
          onPress={() => router.push('/(auth)/login')}
          variant="ghost"
          fullWidth
          size="lg"
        />
      </Animated.View>
    </View>
  );
}

function FeatureItem({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Icon name={icon} size={18} color="#FFFFFF" />
      </View>
      <Typography size="md" color="rgba(255,255,255,0.85)">{label}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(30,65,120,0.5)',
  },
  glow2: {
    position: 'absolute',
    bottom: 100,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(220,38,38,0.15)',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  features: {
    marginTop: SPACING.xxl,
    gap: SPACING.md,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actions: {
    paddingHorizontal: SPACING.xl,
  },
});
