import { useThemeStore } from '@/lib/stores/themeStore';
import { lightTheme, darkTheme, type Theme } from '@/lib/theme';
import { createContext, useContext, useMemo } from 'react';

const ThemeContext = createContext<{ theme: Theme; mode: string }>({
  theme: lightTheme,
  mode: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const resolved = useThemeStore((s) => s.resolved);

  const value = useMemo(() => {
    const theme = resolved === 'dark' ? darkTheme : lightTheme;
    return { theme, mode };
  }, [resolved, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): { theme: Theme; mode: string } {
  return useContext(ThemeContext);
}
