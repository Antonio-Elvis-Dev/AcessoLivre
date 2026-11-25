import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '../src/store/auth'
import { useTheme } from '../src/theme'

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } }),
  )
  const hydrate = useAuth((s) => s.hydrate)
  const { colors, highContrast, font } = useTheme()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={highContrast ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontSize: font(18), fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Início' }} />
          <Stack.Screen name="local/[id]" options={{ title: 'Local' }} />
          <Stack.Screen name="local/novo" options={{ title: 'Cadastrar local' }} />
          <Stack.Screen name="avaliar/[id]" options={{ title: 'Avaliar local' }} />
          <Stack.Screen name="login" options={{ title: 'Entrar' }} />
          <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
          <Stack.Screen name="termos" options={{ title: 'Termo de uso e privacidade' }} />
          <Stack.Screen name="meus-dados" options={{ title: 'Meus dados' }} />
          <Stack.Screen name="excluir-conta" options={{ title: 'Excluir conta' }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
