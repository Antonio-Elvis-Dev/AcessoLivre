import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { loginSchema } from '@acessolivre/shared'
import { AppText } from '../src/components/AppText'
import { Button } from '../src/components/Button'
import { Screen } from '../src/components/Screen'
import { TextField } from '../src/components/TextField'
import { api } from '../src/services/api'
import { useAuth } from '../src/store/auth'
import { useTheme } from '../src/theme'
import { fieldErrors } from '../src/utils/form'

export default function LoginScreen() {
  const { colors } = useTheme()
  const signIn = useAuth((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: async ({ token, user }) => {
      await signIn(token, user)
      if (router.canGoBack()) router.back()
      else router.replace('/')
    },
  })

  function submit() {
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    login.mutate(parsed.data)
  }

  return (
    <Screen>
      <AppText variant="title">Entrar</AppText>
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={errors.email}
      />
      <TextField
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        error={errors.password}
        onSubmitEditing={submit}
      />
      {login.isError ? (
        <AppText color={colors.danger} accessibilityLiveRegion="assertive">
          {(login.error as Error).message}
        </AppText>
      ) : null}
      <Button label="Entrar" icon="log-in" loading={login.isPending} onPress={submit} />
      <Button
        label="Ainda não tenho conta"
        variant="ghost"
        onPress={() => router.replace('/cadastro')}
      />
    </Screen>
  )
}
