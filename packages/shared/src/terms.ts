/**
 * Termo de uso e política de privacidade (LGPD, RNF02), em linguagem simples.
 * Ao mudar o texto, aumente TERMS_VERSION: o aceite fica registrado com a versão.
 */
export const TERMS_VERSION = '2026-11-25'

export const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'O que é o AcessoLivre',
    body: 'Um app feito pela comunidade para mostrar se os lugares da cidade são acessíveis. As informações vêm das avaliações das pessoas que usam o app.',
  },
  {
    title: 'Quais dados guardamos',
    body: 'Só o necessário: seu nome de exibição, seu e-mail e sua senha (guardada de forma protegida, ninguém consegue lê-la). Também guardamos as avaliações, fotos e votos que você enviar.',
  },
  {
    title: 'Sua localização',
    body: 'Se você permitir, o app usa sua localização apenas no seu celular, para centralizar o mapa perto de você. Ela não é enviada nem guardada pelo AcessoLivre.',
  },
  {
    title: 'O que fica público',
    body: 'Suas avaliações, fotos e comentários aparecem para todos com o seu nome de exibição. Seu e-mail nunca é mostrado.',
  },
  {
    title: 'Fotos',
    body: 'Fotografe o lugar (rampas, portas, banheiros, placas). Evite mostrar o rosto de pessoas ou placas de carros.',
  },
  {
    title: 'Seus direitos',
    body: 'Você pode ver todos os seus dados e excluir sua conta a qualquer momento na tela Perfil. Ao excluir, apagamos sua conta, suas avaliações, fotos e votos.',
  },
  {
    title: 'Respeito',
    body: 'Avalie com sinceridade e respeito. Comentários ofensivos ou falsos podem ser removidos.',
  },
]
