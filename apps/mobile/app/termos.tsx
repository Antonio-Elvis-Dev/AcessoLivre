import { TERMS_SECTIONS, TERMS_VERSION } from '@acessolivre/shared'
import { AppText } from '../src/components/AppText'
import { Card, Screen } from '../src/components/Screen'

export default function TermsScreen() {
  return (
    <Screen>
      <AppText variant="title">Termo de uso e política de privacidade</AppText>
      <AppText muted>
        Versão de {TERMS_VERSION.split('-').reverse().join('/')}. Escrito em linguagem simples.
      </AppText>
      {TERMS_SECTIONS.map((s) => (
        <Card key={s.title}>
          <AppText variant="subtitle" accessibilityRole="header">
            {s.title}
          </AppText>
          <AppText>{s.body}</AppText>
        </Card>
      ))}
      <AppText variant="caption" muted>
        Base legal: Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Locais com dados ©
        colaboradores do OpenStreetMap.
      </AppText>
    </Screen>
  )
}
