import { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  Pressable,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import { RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import { Icon, type IconName } from './Icon';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  icon?: IconName;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  icon,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  multiline = false,
  numberOfLines,
}: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : focused ? theme.primary : theme.border,
            borderWidth: focused ? 2 : 1,
          },
        ]}
      >
        {icon && (
          <Icon name={icon} size={20} color={focused ? theme.primary : theme.textMuted} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            {
              color: theme.text,
              height: multiline ? undefined : 48,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.textMuted} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium as unknown as '500',
    marginBottom: SPACING.xs + 2,
    marginLeft: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    paddingVertical: 0,
  },
  error: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    marginLeft: 2,
  },
});
