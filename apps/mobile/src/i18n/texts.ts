import { useSettings } from '../store/settings'

/**
 * Textos com duas versões: regional (identidade nordestina) e clara.
 * O leitor de tela sempre recebe a versão clara pelo `accessibilityLabel`.
 */
const TEXTS = {
  mapTitle: { regional: 'Oxe, esse lugar tá acessível?', clear: 'Mapa de acessibilidade' },
  listTitle: { regional: 'Os lugares por perto', clear: 'Lista de locais' },
  rankingTitle: { regional: 'Os arretados da acessibilidade', clear: 'Ranking da comunidade' },
  profileTitle: { regional: 'Seu cantinho', clear: 'Perfil' },
  evaluateCta: { regional: 'Bora avaliar este lugar', clear: 'Avaliar este local' },
  thanks: {
    regional: 'Valeu, visse! Sua avaliação ajuda muita gente.',
    clear: 'Obrigado! Sua avaliação foi enviada.',
  },
  emptyList: {
    regional: 'Ainda não tem lugar cadastrado por aqui. Que tal ser o primeiro?',
    clear: 'Nenhum local encontrado nesta área.',
  },
  welcome: {
    regional: 'Bem-vindo, cabra bom! Aqui a gente mapeia junto a acessibilidade da cidade.',
    clear: 'Bem-vindo! Aqui a comunidade mapeia a acessibilidade da cidade.',
  },
} as const

export type TextKey = keyof typeof TEXTS

export function useText() {
  const regional = useSettings((s) => s.regionalLanguage)
  return (key: TextKey) => ({
    text: regional ? TEXTS[key].regional : TEXTS[key].clear,
    label: TEXTS[key].clear,
  })
}
