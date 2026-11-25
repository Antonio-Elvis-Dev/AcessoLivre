import { router, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { AppText } from '../../src/components/AppText'
import { Button } from '../../src/components/Button'
import { Card, Screen } from '../../src/components/Screen'
import { useMe } from '../../src/hooks/queries'
import { useText } from '../../src/i18n/texts'
import { useAuth } from '../../src/store/auth'
import { useSettings } from '../../src/store/settings'
import { spacing, TOUCH_MIN, useTheme } from '../../src/theme'

function SettingSwitch({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string
  description: string
  value: boolean
  onValueChange: (v: boolean) => void
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.setting}>
      <View style={styles.flex}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" muted>
          {description}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={description}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.surface}
        style={styles.switch}
      />
    </View>
  )
}

export default function ProfileScreen() {
  const t = useText()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const settings = useSettings()
  const { data: me } = useMe()

  useEffect(() => {
    navigation.setOptions({
      title: t('profileTitle').text,
      headerTitleAccessibilityLabel: t('profileTitle').label,
    })
  }, [navigation, t])

  return (
    <Screen>
      {user ? (
        <Card>
          <AppText variant="title">Olá, {user.name}!</AppText>
          {me ? (
            <AppText>
              {me.stats.points} pontos
              {me.stats.position ? ` · ${me.stats.position}º no ranking` : ''} ·{' '}
              {me.stats.evaluations}{' '}
              {me.stats.evaluations === 1 ? 'local avaliado' : 'locais avaliados'} ·{' '}
              {me.stats.photos} {me.stats.photos === 1 ? 'foto' : 'fotos'}
            </AppText>
          ) : null}
        </Card>
      ) : (
        <Card>
          <AppText variant="title">{t('welcome').text}</AppText>
          <AppText>
            Para avaliar locais, confirmar avaliações e entrar no ranking, entre na sua conta.
          </AppText>
          <Button label="Entrar" icon="log-in" onPress={() => router.push('/login')} />
          <Button
            label="Criar conta"
            variant="secondary"
            icon="person-add"
            onPress={() => router.push('/cadastro')}
          />
        </Card>
      )}

      <Card>
        <AppText variant="subtitle" accessibilityRole="header">
          Acessibilidade do app
        </AppText>
        <SettingSwitch
          label="Alto contraste"
          description="Fundo preto com textos e botões em cores fortes."
          value={settings.highContrast}
          onValueChange={(v) => settings.set({ highContrast: v })}
        />
        <SettingSwitch
          label="Texto maior"
          description="Aumenta os textos do app, além do tamanho escolhido no celular."
          value={settings.largeText}
          onValueChange={(v) => settings.set({ largeText: v })}
        />
        <SettingSwitch
          label="Jeito nordestino de falar"
          description="Usa expressões regionais nos títulos. O leitor de tela sempre lê a versão simples."
          value={settings.regionalLanguage}
          onValueChange={(v) => settings.set({ regionalLanguage: v })}
        />
      </Card>

      <Card>
        <AppText variant="subtitle" accessibilityRole="header">
          Privacidade
        </AppText>
        <Button
          label="Termo de uso e privacidade"
          variant="secondary"
          icon="document-text"
          onPress={() => router.push('/termos')}
        />
        {user ? (
          <>
            <Button
              label="Ver meus dados"
              variant="secondary"
              icon="folder-open"
              onPress={() => router.push('/meus-dados')}
            />
            <Button
              label="Sair da conta"
              variant="secondary"
              icon="log-out"
              onPress={async () => {
                await signOut()
                queryClient.clear()
              }}
            />
            <Button
              label="Excluir minha conta"
              variant="danger"
              icon="trash"
              onPress={() => router.push('/excluir-conta')}
            />
          </>
        ) : null}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  setting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: TOUCH_MIN },
  flex: { flex: 1, gap: 2 },
  switch: { minWidth: TOUCH_MIN, minHeight: TOUCH_MIN },
})
