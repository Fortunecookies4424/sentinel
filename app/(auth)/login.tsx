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

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('success', 'Welcome back!');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Login failed');
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
          <Typography size="xxl" weight="bold" color={theme.text}>Welcome back</Typography>
          <Typography size="md" color={theme.textSecondary} style={{ marginTop: SPACING.xs }}>
            Sign in to stay protected
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: SPACING.xl }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            icon="user"
            keyboardType="email-address"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            icon="lock"
            secureTextEntry
            error={errors.password}
          />

          <View style={styles.row}>
            <Pressable style={styles.checkboxRow} onPress={() => setRemember(!remember)}>
              <View style={[styles.checkbox, { borderColor: remember ? theme.primary : theme.border, backgroundColor: remember ? theme.primary : 'transparent' }]}>
                {remember && <Icon name="check" size={14} color="#FFFFFF" />}
              </View>
              <Typography size="sm" color={theme.textSecondary}>Remember me</Typography>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
              <Typography size="sm" color={theme.accent} weight="medium">Forgot password?</Typography>
            </Pressable>
          </View>

          <View style={{ height: SPACING.lg }} />
          <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.dividerWrap}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Typography size="sm" color={theme.textMuted}>or continue with</Typography>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.socialRow}>
          <SocialButton icon="user" label="Google" onPress={() => showToast('info', 'Google sign-in coming soon')} theme={theme} />
          <SocialButton icon="smartphone" label="Apple" onPress={() => showToast('info', 'Apple sign-in coming soon')} theme={theme} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.footer}>
          <Typography size="sm" color={theme.textSecondary}>Don't have an account? </Typography>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Typography size="sm" color={theme.accent} weight="semibold">Sign up</Typography>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function SocialButton({ icon, label, onPress, theme }: { icon: any; label: string; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialBtn,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Icon name={icon} size={20} color={theme.text} />
      <Typography size="sm" weight="medium" color={theme.text}>{label}</Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  content: { flex: 1, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.xs },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.xl },
  divider: { flex: 1, height: 1 },
  socialRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  socialBtn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl, paddingBottom: SPACING.lg },
});
