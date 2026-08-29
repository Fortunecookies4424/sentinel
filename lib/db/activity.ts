import { supabase } from '@/lib/supabase';
import type { ActivityLogEntry, ActivityType } from '@/types';

export async function fetchActivity(userId: string, limit = 50): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ActivityLogEntry[];
}

export async function logActivity(
  userId: string,
  entry: { type: ActivityType; title: string; description?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  await supabase.from('activity_log').insert({
    user_id: userId,
    type: entry.type,
    title: entry.title,
    description: entry.description ?? null,
    metadata: entry.metadata ?? null,
  });
}
