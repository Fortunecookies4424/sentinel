import { supabase } from '@/lib/supabase';
import type { CheckIn } from '@/types';

export async function fetchCheckIns(userId: string): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CheckIn[];
}

export async function createCheckIn(
  userId: string,
  input: { note: string; duration_minutes: number }
): Promise<CheckIn> {
  const dueAt = new Date(Date.now() + input.duration_minutes * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      user_id: userId,
      note: input.note,
      duration_minutes: input.duration_minutes,
      status: 'active',
      due_at: dueAt,
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('activity_log').insert({
    user_id: userId,
    type: 'check_in_scheduled',
    title: 'Check-In Scheduled',
    description: `${input.note} — due in ${input.duration_minutes} min`,
  });

  return data as CheckIn;
}

export async function completeCheckIn(checkInId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('check_ins')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', checkInId);
  if (error) throw error;

  await supabase.from('activity_log').insert({
    user_id: userId,
    type: 'check_in_completed',
    title: 'Check-In Completed',
    description: 'You confirmed you are safe',
  });
}

export async function cancelCheckIn(checkInId: string): Promise<void> {
  const { error } = await supabase
    .from('check_ins')
    .update({ status: 'expired', completed_at: new Date().toISOString() })
    .eq('id', checkInId);
  if (error) throw error;
}
