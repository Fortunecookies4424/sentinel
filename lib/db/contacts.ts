import { supabase } from '@/lib/supabase';
import type { Contact, Relationship } from '@/types';

export async function fetchContacts(userId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Contact[];
}

export async function createContact(
  userId: string,
  input: { name: string; phone: string; email: string; relationship: Relationship; is_primary: boolean }
): Promise<Contact> {
  // If marking as primary, unset others first
  if (input.is_primary) {
    await supabase.from('contacts').update({ is_primary: false }).eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({ user_id: userId, ...input })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('activity_log').insert({
    user_id: userId,
    type: 'contact_added',
    title: 'Contact Added',
    description: `${input.name} added as ${input.relationship}`,
  });

  return data as Contact;
}

export async function updateContact(
  contactId: string,
  userId: string,
  input: Partial<{ name: string; phone: string; email: string; relationship: Relationship; is_primary: boolean }>
): Promise<Contact> {
  if (input.is_primary) {
    await supabase.from('contacts').update({ is_primary: false }).eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(input)
    .eq('id', contactId)
    .select()
    .single();
  if (error) throw error;
  return data as Contact;
}

export async function deleteContact(contactId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', contactId);
  if (error) throw error;

  await supabase.from('activity_log').insert({
    user_id: userId,
    type: 'contact_removed',
    title: 'Contact Removed',
    description: 'A trusted contact was deleted',
  });
}

export async function setPrimaryContact(contactId: string, userId: string): Promise<void> {
  await supabase.from('contacts').update({ is_primary: false }).eq('user_id', userId);
  const { error } = await supabase.from('contacts').update({ is_primary: true }).eq('id', contactId);
  if (error) throw error;
}
