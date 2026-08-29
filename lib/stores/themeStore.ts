import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  resolveSystem: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function loadStoredMode(): ThemeMode {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('sentinel-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  }
  return 'system';
}

const initialMode = loadStoredMode();
const initialResolved = initialMode === 'system' ? getSystemTheme() : initialMode;

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolved: initialResolved,
  setMode: (mode) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sentinel-theme', mode);
    }
    const resolved = mode === 'system' ? getSystemTheme() : mode;
    set({ mode, resolved });
  },
  toggle: () => {
    const current = get().resolved;
    get().setMode(current === 'dark' ? 'light' : 'dark');
  },
  resolveSystem: () => {
    const mode = get().mode;
    if (mode === 'system') {
      set({ resolved: getSystemTheme() });
    }
  },
}));

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    useThemeStore.getState().resolveSystem();
  });
}
