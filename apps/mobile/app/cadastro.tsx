import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { registerSchema } from '@acessolivre/shared'
import { AppText } from '../src/components/AppText'
import { Button } from '../src/components/Button'
import { Screen } from '../src/components/Screen'
import { TextField } from '../src/components/TextField'
import { api } from '../src/services/api'
import { useAuth } from '../src/store/auth'
import { spacing, TOUCH_MIN, useTheme } from '../src/theme'
import { fieldErrors } from '../src/utils/form'

export default function RegisterScreen() {
  const { colors } = useTheme()
  const signIn = useAuth((s) => s.signIn)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const register = useMutation({
    mutationFn: api.register,
    onSuccess: async ({ token, user }) => {
      await signIn(token, user)
      router.dismissAll()
      router.replace('/')
    },
  })

  function submit() {
    const parsed = registerSchema.safeParse({ name, email, password, acceptTerms: accepted })
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    register.mutate(parsed.data)
  }

  return (
    <Screen>
      <AppText variant="title">Criar conta</AppText>
      <AppText muted>
        Só pedimos o necessário. Seu e-mail nunca aparece para outras pessoas.
      </AppText>
      <TextField
        label="Nome de exibição"
        help="É o nome que aparece nas suas avaliações e no ranking."
        value={name}
        onChangeText={setName}
        autoComplete="name"
        error={errors.name}
      />
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />
      <TextField
        label="Senha"
        help="Pelo menos 8 caracteres."
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        error={errors.password}
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="Li e aceito o termo de uso e a política de privacidade"
        onPress={() => setAccepted((v) => !v)}
        style={styles.check}
      >
        <Ionicons
          name={accepted ? 'checkbox' : 'square-outline'}
          size={32}
          color={colors.primary}
        />
        <AppText style={styles.flex}>
          Li e aceito o termo de uso e a política de privacidade.
        </AppText>
      </Pressable>
      <Button
        label="Ler o termo de uso e privacidade"
        variant="ghost"
        icon="document-text"
        onPress={() => router.push('/termos')}
      />
      {errors.acceptTerms ? (
        <AppText variant="caption" color={colors.danger}>
          {errors.acceptTerms}
        </AppText>
      ) : null}

      {register.isError ? (
        <AppText color={colors.danger} accessibilityLiveRegion="assertive">
          {(register.error as Error).message}
        </AppText>
      ) : null}
      <View>
        <Button
          label="Criar conta"
          icon="person-add"
          loading={register.isPending}
          onPress={submit}
        />
      </View>
      <Button label="Já tenho conta" variant="ghost" onPress={() => router.replace('/login')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  check: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: TOUCH_MIN },
  flex: { flex: 1 },
})
