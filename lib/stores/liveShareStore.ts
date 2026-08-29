import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/authStore';
import { watchPosition, type GeoPoint } from '@/lib/geo';

interface LiveShareState {
  active: boolean;
  durationMinutes: number;
  startedAt: number | null;
  token: string;
  lastLocation: GeoPoint | null;
  startSharing: (durationMinutes: number) => Promise<void>;
  stopSharing: () => Promise<void>;
}

let shareUnsub: (() => void) | null = null;

export const useLiveShareStore = create<LiveShareState>((set, get) => ({
  active: false,
  durationMinutes: 0,
  startedAt: null,
  token: '',
  lastLocation: null,

  startSharing: async (durationMinutes) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const token = `${user.id}-${Date.now().toString(36)}`;
    set({ active: true, durationMinutes, startedAt: Date.now(), token });

    await supabase.from('activity_log').insert({
      user_id: user.id,
      type: 'location_shared',
      title: 'Live Location Sharing Started',
      description: durationMinutes === 0 ? 'Sharing until manually stopped' : `Sharing for ${durationMinutes} minutes`,
      metadata: { token, duration: durationMinutes },
    });

    if (shareUnsub) shareUnsub();
    shareUnsub = await watchPosition(
      async (point) => {
        if (!get().active) return;
        set({ lastLocation: point });
        await supabase.from('location_updates').insert({
          user_id: user.id,
          share_token: get().token,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy: point.accuracy,
          speed: point.speed,
          heading: point.heading,
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );

    // Auto-stop after duration
    if (durationMinutes > 0) {
      setTimeout(() => {
        if (get().active) get().stopSharing();
      }, durationMinutes * 60 * 1000);
    }
  },

  stopSharing: async () => {
    const user = useAuthStore.getState().user;
    if (shareUnsub) {
      shareUnsub();
      shareUnsub = null;
    }
    if (user) {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        type: 'location_shared',
        title: 'Live Location Sharing Stopped',
        description: 'Location sharing ended by user',
      });
    }
    set({ active: false, durationMinutes: 0, startedAt: null, token: '', lastLocation: null });
  },
}));
