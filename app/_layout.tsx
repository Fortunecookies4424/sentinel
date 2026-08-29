import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { useAuthStore } from '@/lib/stores/authStore';
import { supabase } from '@/lib/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastHost } from '@/components/ui/Toast';
import { ConfirmHost } from '@/components/ui/ConfirmDialog';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { session, initialized, loading, setSession, refreshProfile } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) refreshProfile();
      useAuthStore.setState({ loading: false, initialized: true });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        if (session) await refreshProfile();
        useAuthStore.setState({ loading: false, initialized: true });
      })();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      const onboardingComplete = useAuthStore.getState().onboardingComplete;
      if (onboardingComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } else if (session && inOnboarding) {
      // stay in onboarding until complete
    } else if (session && !inTabs && !inOnboarding) {
      const onboardingComplete = useAuthStore.getState().onboardingComplete;
      if (!onboardingComplete) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [session, initialized, loading, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sos-active" options={{ animation: 'fade' }} />
        <Stack.Screen name="live-share" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <ToastHost />
      <ConfirmHost />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Sora-Regular': Sora_400Regular,
    'Sora-SemiBold': Sora_600SemiBold,
    'Sora-Bold': Sora_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
