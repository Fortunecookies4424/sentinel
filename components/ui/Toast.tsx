import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Easing } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../ThemeProvider';
import { RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import { Icon } from './Icon';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

let toastRef: ((type: ToastType, message: string) => void) | null = null;

export function showToast(type: ToastType, message: string) {
  toastRef?.(type, message);
}

export function ToastHost() {
  const { theme } = useTheme();
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });
  const translateY = useSharedValue(100);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const getColors = useCallback(() => {
    switch (toast.type) {
      case 'success': return { bg: theme.success, icon: 'check-circle' as const };
      case 'error': return { bg: theme.danger, icon: 'x-circle' as const };
      case 'warning': return { bg: theme.warning, icon: 'alert-triangle' as const };
      case 'info': return { bg: theme.accent, icon: 'info' as const };
    }
  }, [toast.type, theme]);

  useEffect(() => {
    toastRef = (type, message) => {
      setToast({ visible: true, type, message });
    };
    return () => { toastRef = null; };
  }, []);

  useEffect(() => {
    if (toast.visible) {
      translateY.value = withSequence(
        withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withDelay(3000, withTiming(100, { duration: 300, easing: Easing.in(Easing.cubic) }))
      );
      const timeout = setTimeout(() => setToast((s) => ({ ...s, visible: false })), 3500);
      return () => clearTimeout(timeout);
    }
  }, [toast.visible]);

  if (!toast.visible) return null;

  const colors = getColors();

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.toast, { backgroundColor: colors.bg }]}>
        <Icon name={colors.icon} size={20} color="#FFFFFF" />
        <Text style={styles.text}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium as unknown as '500',
    flexShrink: 1,
  },
});
