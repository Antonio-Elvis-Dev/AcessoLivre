# AcessoLivre

App Mobile para quem tem problemas de locomoção.

> **Mapeamento colaborativo de acessibilidade urbana com identidade nordestina.**
> Projeto da disciplina de Tecnologias Sociais e Assistivas (Sistemas de Informação), com piloto em Arapiraca (AL), a partir do IFAL Campus Arapiraca.

Este README descreve **como a aplicação é desenvolvida**: o problema, o escopo, a arquitetura, a stack, a organização do código, o cronograma e como rodar o projeto.

**Andamento:** a API (`apps/api`) e o pacote compartilhado (`packages/shared`) estão implementados e testados. O app mobile (`apps/mobile`) vem em seguida. Detalhes da API em [`apps/api/README.md`](apps/api/README.md).

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Objetivos](#2-objetivos)
3. [Público-alvo e personas](#3-público-alvo-e-personas)
4. [Escopo](#4-escopo)
5. [Requisitos](#5-requisitos)
6. [Arquitetura](#6-arquitetura)
7. [Stack tecnológica](#7-stack-tecnológica)
8. [Modelo de dados](#8-modelo-de-dados)
9. [API REST (planejada)](#9-api-rest-planejada)
10. [Selo de acessibilidade](#10-selo-de-acessibilidade)
11. [Acessibilidade do próprio app](#11-acessibilidade-do-próprio-app)
12. [Identidade nordestina](#12-identidade-nordestina)
13. [Privacidade e LGPD](#13-privacidade-e-lgpd)
14. [Estrutura de pastas](#14-estrutura-de-pastas)
15. [Metodologia e cronograma](#15-metodologia-e-cronograma)
16. [Como rodar](#16-como-rodar)
17. [Testes e validação](#17-testes-e-validação)
18. [Fluxo de trabalho no Git](#18-fluxo-de-trabalho-no-git)
19. [Equipe](#19-equipe)
20. [Referências](#20-referências)

---

## 1. Visão geral

O AcessoLivre é um aplicativo móvel colaborativo (*crowdsourcing*) em que a própria comunidade avalia a acessibilidade de vias e estabelecimentos. A Lei Brasileira de Inclusão (Lei nº 13.146/2015) garante à pessoa com deficiência o direito de ir e vir com autonomia, e a NBR 9050 define os critérios técnicos de acessibilidade, mas faltam dados públicos e atualizados que digam se um local cumpre essas regras.

Soluções como o Wheelmap e o Guiaderodas focam em cadeirantes e em grandes centros. O AcessoLivre se diferencia por:

- **Cobrir diferentes deficiências:** física, visual, auditiva e cognitiva.
- **Construção participativa:** as perguntas de avaliação são definidas junto com pessoas com deficiência e entidades locais.
- **Identidade nordestina:** visual, linguagem e parcerias locais.

Por ser produzido, validado e mantido pelos próprios moradores e poder ser reaplicado em outras cidades sem grandes investimentos, o projeto se enquadra como **tecnologia social** (ITS Brasil).

## 2. Objetivos

**Geral:** desenvolver um aplicativo colaborativo que mapeie a acessibilidade de locais públicos e privados, construído junto com a comunidade e com identidade nordestina.

**Específicos:**

1. Levantar, com pessoas com deficiência e entidades locais, os recursos de acessibilidade mais relevantes para cada tipo de deficiência.
2. Prototipar e desenvolver o aplicativo com avaliação por categorias e um selo de acessibilidade calculado pelas contribuições.
3. Validar a usabilidade do aplicativo com usuários com deficiência no piloto em Arapiraca (AL).

## 3. Público-alvo e personas

Pessoas com deficiência física, visual, auditiva ou intelectual, idosos com mobilidade reduzida e cidadãos engajados na causa da inclusão.

| Persona | Perfil | Cenário de uso |
|---|---|---|
| Carlos, 28, analista de sistemas | Cadeirante | Quer ir a uma lanchonete nova; vê que cinco usuários confirmaram rampa e porta larga. |
| Dona Maria, 75, aposentada | Mobilidade reduzida (andador) | Confere se a calçada e a entrada do posto de saúde são planas e sem degraus. |
| João, 40, professor | Baixa visão | Verifica piso tátil e braille em um órgão público, usando fonte ampliada e alto contraste. |
| Lívia, 33, costureira | Surda, usuária de Libras | Filtra agências bancárias com atendimento em Libras e avisos visuais. |
| Ana, 22, estudante de arquitetura | Sem deficiência, engajada | Registra com foto um piso tátil novo, avalia o local e ganha pontos. |

## 4. Escopo

O prazo de entrega é **06/12/2026**. Para caber nesse prazo, o escopo foi dividido assim:

| Entra no MVP | Opcional (se sobrar tempo) | Fase futura |
|---|---|---|
| RF01, RF02, RF03, RF04 | RF05 (gamificação/ranking) | RF06 (rotas acessíveis) |
| Requisitos de acessibilidade do app (leitor de tela, toque ≥ 44 px, alto contraste) | Fonte OpenDyslexic, pictogramas | Modo offline |
| LGPD básica (consentimento, exclusão de conta) | Filtros avançados por categoria | Parcerias com prefeituras, publicação nas lojas |

## 5. Requisitos

### Funcionais

| Código | Requisito | Prioridade |
|---|---|---|
| RF01 | Visualizar um mapa interativo com marcadores de acessibilidade. | Alta |
| RF02 | Avaliar um local por categorias (mobilidade, deficiência visual, deficiência auditiva, comunicação e cognição, serviços), com foto e comentário opcionais. | Alta |
| RF03 | Exibir um selo de acessibilidade com o percentual de aprovação calculado pelas avaliações da comunidade. | Alta |
| RF04 | Permitir que outros usuários confirmem ou contestem uma avaliação, priorizando as mais recentes. | Alta |
| RF05 | Pontuar contribuições em um ranking da comunidade (gamificação). | Média |
| RF06 | Traçar rotas que priorizem caminhos acessíveis. | Fase futura |

### Não funcionais

| Código | Requisito | Prioridade |
|---|---|---|
| RNF01 | Funcionar em Android e iOS. | Alta |
| RNF02 | Tratar dados pessoais conforme a LGPD (Lei nº 13.709/2018). | Alta |
| RNF03 | Carregar o mapa em até 3 segundos. | Alta |
| RNF04 | Atender às diretrizes de acessibilidade da WCAG 2.2, nível AA. | Alta |

### Categorias de avaliação

As perguntas de cada categoria são de resposta **Sim / Não / Não sei** e serão fechadas após a escuta da comunidade (etapa 1). Exemplos iniciais, a validar:

| Categoria | Exemplos de perguntas |
|---|---|
| Mobilidade | Tem rampa ou entrada sem degrau? A porta tem pelo menos 80 cm? Tem banheiro adaptado? Tem vaga reservada? |
| Deficiência visual | Tem piso tátil? Tem sinalização em braille? O ambiente é bem iluminado e sem obstáculos no caminho? |
| Deficiência auditiva | Tem atendimento em Libras? Tem avisos visuais (painéis, senhas na tela)? |
| Comunicação e cognição | A sinalização usa pictogramas ou linguagem simples? O ambiente é tranquilo? |
| Serviços | A equipe está preparada para atender pessoas com deficiência? Tem atendimento prioritário? |

## 6. Arquitetura

Arquitetura cliente-servidor simples, em três camadas, pensada para uma pessoa desenvolver em poucos dias e para ser reaplicada em outras cidades.

```
┌──────────────────────────────┐
│  App mobile (React Native /  │
│  Expo) — Android e iOS       │
│  • Mapa (OpenStreetMap)      │
│  • Detalhe do local + selo   │
│  • Formulário de avaliação   │
│  • Confirmar / contestar     │
└──────────────┬───────────────┘
               │ HTTPS + JSON (JWT)
┌──────────────▼───────────────┐      ┌────────────────────────┐
│  API REST (Node.js +         │─────▶│ Armazenamento de fotos │
│  TypeScript + Fastify)       │      │ (disco local no MVP;   │
│  • Autenticação              │      │  S3 compatível depois) │
│  • Locais / avaliações       │      └────────────────────────┘
│  • Cálculo do selo           │
│  • Validação (Zod)           │
└──────────────┬───────────────┘
               │ SQL (Prisma + consultas PostGIS)
┌──────────────▼───────────────┐
│  PostgreSQL + PostGIS        │
│  • Locais com geometria      │
│  • Consultas por raio / bbox │
└──────────────────────────────┘
```

**Decisões principais:**

- **Expo** em vez de React Native "puro": evita configurar Android Studio/Xcode e permite testar no celular com o Expo Go, o que acelera o prazo curto.
- **OpenStreetMap** como base do mapa, por ser aberto e colaborativo como o próprio projeto. Os locais podem ser importados do OSM (via Overpass API) para que o mapa de Arapiraca não comece vazio.
- **PostGIS** para buscar locais por proximidade (`ST_DWithin`) e pela área visível do mapa (*bounding box*), o que ajuda a cumprir o RNF03.
- **Monorepo** com app e API no mesmo repositório, compartilhando tipos e as definições de categorias.

## 7. Stack tecnológica

| Camada | Tecnologia | Por quê |
|---|---|---|
| Mobile | React Native com Expo (SDK atual), TypeScript, Expo Router | Multiplataforma (RNF01), desenvolvimento rápido |
| Mapa | `react-native-maps` com camada de tiles do OpenStreetMap (ou MapLibre) | Mapa aberto, sem custo de licença |
| Estado e dados | TanStack Query + Zustand | Cache de requisições e estado simples |
| Back-end | Node.js (LTS), TypeScript, Fastify | API REST leve e rápida |
| Validação | Zod | Mesmo esquema no app e na API |
| ORM | Prisma (com SQL bruto para funções PostGIS) | Migrações e tipos automáticos |
| Banco | PostgreSQL 16 + PostGIS 3 | Dados espaciais |
| Autenticação | JWT (e-mail e senha), senhas com bcrypt | Simples e suficiente para o piloto |
| Infra local | Docker Compose (banco) | Ambiente reproduzível |
| Qualidade | ESLint, Prettier, Vitest/Jest, `eslint-plugin-react-native-a11y` | Código consistente e checagem de acessibilidade |
| Protótipo | Figma | Telas revisadas com a comunidade |

## 8. Modelo de dados

Entidades principais (proposta inicial):

```
users            (id, nome, email, senha_hash, aceitou_termos_em, pontos, criado_em)
places           (id, nome, tipo, endereco, descricao, osm_id?, localizacao GEOGRAPHY(Point), criado_por, criado_em)
categories       (id, slug, nome)                         -- mobilidade, visual, auditiva, comunicacao_cognicao, servicos
questions        (id, category_id, texto, ordem, ativa)
evaluations      (id, place_id, user_id, comentario?, criado_em)
answers          (id, evaluation_id, question_id, resposta)   -- 'sim' | 'nao' | 'nao_sei'
photos           (id, evaluation_id, url, criado_em)
evaluation_votes (id, evaluation_id, user_id, tipo, criado_em) -- 'confirma' | 'contesta' (RF04)
```

- Um usuário pode ter só uma avaliação "vigente" por local; uma nova avaliação substitui a anterior.
- Um usuário vota uma vez por avaliação e não pode votar na própria.
- Índice GIST em `places.localizacao` para as consultas espaciais.

## 9. API REST (planejada)

| Método | Rota | Descrição | RF |
|---|---|---|---|
| POST | `/auth/register` | Cria conta (com aceite dos termos) | RNF02 |
| POST | `/auth/login` | Retorna JWT | |
| GET | `/places?bbox=...` ou `?lat=&lng=&raio=` | Locais na área visível, com selo resumido | RF01 |
| GET | `/places/:id` | Detalhe do local: selo, aprovação por categoria, destaques, avaliações | RF03 |
| POST | `/places` | Cadastra um local novo | |
| GET | `/categories` | Categorias e perguntas ativas | RF02 |
| POST | `/places/:id/evaluations` | Envia avaliação (respostas, comentário) | RF02 |
| POST | `/evaluations/:id/photos` | Envia foto (multipart) | RF02 |
| POST | `/evaluations/:id/votes` | Confirma ou contesta uma avaliação | RF04 |
| GET | `/ranking` | Ranking da comunidade | RF05 |
| GET / DELETE | `/me` | Ver ou excluir os próprios dados | RNF02 |

A documentação interativa será gerada com OpenAPI (Swagger) em `/docs`.

## 10. Selo de acessibilidade

O selo (RF03) mostra o **percentual de aprovação** do local, geral e por categoria. Cálculo proposto:

1. Para cada pergunta, considera-se apenas a avaliação vigente de cada usuário. Respostas "Não sei" são ignoradas.
2. Cada resposta recebe um **peso**:
   - **Recência:** avaliações mais recentes pesam mais (por exemplo, o peso cai pela metade a cada 6 meses).
   - **Confirmações (RF04):** `peso × (1 + 0,25 × confirmações − 0,5 × contestações)`, com mínimo 0.
3. Aprovação da categoria = soma dos pesos de "Sim" ÷ soma dos pesos de "Sim" + "Não".
4. Aprovação geral = média das categorias que têm respostas.
5. Faixas do selo e cor do marcador no mapa:

| Aprovação | Selo | Cor |
|---|---|---|
| ≥ 75% | Acessível | Verde |
| 40% a 74% | Parcialmente acessível | Amarelo |
| < 40% | Pouco acessível | Vermelho |
| Menos de 3 avaliações | Poucas avaliações | Cinza |

A cor nunca é a única informação: o selo também traz texto e ícone, para atender quem não distingue cores. Os pesos e limites são uma proposta inicial e podem ser ajustados após o piloto.

## 11. Acessibilidade do próprio app

O app segue a **WCAG 2.2, nível AA** (RNF04). Critérios que entram no MVP:

- **Leitor de tela:** todos os elementos interativos com `accessibilityLabel`, `accessibilityRole` e `accessibilityHint`; ordem de foco lógica; testado com **TalkBack** (Android) e **VoiceOver** (iOS). O mapa terá uma **visão em lista** equivalente, porque mapas são difíceis de navegar com leitor de tela.
- **Áreas de toque:** mínimo de **44 × 44 px** em todos os botões e controles, para usuários com tremores.
- **Alto contraste:** contraste mínimo de 4,5:1 no tema padrão e um **modo de alto contraste** ativável.
- **Texto escalável:** respeitar o tamanho de fonte do sistema sem quebrar o layout.
- **Linguagem simples** nos textos, sem depender só de cor ou ícone.

Se houver tempo: fonte **OpenDyslexic** como opção e **pictogramas** de apoio para pessoas com deficiência cognitiva.

## 12. Identidade nordestina

- **Visual:** ilustrações e ícones inspirados em xilogravura e cordel, com paleta regional, sem comprometer o contraste exigido pela WCAG.
- **Textual:** tom acolhedor com expressões regionais (por exemplo, "Oxe, esse lugar tá acessível?"), mantendo clareza para leitores de tela (o `accessibilityLabel` usa a versão clara do texto quando necessário).
- **Parcerias locais:** comércios, instituições de ensino e associações de Arapiraca como pontos de divulgação e validação.

## 13. Privacidade e LGPD

Medidas básicas previstas para o MVP (RNF02):

- Coletar só o necessário: nome de exibição, e-mail e senha. A localização do usuário é usada apenas no aparelho, para centralizar o mapa, e **não é armazenada**.
- **Termo de uso e política de privacidade** em linguagem simples, com aceite registrado no cadastro.
- Avaliações aparecem com o nome de exibição; o e-mail nunca é exibido.
- Usuário pode **ver e excluir a conta e seus dados** (`GET/DELETE /me`).
- Senhas com hash (bcrypt), comunicação via HTTPS e segredos em variáveis de ambiente.
- Orientação no envio de fotos para não fotografar rostos ou placas de veículos.

## 14. Estrutura de pastas

Proposta de monorepo:

```
AcessoLivre/
├── apps/
│   ├── mobile/                  # App React Native (Expo)
│   │   ├── app/                 # Telas (Expo Router)
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx    # Mapa
│   │   │   │   ├── lista.tsx    # Lista de locais (alternativa acessível ao mapa)
│   │   │   │   └── perfil.tsx
│   │   │   ├── local/[id].tsx   # Detalhe do local + selo
│   │   │   └── avaliar/[id].tsx # Formulário de avaliação
│   │   ├── src/
│   │   │   ├── components/      # Botões, Selo, Marcador, CardAvaliacao...
│   │   │   ├── services/        # Cliente da API
│   │   │   ├── hooks/
│   │   │   ├── theme/           # Cores, tema de alto contraste, tipografia
│   │   │   └── i18n/            # Textos (tom regional + versão clara)
│   │   └── assets/              # Ícones e ilustrações (xilogravura)
│   └── api/                     # API Node.js
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── places/
│       │   │   ├── evaluations/
│       │   │   ├── votes/
│       │   │   └── ranking/
│       │   ├── lib/             # Cálculo do selo, upload, utilitários
│       │   ├── plugins/         # Auth, CORS, Swagger
│       │   └── server.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts          # Categorias, perguntas e locais de Arapiraca
│       └── tests/
├── packages/
│   └── shared/                  # Tipos e esquemas Zod usados pelo app e pela API
├── docs/
│   ├── escuta/                  # Questionário e resultados da etapa 1
│   ├── prototipo/               # Links e exportações do Figma
│   └── validacao/               # Roteiro e resultados dos testes de usabilidade
├── docker-compose.yml           # PostgreSQL + PostGIS
├── .env.example
└── README.md
```

## 15. Metodologia e cronograma

O projeto combina **desenho participativo** com **desenvolvimento ágil** (Scrum adaptado a um desenvolvedor, com quadro Kanban no GitHub Projects e entregas incrementais). São quatro etapas até a entrega em **06/12/2026**:

### Etapa 1 — Escuta da comunidade (25 a 27/11)

- Questionário (formulário on-line e conversa presencial) com pessoas com deficiência, o **NAPNE do IFAL** e associações locais de Arapiraca.
- Objetivo: definir e priorizar as perguntas de avaliação de cada categoria (mobilidade, visual, auditiva, comunicação e cognição, serviços) e os tipos de local mais importantes.
- **Entrega:** questionário, respostas consolidadas e lista final de perguntas em `docs/escuta/`.

### Etapa 2 — Protótipo navegável (27 a 29/11)

- Protótipo no Figma com as quatro telas centrais: **mapa**, **detalhe do local com selo**, **formulário de avaliação** e **confirmar/contestar avaliação**.
- Revisão rápida com os participantes da etapa 1 antes de implementar.
- **Entrega:** protótipo navegável e ajustes registrados em `docs/prototipo/`.

### Etapa 3 — Desenvolvimento do MVP (29/11 a 04/12)

| Dia | Foco |
|---|---|
| 29/11 | Monorepo, Docker com PostGIS, esquema Prisma, seed com categorias, perguntas e locais de Arapiraca |
| 30/11 | API: autenticação, locais por área, detalhe do local |
| 01/12 | API: avaliações, fotos, votos, cálculo do selo. App: mapa e lista (RF01) |
| 02/12 | App: detalhe do local com selo (RF03) e formulário de avaliação (RF02) |
| 03/12 | App: confirmar/contestar (RF04), cadastro/login, termos e exclusão de conta (LGPD) |
| 04/12 | Revisão de acessibilidade (TalkBack/VoiceOver, toque, contraste), correções. RF05 se houver tempo |

- **Entrega:** MVP funcional rodando em Android (e iOS via Expo Go).

### Etapa 4 — Validação de usabilidade e entrega (04 a 06/12)

- Testes com **3 a 5 usuários** com diferentes deficiências.
- Tarefas: **(1) buscar um local** e **(2) enviar uma avaliação**.
- Métricas: taxa de conclusão de cada tarefa, tempo, erros e sugestões de melhoria (e, opcionalmente, questionário SUS).
- Correções rápidas a partir dos resultados.
- **Entrega final (06/12):** app, código neste repositório, relatório de validação em `docs/validacao/` e apresentação.

## 16. Como rodar

**Pré-requisitos:** Node.js LTS, pnpm, Docker e o app **Expo Go** no celular (ou um emulador Android/iOS).

```bash
# 1. Clonar o repositório
git clone https://github.com/Antonio-Elvis-Dev/AcessoLivre.git
cd AcessoLivre

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente da API
cp .env.example apps/api/.env
# Editar JWT_SECRET (e DATABASE_URL, se não usar o Docker abaixo)

# 4. Subir o banco (PostgreSQL + PostGIS; cria também o banco de testes)
docker compose up -d

# 5. Criar as tabelas e popular dados iniciais
pnpm api db:deploy
pnpm api db:seed        # categorias, perguntas e locais de demonstração
pnpm api osm:import     # opcional: locais reais de Arapiraca vindos do OpenStreetMap

# 6. Iniciar a API (http://localhost:3333, docs em /docs)
pnpm api dev

# 7. Rodar os testes
pnpm api test
pnpm --filter @acessolivre/shared test
```

## 17. Testes e validação

- **API:** testes unitários do cálculo do selo e testes de integração das rotas principais (Vitest + banco de teste).
- **App:** testes de componentes com React Native Testing Library, incluindo checagem de rótulos de acessibilidade.
- **Acessibilidade:** lint com `eslint-plugin-react-native-a11y`, checklist manual da WCAG 2.2 AA e testes reais com TalkBack e VoiceOver.
- **Desempenho:** medir o tempo de carregamento do mapa em celular intermediário (meta de até 3 segundos, RNF03).
- **Usabilidade:** testes com usuários na etapa 4.

## 18. Fluxo de trabalho no Git

- `main` sempre estável; trabalho em branches curtas (`feat/mapa`, `fix/selo`...).
- Commits no padrão *Conventional Commits* (`feat:`, `fix:`, `docs:`...).
- Pull requests pequenos, com a issue relacionada e checklist de acessibilidade.
- Issues e quadro no GitHub Projects organizados pelas etapas do cronograma.

## 19. Equipe

- **Antônio Elvis Pinheiro Nascimento da Silva** — Desenvolvedor Full Stack.

## 20. Referências

- ABNT. **NBR 9050**: acessibilidade a edificações, mobiliário, espaços e equipamentos urbanos. Rio de Janeiro: ABNT, 2020.
- BRASIL. **Lei nº 13.146**, de 6 de julho de 2015. Lei Brasileira de Inclusão da Pessoa com Deficiência.
- BRASIL. **Lei nº 13.709**, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD).
- INSTITUTO DE TECNOLOGIA SOCIAL (ITS BRASIL). **Tecnologia social no Brasil**: direito à ciência e ciência para a cidadania. São Paulo: ITS, 2004.
- W3C. **Web Content Accessibility Guidelines (WCAG) 2.2**. 2023. Disponível em: https://www.w3.org/TR/WCAG22/.
