import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/authStore';
import { watchPosition, type GeoPoint } from '@/lib/geo';
import { getDeviceModelSync } from '@/lib/useDeviceStatus';
import type { EmergencySession } from '@/types';

interface SOSState {
  phase: 'idle' | 'countdown' | 'active';
  countdown: number;
  sessionId: string | null;
  startedAt: number | null;
  contactsNotified: number;
  lastLocation: GeoPoint | null;
  batteryLevel: number | null;
  error: string | null;
  startCountdown: () => void;
  cancelCountdown: () => void;
  activateSOS: (contactsCount: number, batteryLevel: number | null) => Promise<void>;
  stopSOS: (reason: 'resolved' | 'cancelled') => Promise<void>;
  reset: () => void;
  setError: (error: string | null) => void;
}

let locationUnsub: (() => void) | null = null;

export const useSOSStore = create<SOSState>((set, get) => ({
  phase: 'idle',
  countdown: 5,
  sessionId: null,
  startedAt: null,
  contactsNotified: 0,
  lastLocation: null,
  batteryLevel: null,
  error: null,

  startCountdown: () => {
    set({ phase: 'countdown', countdown: 5, error: null });
    const interval = setInterval(() => {
      const current = get().countdown;
      if (current <= 1) {
        clearInterval(interval);
        const { activateSOS } = get();
        activateSOS(0, null);
      } else {
        set({ countdown: current - 1 });
      }
    }, 1000);
  },

  cancelCountdown: () => {
    set({ phase: 'idle', countdown: 5, error: null });
  },

  activateSOS: async (contactsCount, batteryLevel) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'You must be signed in to activate SOS' });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('emergency_message')
        .eq('id', user.id)
        .maybeSingle();

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id);

      const notifiedCount = contacts?.length ?? contactsCount;

      const { data: session, error } = await supabase
        .from('emergency_sessions')
        .insert({
          user_id: user.id,
          status: 'active',
          message: profile?.emergency_message ?? 'I need immediate assistance. This emergency alert was automatically sent from Sentinel. My live location is attached.',
          contacts_notified: notifiedCount,
          device_model: getDeviceModelSync(),
          battery_level: batteryLevel,
        })
        .select()
        .single();

      if (error || !session) throw new Error(error?.message ?? 'Failed to create emergency session');

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        type: 'sos_activated',
        title: 'Emergency SOS Activated',
        description: `${notifiedCount} contact${notifiedCount === 1 ? '' : 's'} notified`,
        metadata: { session_id: session.id },
      });

      // Log notification
      await supabase.from('notification_logs').insert({
        user_id: user.id,
        type: 'sos_activated',
        title: 'SOS Activated',
        body: 'Your emergency contacts have been notified with your live location.',
        status: 'sent',
      });

      set({
        phase: 'active',
        sessionId: session.id,
        startedAt: Date.now(),
        contactsNotified: notifiedCount,
        batteryLevel,
        error: null,
      });

      // Start watching location
      if (locationUnsub) locationUnsub();
      locationUnsub = await watchPosition(
        async (point) => {
          const sid = get().sessionId;
          if (!sid) return;
          set({ lastLocation: point });
          await supabase.from('location_updates').insert({
            user_id: user.id,
            session_id: sid,
            latitude: point.latitude,
            longitude: point.longitude,
            accuracy: point.accuracy,
            battery_level: get().batteryLevel,
            speed: point.speed,
            heading: point.heading,
          });
          await supabase
            .from('emergency_sessions')
            .update({
              last_lat: point.latitude,
              last_lng: point.longitude,
              last_accuracy: point.accuracy,
              battery_level: get().batteryLevel,
            })
            .eq('id', sid);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to activate SOS', phase: 'idle' });
    }
  },

  stopSOS: async (reason) => {
    const sid = get().sessionId;
    const user = useAuthStore.getState().user;
    if (locationUnsub) {
      locationUnsub();
      locationUnsub = null;
    }
    if (sid && user) {
      await supabase
        .from('emergency_sessions')
        .update({ status: reason, ended_at: new Date().toISOString() })
        .eq('id', sid);
      await supabase.from('activity_log').insert({
        user_id: user.id,
        type: reason === 'resolved' ? 'sos_resolved' : 'sos_cancelled',
        title: reason === 'resolved' ? 'SOS Resolved' : 'SOS Cancelled',
        description: 'Emergency session ended by user',
        metadata: { session_id: sid },
      });
      await supabase.from('notification_logs').insert({
        user_id: user.id,
        type: 'sos_cancelled',
        title: 'SOS Cancelled',
        body: 'Your emergency alert has been cancelled.',
        status: 'sent',
      });
    }
    set({
      phase: 'idle',
      sessionId: null,
      startedAt: null,
      contactsNotified: 0,
      lastLocation: null,
      countdown: 5,
    });
  },

  reset: () => {
    if (locationUnsub) {
      locationUnsub();
      locationUnsub = null;
    }
    set({ phase: 'idle', sessionId: null, startedAt: null, contactsNotified: 0, lastLocation: null, countdown: 5, error: null });
  },

  setError: (error) => set({ error }),
}));
