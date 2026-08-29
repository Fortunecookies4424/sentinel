import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography, EmptyState } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSOSStore } from '@/lib/stores/sosStore';
import { fetchCheckIns, createCheckIn, completeCheckIn, cancelCheckIn } from '@/lib/db/checkIns';
import { CHECK_IN_DURATIONS, type CheckIn } from '@/types';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Modal } from 'react-native';

export default function CheckInScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { activateSOS } = useSOSStore();

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState("I'm travelling home.");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);

  const loadCheckIns = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchCheckIns(user.id);
      setCheckIns(data);
    } catch {
      showToast('error', 'Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCheckIns();
  }, [loadCheckIns]);

  // Check for expired check-ins and trigger SOS
  useEffect(() => {
    if (!user) return;
    const checkExpired = () => {
      checkIns.forEach(async (ci) => {
        if (ci.status === 'active' && new Date(ci.due_at) < new Date()) {
          await cancelCheckIn(ci.id);
          // Log missed check-in
          const { supabase } = await import('@/lib/supabase');
          await supabase.from('activity_log').insert({
            user_id: user.id,
            type: 'check_in_missed',
            title: 'Missed Check-In',
            description: `"${ci.note}" — timer expired without confirmation`,
          });
          loadCheckIns();
          showToast('error', 'Check-in missed! Consider activating SOS');
        }
      });
    };
    const interval = setInterval(checkExpired, 10000);
    return () => clearInterval(interval);
  }, [checkIns, user]);

  const handleCreate = async () => {
    if (!user) return;
    if (!note.trim()) { showToast('error', 'Please add a note'); return; }
    setSaving(true);
    try {
      await createCheckIn(user.id, { note: note.trim(), duration_minutes: duration });
      showToast('success', `Check-in scheduled for ${duration} minutes`);
      setModalVisible(false);
      loadCheckIns();
    } catch {
      showToast('error', 'Failed to schedule check-in');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = (ci: CheckIn) => {
    if (!user) return;
    confirmDialog({
      title: 'Check In Safe?',
      message: 'Confirm that you are safe to complete this check-in.',
      confirmLabel: 'I\'m Safe',
      variant: 'primary',
      icon: 'check-circle',
    }, async () => {
      await completeCheckIn(ci.id, user.id);
      showToast('success', 'Check-in completed. Stay safe!');
      loadCheckIns();
    });
  };

  const handleCancel = (ci: CheckIn) => {
    confirmDialog({
      title: 'Cancel Check-In?',
      message: 'This will cancel the scheduled check-in timer.',
      confirmLabel: 'Cancel Timer',
      variant: 'danger',
      icon: 'x-circle',
    }, async () => {
      await cancelCheckIn(ci.id);
      showToast('info', 'Check-in cancelled');
      loadCheckIns();
    });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getRemaining = (dueAt: string) => {
    const diff = new Date(dueAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.warning;
      case 'completed': return theme.success;
      case 'missed': return theme.danger;
      case 'expired': return theme.textMuted;
      default: return theme.textMuted;
    }
  };

  const activeCheckIns = checkIns.filter((c) => c.status === 'active');
  const pastCheckIns = checkIns.filter((c) => c.status !== 'active');

  const renderCheckIn = ({ item, index }: { item: CheckIn; index: number }) => {
    const remaining = getRemaining(item.due_at);
    const statusColor = getStatusColor(item.status);
    const isActive = item.status === 'active';

    return (
      <Animated.View entering={SlideInRight.delay(index * 50).springify()}>
        <Card elevation={1} padding={SPACING.md} style={{ marginBottom: SPACING.sm + 2 }}>
          <View style={styles.checkInRow}>
            <View style={[styles.checkInIcon, { backgroundColor: statusColor + '18' }]}>
              <Icon name={isActive ? 'clock' : item.status === 'completed' ? 'check-circle' : 'alert-triangle'} size={20} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography size="sm" weight="semibold" color={theme.text}>{item.note}</Typography>
              <Typography size="xs" color={theme.textMuted} style={{ marginTop: 2 }}>
                {isActive ? `Time remaining: ${formatTime(remaining)}` :
                 item.status === 'completed' ? 'Completed safely' :
                 item.status === 'missed' ? 'Missed — timer expired' : 'Cancelled'}
              </Typography>
            </View>
          </View>
          {isActive && (
            <View style={styles.checkInActions}>
              <Pressable
                onPress={() => handleComplete(item)}
                style={({ pressed }) => [styles.checkInBtn, { backgroundColor: theme.success + '15', opacity: pressed ? 0.7 : 1 }]}
              >
                <Icon name="check" size={16} color={theme.success} />
                <Typography size="xs" color={theme.success} weight="medium">I'm Safe</Typography>
              </Pressable>
              <Pressable
                onPress={() => handleCancel(item)}
                style={({ pressed }) => [styles.checkInBtn, { backgroundColor: theme.danger + '15', opacity: pressed ? 0.7 : 1 }]}
              >
                <Icon name="x" size={16} color={theme.danger} />
                <Typography size="xs" color={theme.danger} weight="medium">Cancel</Typography>
              </Pressable>
            </View>
          )}
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Safe Check-In" subtitle="Schedule safety check-ins" showBack onBack={() => router.back()} rightIcon="plus" onRightPress={() => setModalVisible(true)} />

      {loading ? (
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <ListSkeleton count={3} />
        </View>
      ) : checkIns.length === 0 ? (
        <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
          <EmptyState
            icon="check-circle"
            title="No check-ins scheduled"
            description="Schedule a check-in before travelling or entering an uncertain situation. If you don't confirm before the timer expires, an emergency alert can be triggered automatically."
            action={<Button label="Schedule Check-In" onPress={() => setModalVisible(true)} icon="plus" size="md" />}
          />
        </View>
      ) : (
        <FlatList
          data={[...activeCheckIns, ...pastCheckIns]}
          renderItem={renderCheckIn}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + SPACING.xl }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          ListHeaderComponent={() =>
            activeCheckIns.length > 0 ? (
              <Typography size="sm" weight="semibold" color={theme.warning} style={{ marginBottom: SPACING.sm }}>
                Active ({activeCheckIns.length})
              </Typography>
            ) : null
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Typography size="lg" weight="bold" color={theme.text}>Schedule Check-In</Typography>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <Icon name="x" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <Input label="What are you doing?" value={note} onChangeText={setNote} placeholder="e.g. I'm travelling home" icon="info" multiline />

            <Typography size="sm" color={theme.textSecondary} weight="medium" style={{ marginBottom: SPACING.sm }}>Duration</Typography>
            <View style={styles.durationGrid}>
              {CHECK_IN_DURATIONS.map((dur) => (
                <Pressable
                  key={dur.value}
                  onPress={() => setDuration(dur.value)}
                  style={[
                    styles.durationChip,
                    { backgroundColor: duration === dur.value ? theme.primary : theme.surface, borderColor: duration === dur.value ? theme.primary : theme.border },
                  ]}
                >
                  <Typography size="sm" weight="semibold" color={duration === dur.value ? '#FFFFFF' : theme.text}>
                    {dur.label}
                  </Typography>
                </Pressable>
              ))}
            </View>

            <Card elevation={0} padding={SPACING.md} style={{ backgroundColor: theme.warning + '12', marginTop: SPACING.md }}>
              <View style={styles.warningRow}>
                <Icon name="alert-triangle" size={16} color={theme.warning} />
                <Typography size="xs" color={theme.textSecondary} style={{ flex: 1 }}>
                  If you don't check in before the timer expires, an emergency alert may be triggered automatically.
                </Typography>
              </View>
            </Card>

            <View style={{ height: SPACING.md }} />
            <Button label="Schedule Check-In" onPress={handleCreate} loading={saving} fullWidth size="lg" icon="clock" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  checkInRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  checkInIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  checkInActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  checkInBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  durationGrid: { flexDirection: 'row', gap: SPACING.sm },
  durationChip: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5 },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
});
