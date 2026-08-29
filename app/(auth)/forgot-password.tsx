import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { showToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { SPACING } from '@/lib/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
      showToast('success', 'Reset link sent to your email');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-left" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={styles.iconWrap}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
              <Icon name="lock" size={32} color={theme.primary} />
            </View>
          </View>
          <Typography size="xxl" weight="bold" color={theme.text} align="center">Forgot password?</Typography>
          <Typography size="md" color={theme.textSecondary} align="center" style={{ marginTop: SPACING.xs }}>
            {sent ? 'Check your email for a reset link' : 'Enter your email and we\'ll send you a reset link'}
          </Typography>
        </Animated.View>

        {!sent ? (
          <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: SPACING.xl }}>
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="user" keyboardType="email-address" error={error} />
            <View style={{ height: SPACING.lg }} />
            <Button label="Send Reset Link" onPress={handleReset} loading={loading} fullWidth size="lg" icon="send" iconPosition="right" />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: SPACING.xl, alignItems: 'center' }}>
            <View style={[styles.successCircle, { backgroundColor: theme.success + '15' }]}>
              <Icon name="check-circle" size={48} color={theme.success} />
            </View>
            <Typography size="md" color={theme.textSecondary} align="center" style={{ marginTop: SPACING.md }}>
              We sent a password reset link to{'\n'}
              <Typography size="md" weight="semibold" color={theme.text}>{email}</Typography>
            </Typography>
            <View style={{ height: SPACING.lg }} />
            <Button label="Back to Login" onPress={() => router.push('/(auth)/login')} fullWidth size="lg" variant="secondary" />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  content: { flex: 1, paddingHorizontal: SPACING.xl },
  iconWrap: { alignItems: 'center', marginTop: SPACING.xl },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
});

