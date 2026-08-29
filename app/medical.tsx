import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { showToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/stores/authStore';
import { fetchMedicalProfile, upsertMedicalProfile } from '@/lib/db/medical';
import { BLOOD_GROUPS } from '@/types';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function MedicalScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [medication, setMedication] = useState('');
  const [notes, setNotes] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchMedicalProfile(user.id)
      .then((data) => {
        if (data) {
          setBloodGroup(data.blood_group ?? '');
          setAllergies(data.allergies ?? '');
          setConditions(data.medical_conditions ?? '');
          setMedication(data.emergency_medication ?? '');
          setNotes(data.emergency_notes ?? '');
          setHeight(data.height ?? '');
          setWeight(data.weight ?? '');
          setDob(data.date_of_birth ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertMedicalProfile(user.id, {
        blood_group: bloodGroup || null,
        allergies: allergies || null,
        medical_conditions: conditions || null,
        emergency_medication: medication || null,
        emergency_notes: notes || null,
        height: height || null,
        weight: weight || null,
        date_of_birth: dob || null,
      });
      showToast('success', 'Medical profile saved');
      router.back();
    } catch {
      showToast('error', 'Failed to save medical profile');
    } finally {
      setSaving(false);
    }
  };

  const fields: { icon: IconName; label: string; value: string; setter: (v: string) => void; placeholder: string; multiline?: boolean }[] = [
    { icon: 'alert-triangle', label: 'Allergies', value: allergies, setter: setAllergies, placeholder: 'e.g. Penicillin, Peanuts', multiline: true },
    { icon: 'activity', label: 'Medical Conditions', value: conditions, setter: setConditions, placeholder: 'e.g. Asthma, Diabetes', multiline: true },
    { icon: 'plus', label: 'Emergency Medication', value: medication, setter: setMedication, placeholder: 'e.g. EpiPen, Insulin', multiline: true },
    { icon: 'info', label: 'Emergency Notes', value: notes, setter: setNotes, placeholder: 'Any critical info for responders', multiline: true },
    { icon: 'ruler', label: 'Height', value: height, setter: setHeight, placeholder: 'e.g. 5\'10" or 178 cm' },
    { icon: 'weight', label: 'Weight', value: weight, setter: setWeight, placeholder: 'e.g. 160 lbs or 72 kg' },
    { icon: 'calendar', label: 'Date of Birth', value: dob, setter: setDob, placeholder: 'YYYY-MM-DD' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Medical Profile" subtitle="Critical info for emergency responders" showBack onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + SPACING.xl }}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Card elevation={2} style={{ marginBottom: SPACING.lg }}>
            <View style={styles.medicalHeader}>
              <View style={[styles.medicalIcon, { backgroundColor: theme.danger + '15' }]}>
                <Icon name="heart" size={24} color={theme.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography size="md" weight="semibold" color={theme.text}>Emergency Medical Info</Typography>
                <Typography size="xs" color={theme.textSecondary} style={{ marginTop: 2 }}>
                  This information is shared with emergency contacts during SOS
                </Typography>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Blood Group */}
        <Typography size="sm" color={theme.textSecondary} weight="medium" style={{ marginBottom: SPACING.sm }}>Blood Group</Typography>
        <View style={styles.bloodGrid}>
          {BLOOD_GROUPS.map((bg) => (
            <Pressable
              key={bg}
              onPress={() => setBloodGroup(bg)}
              style={[
                styles.bloodChip,
                { backgroundColor: bloodGroup === bg ? theme.danger : theme.surface, borderColor: bloodGroup === bg ? theme.danger : theme.border },
              ]}
            >
              <Typography size="md" weight="bold" color={bloodGroup === bg ? '#FFFFFF' : theme.text}>{bg}</Typography>
            </Pressable>
          ))}
        </View>

        {/* Medical Fields */}
        <View style={{ marginTop: SPACING.lg, gap: 0 }}>
          {fields.map((field, i) => (
            <Animated.View key={field.label} entering={FadeInDown.delay(i * 50).springify()}>
              <Input
                label={field.label}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                icon={field.icon}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 2 : undefined}
              />
            </Animated.View>
          ))}
        </View>

        <View style={{ marginTop: SPACING.md }}>
          <Button label="Save Medical Profile" onPress={handleSave} loading={saving} fullWidth size="lg" icon="check" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  medicalHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  medicalIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  bloodChip: { width: 64, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
