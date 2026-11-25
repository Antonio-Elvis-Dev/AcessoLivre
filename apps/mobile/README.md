# AcessoLivre — app mobile

App em React Native com Expo (SDK 58), Expo Router, TanStack Query e Zustand.

## Rodando

1. Suba a API (veja o README da raiz).
2. Crie `apps/mobile/.env` a partir do `.env.example` com o **IP da sua máquina na rede local**, por exemplo `EXPO_PUBLIC_API_URL="http://192.168.0.10:3333"`. No emulador Android use `http://10.0.2.2:3333`. Sem o `.env`, o app tenta o IP da máquina que roda o Expo.
3. Da raiz: `pnpm mobile start` e leia o QR code com o app **Expo Go** (Android ou iOS, celular na mesma rede Wi‑Fi).

Testes: `pnpm mobile test` · Tipos: `pnpm mobile typecheck`

## Telas

| Tela | Arquivo | Requisito |
|---|---|---|
| Mapa com marcadores pelo selo (cor + ícone), filtros "acessível para", "perto de mim" e "novo local" | `app/(tabs)/index.tsx` | RF01 |
| Lista de locais (alternativa ao mapa para leitor de tela), busca, filtros, ordenação pela distância | `app/(tabs)/lista.tsx` | RF01, RNF04 |
| Detalhe do local: selo, "o que tem aqui", barreiras, aprovação por categoria, avaliações | `app/local/[id].tsx` | RF03 |
| Confirmar / contestar avaliação | `src/components/EvaluationCard.tsx` | RF04 |
| Formulário de avaliação por categoria (Sim / Não / Não sei), comentário e até 3 fotos | `app/avaliar/[id].tsx` | RF02 |
| Cadastrar local | `app/local/novo.tsx` | |
| Ranking | `app/(tabs)/ranking.tsx` | RF05 |
| Perfil: alto contraste, texto maior, linguagem regional, termos, meus dados, excluir conta | `app/(tabs)/perfil.tsx` | RNF02, RNF04 |
| Entrar, criar conta (com aceite dos termos), termos, meus dados, excluir conta | `app/*.tsx` | RNF02 |

## Acessibilidade (WCAG 2.2 AA)

- Todos os controles têm `accessibilityRole`, `accessibilityLabel` e, quando ajuda, `accessibilityHint` e `accessibilityState` (marcado, selecionado, expandido, ocupado).
- Área de toque mínima de **48 px** (`TOUCH_MIN` em `src/theme`), acima dos 44 px pedidos.
- Selo e marcadores usam **cor + ícone + texto**; a cor nunca é a única informação.
- Paleta padrão com contraste ≥ 4,5:1 e **modo de alto contraste** (fundo preto, amarelo/branco).
- Respeita o tamanho de fonte do sistema e tem a opção **texto maior** (+25%).
- Com **leitor de tela ligado**, o mapa mostra um aviso com atalho para a lista.
- Mensagens de erro e confirmações são anunciadas (`accessibilityLiveRegion` / `announceForAccessibility`).
- Expressões regionais são opcionais; o leitor de tela sempre recebe a versão clara do texto.

## Privacidade

A localização do usuário é usada **só no aparelho**: centraliza o mapa e calcula distâncias na lista. Para a API vai apenas a área do mapa (ou uma área de ~10 km arredondada), nunca a posição exata. O token fica no armazenamento seguro do aparelho (`expo-secure-store`). As fotos são reduzidas para 1600 px antes do envio.

## Observações

- O mapa usa os tiles públicos do OpenStreetMap, adequados para o piloto. Para publicar nas lojas, troque `OSM_TILES` em `app/(tabs)/index.tsx` por um provedor de tiles próprio ou contratado, conforme a política de uso do OSM.
- No Android o fundo do Google Maps é desligado (`mapType="none"`) para mostrar só o OpenStreetMap.
