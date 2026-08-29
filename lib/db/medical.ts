import { supabase } from '@/lib/supabase';
import type { MedicalProfile } from '@/types';

export async function fetchMedicalProfile(userId: string): Promise<MedicalProfile | null> {
  const { data, error } = await supabase
    .from('medical_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as MedicalProfile | null;
}

export async function upsertMedicalProfile(
  userId: string,
  input: Partial<Omit<MedicalProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<MedicalProfile> {
  const { data: existing } = await supabase
    .from('medical_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('medical_profiles')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as MedicalProfile;
  }

  const { data, error } = await supabase
    .from('medical_profiles')
    .insert({ user_id: userId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as MedicalProfile;
}
