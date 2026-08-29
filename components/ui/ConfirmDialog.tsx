import { useEffect, useRef } from 'react';
import { StyleSheet, Modal, View, Pressable, Text } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import { Icon, type IconName } from './Icon';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  icon?: IconName;
}

interface ConfirmState extends ConfirmOptions {
  visible: boolean;
  onConfirm: () => void;
}

let confirmRef: ((opts: ConfirmOptions, onConfirm: () => void) => void) | null = null;

export function confirmDialog(opts: ConfirmOptions, onConfirm: () => void) {
  confirmRef?.(opts, onConfirm);
}

export function ConfirmHost() {
  const { theme } = useTheme();
  const [state, setState] = useRefState<ConfirmState>({
    visible: false,
    title: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    confirmRef = (opts, onConfirm) => {
      setState({ ...opts, visible: true, onConfirm });
    };
    return () => { confirmRef = null; };
  }, []);

  const handleClose = () => setState((s) => ({ ...s, visible: false }));

  const handleConfirm = () => {
    state.onConfirm();
    handleClose();
  };

  return (
    <Modal visible={state.visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {state.icon && (
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor:
                    state.variant === 'danger' ? theme.dangerLight : theme.primary + '20',
                },
              ]}
            >
              <Icon
                name={state.icon}
                size={28}
                color={state.variant === 'danger' ? theme.danger : theme.primary}
              />
            </View>
          )}
          <Text style={[styles.title, { color: theme.text }]}>{state.title}</Text>
          {state.message && (
            <Text style={[styles.message, { color: theme.textSecondary }]}>{state.message}</Text>
          )}
          <View style={styles.actions}>
            <Pressable
              style={[
                styles.btn,
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>
                {state.cancelLabel ?? 'Cancel'}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                {
                  backgroundColor: state.variant === 'danger' ? theme.danger : theme.primary,
                },
              ]}
              onPress={handleConfirm}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>
                {state.confirmLabel ?? 'Confirm'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { useState } from 'react';

function useRefState<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const ref = useRef(state);
  ref.current = state;

  const setRef = (updater: T | ((prev: T) => T)) => {
    setState(updater);
  };

  return [ref.current as T, setRef as React.Dispatch<React.SetStateAction<T>>] as const;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as unknown as '700',
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold as unknown as '600',
  },
});
