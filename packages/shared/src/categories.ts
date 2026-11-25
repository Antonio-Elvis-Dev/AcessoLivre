/**
 * Categorias e perguntas de avaliação (RF02).
 *
 * As perguntas são uma proposta inicial e devem ser revisadas após a escuta da
 * comunidade (etapa 1). Para mudar uma pergunta já usada em avaliações, desative a
 * antiga (`active: false`) e crie outra com uma nova `key`, para não alterar o
 * sentido das respostas antigas.
 */

export const CATEGORY_SLUGS = [
  'mobilidade',
  'visual',
  'auditiva',
  'comunicacao_cognicao',
  'servicos',
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export interface QuestionDefinition {
  /** Identificador estável da pergunta. Nunca reutilize uma key com outro sentido. */
  key: string
  text: string
  /** Texto de apoio curto, lido também pelo leitor de tela. */
  help?: string
  active?: boolean
}

export interface CategoryDefinition {
  slug: CategorySlug
  name: string
  /** Nome curto para chips e marcadores. */
  shortName: string
  description: string
  questions: QuestionDefinition[]
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    slug: 'mobilidade',
    name: 'Mobilidade',
    shortName: 'Mobilidade',
    description: 'Para cadeirantes, pessoas com andador, muletas ou mobilidade reduzida.',
    questions: [
      {
        key: 'mob_entrada_sem_degrau',
        text: 'Tem rampa ou entrada sem degrau?',
        help: 'Considere a entrada principal ou uma entrada alternativa sinalizada.',
      },
      {
        key: 'mob_porta_larga',
        text: 'A porta de entrada tem pelo menos 80 cm de largura?',
        help: 'Uma cadeira de rodas passa sem dificuldade.',
      },
      {
        key: 'mob_circulacao_livre',
        text: 'Dá para circular por dentro sem degraus ou obstáculos?',
      },
      {
        key: 'mob_banheiro_adaptado',
        text: 'Tem banheiro adaptado?',
        help: 'Com barras de apoio e espaço para cadeira de rodas.',
      },
      { key: 'mob_vaga_reservada', text: 'Tem vaga de estacionamento reservada?' },
      { key: 'mob_calcada_boa', text: 'A calçada em frente é plana e sem buracos?' },
    ],
  },
  {
    slug: 'visual',
    name: 'Deficiência visual',
    shortName: 'Visual',
    description: 'Para pessoas cegas ou com baixa visão.',
    questions: [
      { key: 'vis_piso_tatil', text: 'Tem piso tátil?' },
      { key: 'vis_braille', text: 'Tem sinalização em braille ou relevo?' },
      {
        key: 'vis_iluminacao',
        text: 'O ambiente é bem iluminado e sem obstáculos no caminho?',
      },
      { key: 'vis_contraste', text: 'As placas têm letras grandes e boa cor de contraste?' },
    ],
  },
  {
    slug: 'auditiva',
    name: 'Deficiência auditiva',
    shortName: 'Auditiva',
    description: 'Para pessoas surdas ou com deficiência auditiva.',
    questions: [
      { key: 'aud_libras', text: 'Tem atendimento em Libras?' },
      {
        key: 'aud_avisos_visuais',
        text: 'Tem avisos visuais, como painel de senhas ou mensagens na tela?',
      },
      {
        key: 'aud_atendimento_escrito',
        text: 'A equipe atende por escrito ou por mensagem quando preciso?',
      },
    ],
  },
  {
    slug: 'comunicacao_cognicao',
    name: 'Comunicação e cognição',
    shortName: 'Cognição',
    description: 'Para pessoas com deficiência intelectual, autismo ou dificuldade de leitura.',
    questions: [
      {
        key: 'cog_sinalizacao_simples',
        text: 'A sinalização usa pictogramas ou linguagem simples?',
      },
      { key: 'cog_ambiente_tranquilo', text: 'O ambiente é tranquilo, sem muito barulho?' },
      { key: 'cog_facil_orientar', text: 'É fácil se orientar e achar o que precisa?' },
    ],
  },
  {
    slug: 'servicos',
    name: 'Serviços',
    shortName: 'Serviços',
    description: 'Atendimento e preparo da equipe.',
    questions: [
      {
        key: 'ser_equipe_preparada',
        text: 'A equipe está preparada para atender pessoas com deficiência?',
      },
      { key: 'ser_atendimento_prioritario', text: 'Tem atendimento prioritário?' },
      {
        key: 'ser_cao_guia',
        text: 'O local aceita a entrada de cão-guia?',
      },
    ],
  },
]

export const CATEGORY_BY_SLUG: Record<CategorySlug, CategoryDefinition> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, CategoryDefinition>

export const ANSWER_VALUES = ['sim', 'nao', 'nao_sei'] as const
export type AnswerValue = (typeof ANSWER_VALUES)[number]

export const ANSWER_LABELS: Record<AnswerValue, string> = {
  sim: 'Sim',
  nao: 'Não',
  nao_sei: 'Não sei',
}

export const VOTE_TYPES = ['confirma', 'contesta'] as const
export type VoteType = (typeof VOTE_TYPES)[number]
