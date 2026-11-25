import { useState } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { radius, spacing, TOUCH_MIN, useTheme } from '../theme'
import { AppText } from './AppText'

export interface TextFieldProps extends TextInputProps {
  label: string
  error?: string
  help?: string
}

/** Campo de texto com rótulo visível, ajuda e mensagem de erro anunciadas ao leitor de tela. */
export function TextField({ label, error, help, style, multiline, ...props }: TextFieldProps) {
  const { colors, font } = useTheme()
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.wrap}>
      <AppText variant="label" nativeID={`${label}-label`}>
        {label}
      </AppText>
      {help ? (
        <AppText variant="caption" muted>
          {help}
        </AppText>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ? `Erro: ${error}` : help}
        aria-labelledby={`${label}-label`}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : focused ? colors.focus : colors.border,
            fontSize: font(16),
            minHeight: multiline ? 110 : TOUCH_MIN,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  input: {
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
})
