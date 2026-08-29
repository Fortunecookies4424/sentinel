import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, FlatList, Modal } from 'react-native';
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
import { fetchContacts, createContact, updateContact, deleteContact, setPrimaryContact } from '@/lib/db/contacts';
import { RELATIONSHIPS, type Contact, type Relationship } from '@/types';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Linking } from 'react-native';

export default function ContactsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('friend');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchContacts(user.id);
      setContacts(data);
    } catch {
      showToast('error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setPhone('');
    setEmail('');
    setRelationship('friend');
    setIsPrimary(false);
    setModalVisible(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone ?? '');
    setEmail(contact.email ?? '');
    setRelationship(contact.relationship);
    setIsPrimary(contact.is_primary);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { showToast('error', 'Name is required'); return; }
    if (!phone.trim() && !email.trim()) { showToast('error', 'Add at least a phone or email'); return; }

    setSaving(true);
    try {
      const input = { name: name.trim(), phone: phone.trim() || '', email: email.trim() || '', relationship, is_primary: isPrimary };
      if (editingContact) {
        await updateContact(editingContact.id, user.id, input);
        showToast('success', 'Contact updated');
      } else {
        await createContact(user.id, input);
        showToast('success', 'Contact added');
      }
      setModalVisible(false);
      loadContacts();
    } catch {
      showToast('error', 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contact: Contact) => {
    if (!user) return;
    confirmDialog({
      title: 'Delete Contact',
      message: `Are you sure you want to remove ${contact.name} from your trusted contacts?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      icon: 'trash-2',
    }, async () => {
      try {
        await deleteContact(contact.id, user.id);
        showToast('success', 'Contact removed');
        loadContacts();
      } catch {
        showToast('error', 'Failed to delete contact');
      }
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => showToast('error', 'Could not open phone app'));
  };

  const renderContact = ({ item, index }: { item: Contact; index: number }) => (
    <Animated.View entering={SlideInRight.delay(index * 50).springify()}>
      <Card elevation={1} padding={SPACING.md} style={{ marginBottom: SPACING.sm + 2 }}>
        <View style={styles.contactRow}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
            <Typography size="md" weight="bold" color={theme.primary}>
              {item.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Typography size="md" weight="semibold" color={theme.text}>{item.name}</Typography>
              {item.is_primary && (
                <View style={[styles.primaryBadge, { backgroundColor: theme.warning + '18' }]}>
                  <Icon name="star" size={12} color={theme.warning} />
                  <Typography size="xs" color={theme.warning} weight="semibold">Primary</Typography>
                </View>
              )}
            </View>
            <Typography size="xs" color={theme.textMuted} style={{ marginTop: 2, textTransform: 'capitalize' }}>
              {item.relationship}
            </Typography>
            {item.phone && <Typography size="sm" color={theme.textSecondary} style={{ marginTop: 2 }}>{item.phone}</Typography>}
          </View>
        </View>
        <View style={styles.contactActions}>
          {item.phone && (
            <Pressable onPress={() => handleCall(item.phone!)} style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.success + '15', opacity: pressed ? 0.7 : 1 }]}>
              <Icon name="phone" size={16} color={theme.success} />
              <Typography size="xs" color={theme.success} weight="medium">Call</Typography>
            </Pressable>
          )}
          {!item.is_primary && (
            <Pressable
              onPress={async () => { await setPrimaryContact(item.id, user!.id); loadContacts(); showToast('success', 'Primary contact set'); }}
              style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.warning + '15', opacity: pressed ? 0.7 : 1 }]}
            >
              <Icon name="star" size={16} color={theme.warning} />
              <Typography size="xs" color={theme.warning} weight="medium">Set Primary</Typography>
            </Pressable>
          )}
          <Pressable onPress={() => openEditModal(item)} style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.accent + '15', opacity: pressed ? 0.7 : 1 }]}>
            <Icon name="edit" size={16} color={theme.accent} />
            <Typography size="xs" color={theme.accent} weight="medium">Edit</Typography>
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.danger + '15', opacity: pressed ? 0.7 : 1 }]}>
            <Icon name="trash-2" size={16} color={theme.danger} />
            <Typography size="xs" color={theme.danger} weight="medium">Delete</Typography>
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Trusted Contacts" subtitle={`${contacts.length} contact${contacts.length === 1 ? '' : 's'}`} large rightIcon="plus" onRightPress={openAddModal} />

      {loading ? (
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <ListSkeleton count={3} />
        </View>
      ) : contacts.length === 0 ? (
        <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
          <EmptyState
            icon="users"
            title="No contacts yet"
            description="Add trusted contacts who will be notified during emergencies. You can set one as your primary contact for faster response."
            action={<Button label="Add Contact" onPress={openAddModal} icon="plus" size="md" />}
          />
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Typography size="lg" weight="bold" color={theme.text}>
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </Typography>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <Icon name="x" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <Input label="Name" value={name} onChangeText={setName} placeholder="Contact name" icon="user" />
            <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 234 567 890" icon="phone" keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="email@example.com" icon="user" keyboardType="email-address" />

            <Typography size="sm" color={theme.textSecondary} style={{ marginBottom: SPACING.sm }}>Relationship</Typography>
            <View style={styles.relationshipGrid}>
              {RELATIONSHIPS.map((rel) => (
                <Pressable
                  key={rel.value}
                  onPress={() => setRelationship(rel.value)}
                  style={[
                    styles.relationshipChip,
                    {
                      backgroundColor: relationship === rel.value ? theme.primary : theme.surface,
                      borderColor: relationship === rel.value ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Typography
                    size="xs"
                    weight="medium"
                    color={relationship === rel.value ? '#FFFFFF' : theme.textSecondary}
                  >
                    {rel.label}
                  </Typography>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.primaryRow}
              onPress={() => setIsPrimary(!isPrimary)}
            >
              <View style={[styles.checkbox, { borderColor: isPrimary ? theme.primary : theme.border, backgroundColor: isPrimary ? theme.primary : 'transparent' }]}>
                {isPrimary && <Icon name="check" size={14} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Typography size="sm" weight="medium" color={theme.text}>Set as primary contact</Typography>
                <Typography size="xs" color={theme.textMuted}>This contact is called first during emergencies</Typography>
              </View>
            </Pressable>

            <View style={{ height: SPACING.md }} />
            <Button label={editingContact ? 'Save Changes' : 'Add Contact'} onPress={handleSave} loading={saving} fullWidth size="lg" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  primaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  contactActions: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  relationshipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  relationshipChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1 },
  primaryRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
