import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { AppText } from '../src/components/AppText'
import { Button } from '../src/components/Button'
import { Card, Screen } from '../src/components/Screen'
import { TextField } from '../src/components/TextField'
import { api } from '../src/services/api'
import { useAuth } from '../src/store/auth'
import { useTheme } from '../src/theme'

/** Exclusão da conta e dos dados (LGPD). Pede a senha para evitar exclusão acidental. */
export default function DeleteAccountScreen() {
  const { colors } = useTheme()
  const signOut = useAuth((s) => s.signOut)
  const queryClient = useQueryClient()
  const [password, setPassword] = useState('')

  const del = useMutation({
    mutationFn: () => api.deleteMe(password),
    onSuccess: async () => {
      await signOut()
      queryClient.clear()
      router.dismissAll()
      router.replace('/perfil')
    },
  })

  return (
    <Screen>
      <AppText variant="title">Excluir minha conta</AppText>
      <Card>
        <AppText>Ao excluir, apagamos para sempre:</AppText>
        <AppText>• sua conta (nome, e-mail e senha);</AppText>
        <AppText>• todas as suas avaliações, comentários e fotos;</AppText>
        <AppText>• seus votos em avaliações de outras pessoas.</AppText>
        <AppText>Os locais que você cadastrou continuam no mapa, sem o seu nome.</AppText>
      </Card>
      <TextField
        label="Digite sua senha para confirmar"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      {del.isError ? (
        <AppText color={colors.danger} accessibilityLiveRegion="assertive">
          {(del.error as Error).message}
        </AppText>
      ) : null}
      <Button
        label="Excluir conta para sempre"
        variant="danger"
        icon="trash"
        disabled={!password}
        loading={del.isPending}
        onPress={() => del.mutate()}
      />
      <Button label="Cancelar" variant="secondary" onPress={() => router.back()} />
    </Screen>
  )
}
