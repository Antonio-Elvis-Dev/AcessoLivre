export const PLACE_TYPES = [
  'saude',
  'educacao',
  'servico_publico',
  'banco',
  'comercio',
  'alimentacao',
  'lazer',
  'transporte',
  'religioso',
  'hospedagem',
  'outro',
] as const

export type PlaceType = (typeof PLACE_TYPES)[number]

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  saude: 'Saúde',
  educacao: 'Educação',
  servico_publico: 'Serviço público',
  banco: 'Banco',
  comercio: 'Comércio',
  alimentacao: 'Alimentação',
  lazer: 'Lazer e praças',
  transporte: 'Transporte',
  religioso: 'Religioso',
  hospedagem: 'Hospedagem',
  outro: 'Outro',
}
