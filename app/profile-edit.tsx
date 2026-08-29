import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { showToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/stores/authStore';
import { supabase } from '@/lib/supabase';
import { SPACING } from '@/lib/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileEditScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [emergencyMessage, setEmergencyMessage] = useState(profile?.emergency_message ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        full_name: fullName || null,
        phone: phone || null,
        address: address || null,
        emergency_message: emergencyMessage,
      }).eq('id', user.id);
      await refreshProfile();
      showToast('success', 'Profile updated');
      router.back();
    } catch {
      showToast('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Edit Profile" showBack onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + SPACING.xl }}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Card elevation={2} style={{ marginBottom: SPACING.lg, alignItems: 'center' }}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Typography size="display" weight="bold" color="#FFFFFF">
                {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
              </Typography>
            </View>
            <Typography size="xs" color={theme.textMuted} style={{ marginTop: SPACING.sm }}>
              Profile photo coming soon
            </Typography>
          </Card>

          <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your name" icon="user" />
          <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 234 567 890" icon="phone" keyboardType="phone-pad" />
          <Input label="Address" value={address} onChangeText={setAddress} placeholder="Your home address" icon="map-pin" multiline />

          <Typography size="sm" color={theme.textSecondary} weight="medium" style={{ marginBottom: SPACING.sm, marginLeft: 2 }}>
            Emergency Message
          </Typography>
          <Input
            value={emergencyMessage}
            onChangeText={setEmergencyMessage}
            placeholder="Message sent to contacts during SOS"
            multiline
            numberOfLines={4}
          />
          <Typography size="xs" color={theme.textMuted} style={{ marginLeft: 2, marginTop: -SPACING.xs, marginBottom: SPACING.lg }}>
            This message is automatically sent to all your trusted contacts when you activate SOS.
          </Typography>

          <Button label="Save Changes" onPress={handleSave} loading={saving} fullWidth size="lg" icon="check" />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
});
