import { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
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

export default function RegisterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Name is required';
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      showToast('success', 'Account created! Welcome to Sentinel.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Registration failed');
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl }}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <Typography size="xxl" weight="bold" color={theme.text}>Create account</Typography>
          <Typography size="md" color={theme.textSecondary} style={{ marginTop: SPACING.xs }}>
            Join Sentinel and stay protected
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: SPACING.xl }}>
          <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" icon="user" error={errors.fullName} />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="user" keyboardType="email-address" error={errors.email} />
          <Input label="Password" value={password} onChangeText={setPassword} placeholder="Create a password" icon="lock" secureTextEntry error={errors.password} />
          <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" icon="lock" secureTextEntry error={errors.confirmPassword} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.terms}>
          <Typography size="xs" color={theme.textMuted}>
            By creating an account, you agree to Sentinel's Terms of Service and Privacy Policy. Your data is encrypted and never shared.
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Button label="Create Account" onPress={handleRegister} loading={loading} fullWidth size="lg" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.dividerWrap}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Typography size="sm" color={theme.textMuted}>or sign up with</Typography>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.socialRow}>
          <Pressable
            onPress={() => showToast('info', 'Google sign-in coming soon')}
            style={({ pressed }) => [styles.socialBtn, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name="user" size={20} color={theme.text} />
            <Typography size="sm" weight="medium" color={theme.text}>Google</Typography>
          </Pressable>
          <Pressable
            onPress={() => showToast('info', 'Apple sign-in coming soon')}
            style={({ pressed }) => [styles.socialBtn, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name="smartphone" size={20} color={theme.text} />
            <Typography size="sm" weight="medium" color={theme.text}>Apple</Typography>
          </Pressable>
        </Animated.View>

        <View style={styles.footer}>
          <Typography size="sm" color={theme.textSecondary}>Already have an account? </Typography>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Typography size="sm" color={theme.accent} weight="semibold">Sign in</Typography>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  terms: { marginVertical: SPACING.md },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.xl },
  divider: { flex: 1, height: 1 },
  socialRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  socialBtn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl, paddingBottom: SPACING.lg },
});
