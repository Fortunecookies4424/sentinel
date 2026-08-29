import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { showToast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/lib/stores/authStore';
import { useThemeStore, type ThemeMode } from '@/lib/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import { LANGUAGES } from '@/types';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const [medicalCount, setMedicalCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('medical_profiles').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setMedicalCount(count ?? 0));
  }, [user]);

  const handleSignOut = () => {
    confirmDialog({
      title: 'Sign Out',
      message: 'You will need to sign in again to access your safety features.',
      confirmLabel: 'Sign Out',
      variant: 'primary',
      icon: 'logout',
    }, () => signOut());
  };

  const handleDeleteAccount = () => {
    confirmDialog({
      title: 'Delete Account?',
      message: 'This will permanently delete your account and all associated data including contacts, activity history, and medical profile. This action cannot be undone.',
      confirmLabel: 'Delete Permanently',
      variant: 'danger',
      icon: 'trash-2',
    }, async () => {
      showToast('info', 'Account deletion requires verification. Contact support to proceed.');
    });
  };

  const togglePreference = async (key: 'biometric_enabled' | 'share_location_enabled' | 'notifications_enabled', value: boolean): Promise<void> => {
    if (!user) return;
    try {
      await supabase.from('profiles').update({ [key]: value }).eq('id', user.id);
      refreshProfile();
      showToast('success', 'Preference updated');
    } catch {
      showToast('error', 'Failed to update preference');
    }
  };

  const handleExport = () => {
    showToast('info', 'Data export will be prepared and sent to your email');
  };

  const themeOptions: { value: ThemeMode; label: string; icon: IconName }[] = [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'Auto', icon: 'smartphone' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Profile" subtitle="Manage your account and settings" large />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + 100 }}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.springify()}>
          <Card elevation={2} style={{ marginBottom: SPACING.lg }}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Typography size="xl" weight="bold" color="#FFFFFF">
                  {(profile?.full_name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
                </Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography size="lg" weight="bold" color={theme.text}>
                  {profile?.full_name ?? 'Sentinel User'}
                </Typography>
                <Typography size="sm" color={theme.textSecondary}>{user?.email}</Typography>
                {profile?.phone && <Typography size="sm" color={theme.textMuted} style={{ marginTop: 2 }}>{profile.phone}</Typography>}
              </View>
              <Pressable
                onPress={() => router.push('/profile-edit')}
                style={({ pressed }) => [styles.editBtn, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <Icon name="edit" size={18} color={theme.text} />
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Links */}
        <View style={styles.linkGrid}>
          <Pressable onPress={() => router.push('/medical')} style={({ pressed }) => [styles.linkCard, { backgroundColor: theme.surface, borderColor: theme.borderLight, opacity: pressed ? 0.7 : 1 }]}>
            <View style={[styles.linkIcon, { backgroundColor: theme.danger + '15' }]}>
              <Icon name="heart" size={22} color={theme.danger} />
            </View>
            <Typography size="sm" weight="semibold" color={theme.text}>Medical</Typography>
            <Typography size="xs" color={theme.textMuted}>{medicalCount > 0 ? 'Completed' : 'Not set'}</Typography>
          </Pressable>
          <Pressable onPress={() => router.push('/check-in')} style={({ pressed }) => [styles.linkCard, { backgroundColor: theme.surface, borderColor: theme.borderLight, opacity: pressed ? 0.7 : 1 }]}>
            <View style={[styles.linkIcon, { backgroundColor: theme.success + '15' }]}>
              <Icon name="check-circle" size={22} color={theme.success} />
            </View>
            <Typography size="sm" weight="semibold" color={theme.text}>Check-In</Typography>
            <Typography size="xs" color={theme.textMuted}>Schedule</Typography>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('tel:911')} style={({ pressed }) => [styles.linkCard, { backgroundColor: theme.surface, borderColor: theme.borderLight, opacity: pressed ? 0.7 : 1 }]}>
            <View style={[styles.linkIcon, { backgroundColor: theme.danger + '15' }]}>
              <Icon name="phone" size={22} color={theme.danger} />
            </View>
            <Typography size="sm" weight="semibold" color={theme.text}>Emergency</Typography>
            <Typography size="xs" color={theme.textMuted}>Call 911</Typography>
          </Pressable>
        </View>

        {/* Emergency Preferences */}
        <Typography size="md" weight="semibold" color={theme.text} style={{ marginTop: SPACING.lg, marginBottom: SPACING.sm + 2 }}>Emergency Preferences</Typography>
        <Card elevation={1} style={{ marginBottom: SPACING.lg }}>
          <PreferenceRow
            icon="fingerprint"
            label="Biometric Login"
            description="Face unlock or fingerprint"
            value={profile?.biometric_enabled ?? false}
            onToggle={(v) => togglePreference('biometric_enabled', v)}
            theme={theme}
          />
          <Divider theme={theme} />
          <PreferenceRow
            icon="map-pin"
            label="Share Location"
            description="Allow location sharing during SOS"
            value={profile?.share_location_enabled ?? true}
            onToggle={(v) => togglePreference('share_location_enabled', v)}
            theme={theme}
          />
          <Divider theme={theme} />
          <PreferenceRow
            icon="bell"
            label="Notifications"
            description="Emergency alerts and reminders"
            value={profile?.notifications_enabled ?? true}
            onToggle={(v) => togglePreference('notifications_enabled', v)}
            theme={theme}
          />
        </Card>

        {/* Appearance */}
        <Typography size="md" weight="semibold" color={theme.text} style={{ marginBottom: SPACING.sm + 2 }}>Appearance</Typography>
        <Card elevation={1} style={{ marginBottom: SPACING.lg }}>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setMode(opt.value)}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: mode === opt.value ? theme.primary : theme.surface,
                    borderColor: mode === opt.value ? theme.primary : theme.border,
                  },
                ]}
              >
                <Icon name={opt.icon} size={20} color={mode === opt.value ? '#FFFFFF' : theme.textSecondary} />
                <Typography size="xs" weight="medium" color={mode === opt.value ? '#FFFFFF' : theme.textSecondary}>
                  {opt.label}
                </Typography>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Privacy & Security */}
        <Typography size="md" weight="semibold" color={theme.text} style={{ marginBottom: SPACING.sm + 2 }}>Privacy & Security</Typography>
        <Card elevation={1} style={{ marginBottom: SPACING.lg }}>
          <LinkRow icon="lock" label="Privacy" subtitle="Location permissions, data controls" onPress={() => showToast('info', 'Privacy settings')} theme={theme} />
          <Divider theme={theme} />
          <LinkRow icon="download" label="Export Data" subtitle="Download your data" onPress={handleExport} theme={theme} />
          <Divider theme={theme} />
          <LinkRow icon="info" label="About Sentinel" subtitle="Version 1.0.0" onPress={() => showToast('info', 'Sentinel v1.0.0 — Personal Safety')} theme={theme} />
        </Card>

        {/* Danger Zone */}
        <Card elevation={1} style={{ marginBottom: SPACING.lg }}>
          <LinkRow icon="trash-2" label="Delete Account" subtitle="Permanently remove your account" onPress={handleDeleteAccount} danger theme={theme} />
        </Card>

        <Button label="Sign Out" onPress={handleSignOut} variant="secondary" fullWidth size="lg" icon="logout" />
      </ScrollView>
    </View>
  );
}

function PreferenceRow({ icon, label, description, value, onToggle, theme }: { icon: any; label: string; description: string; value: boolean; onToggle: (v: boolean) => void; theme: any }) {
  return (
    <View style={styles.prefRow}>
      <View style={[styles.prefIcon, { backgroundColor: theme.primary + '12' }]}>
        <Icon name={icon} size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography size="sm" weight="medium" color={theme.text}>{label}</Typography>
        <Typography size="xs" color={theme.textMuted} style={{ marginTop: 1 }}>{description}</Typography>
      </View>
      <Pressable onPress={() => onToggle(!value)} hitSlop={12}>
        <View style={[styles.toggle, { backgroundColor: value ? theme.success : theme.border }]}>
          <Animated.View style={[styles.toggleKnob, { transform: [{ translateX: value ? 20 : 0 }] }]} />
        </View>
      </Pressable>
    </View>
  );
}

function Divider({ theme }: any) {
  return <View style={{ height: 1, backgroundColor: theme.borderLight, marginVertical: SPACING.md }} />;
}

function LinkRow({ icon, label, subtitle, onPress, theme, danger }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.prefIcon, { backgroundColor: (danger ? theme.danger : theme.primary) + '12' }]}>
        <Icon name={icon} size={18} color={danger ? theme.danger : theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography size="sm" weight="medium" color={danger ? theme.danger : theme.text}>{label}</Typography>
        <Typography size="xs" color={theme.textMuted} style={{ marginTop: 1 }}>{subtitle}</Typography>
      </View>
      <Icon name="chevron-right" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  linkGrid: { flexDirection: 'row', gap: SPACING.sm },
  linkCard: { flex: 1, alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1 },
  linkIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  prefIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  themeRow: { flexDirection: 'row', gap: SPACING.sm },
  themeOption: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
});
