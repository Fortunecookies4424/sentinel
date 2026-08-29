import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  onboardingComplete: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function loadOnboardingFlag(userId: string | null): boolean {
  if (typeof localStorage === 'undefined' || !userId) return false;
  return localStorage.getItem(`sentinel-onboarding-${userId}`) === 'true';
}

function saveOnboardingFlag(userId: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`sentinel-onboarding-${userId}`, 'true');
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  onboardingComplete: false,
  setSession: (session) => {
    const user = session?.user ?? null;
    set({
      session,
      user,
      onboardingComplete: loadOnboardingFlag(user?.id ?? null),
    });
  },
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setOnboardingComplete: (complete) => {
    const userId = get().user?.id;
    if (complete && userId) saveOnboardingFlag(userId);
    set({ onboardingComplete: complete });
  },
  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) set({ profile: data as Profile });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, onboardingComplete: false });
  },
}));
