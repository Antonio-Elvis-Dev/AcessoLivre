# AcessoLivre API

API REST do AcessoLivre (Node.js + TypeScript + Fastify + Prisma + PostgreSQL/PostGIS).

## Rodando

Da raiz do repositório:

```bash
pnpm install
docker compose up -d                  # PostgreSQL 16 + PostGIS (cria também o banco de testes)
cp .env.example apps/api/.env         # ajuste JWT_SECRET
pnpm api db:deploy                    # cria as tabelas (ou db:migrate durante o desenvolvimento)
pnpm api db:seed                      # categorias, perguntas e locais de demonstração
pnpm api osm:import                   # (opcional) locais reais de Arapiraca a partir do OpenStreetMap
pnpm api dev                          # http://localhost:3333 — documentação em /docs
```

Testes (usam o banco `DATABASE_URL_TEST`, limpo a cada caso):

```bash
pnpm api test
```

## Rotas

A documentação interativa (Swagger) fica em `/docs`. Resumo:

| Método | Rota | Auth | Descrição | RF |
|---|---|---|---|---|
| POST | `/auth/register` | | Cria conta (exige `acceptTerms: true`) | RNF02 |
| POST | `/auth/login` | | Retorna o token JWT | |
| GET | `/places` | | Locais por `bbox`, por `lat`/`lng`/`raio` ou lista geral. Filtros `q`, `type`, `seal`, `acessivelPara` | RF01 |
| GET | `/places/:id` | opcional | Selo, aprovação por categoria, destaques, barreiras e avaliações vigentes | RF03 |
| POST | `/places` | ✔ | Cadastra local (recusa duplicado a menos de 50 m) | |
| GET | `/categories` | | Categorias e perguntas ativas | RF02 |
| POST | `/places/:id/evaluations` | ✔ | Envia avaliação (substitui a anterior do mesmo usuário) | RF02 |
| DELETE | `/evaluations/:id` | ✔ | Apaga a própria avaliação | |
| POST | `/evaluations/:id/photos` | ✔ | Foto (multipart, campo `photo`, até 3 por avaliação, 5 MB) | RF02 |
| POST / DELETE | `/evaluations/:id/votes` | ✔ | Confirma, contesta ou retira o voto | RF04 |
| GET | `/ranking` | opcional | Ranking da comunidade e a posição do usuário | RF05 |
| GET / PATCH / DELETE | `/me` | ✔ | Ver todos os dados, mudar o nome, excluir a conta (com senha) | RNF02 |

## Organização

```
src/
├── app.ts               # monta o Fastify (plugins, erros, rotas)
├── server.ts            # inicia o servidor
├── env.ts               # variáveis de ambiente validadas com Zod
├── lib/
│   ├── seal-service.ts  # calcula e grava o selo de um local
│   ├── geo.ts           # consultas PostGIS (bbox, raio, distância)
│   ├── points.ts        # pontuação e ranking (RF05)
│   ├── storage.ts       # fotos em disco + checagem do tipo real da imagem
│   └── evaluation-view.ts
├── plugins/             # prisma, auth (JWT), swagger
└── modules/             # auth, places, categories, evaluations, votes, ranking, me
prisma/
├── schema.prisma
├── migrations/
├── seed.ts / seed-data.ts
scripts/
├── import-osm.ts        # importa locais do OpenStreetMap (Overpass)
└── recalculate-seals.ts # recalcula todos os selos (rodar 1x por dia)
```

O cálculo do selo em si fica em `packages/shared/src/seal.ts`, para o app e a API usarem a mesma regra.

## Decisões

- **Selo em cache no local.** `places.approval`, `seal`, `evaluation_count` e `category_approval` são recalculados a cada avaliação, voto ou exclusão de conta. Assim o mapa lista centenas de locais com uma consulta simples (RNF03). O detalhe do local sempre recalcula na hora. Como o peso de recência muda com o tempo, `pnpm api db:recalc` pode rodar diariamente.
- **Pontos calculados, não acumulados.** O ranking soma as contribuições existentes (avaliações vigentes, fotos, locais, votos, confirmações recebidas). Se alguém apaga uma avaliação ou a conta, a pontuação continua coerente. Pontos: 10 por local avaliado, 3 por foto, 5 por local cadastrado, 1 por voto e 2 por confirmação recebida.
- **Uma avaliação vigente por pessoa e local**, garantida por índice único parcial no banco. As antigas ficam guardadas (aparecem em `GET /me`), mas não contam no selo.
- **Fotos** são aceitas só se o conteúdo for de fato JPEG, PNG ou WebP (checagem dos bytes iniciais), com nome aleatório.
- **LGPD:** a localização do usuário nunca chega à API (o app só manda a área do mapa). `DELETE /me` pede a senha e apaga conta, avaliações, fotos (inclusive os arquivos) e votos; os locais cadastrados ficam, sem autor.
- **Segurança:** bcrypt, JWT, Helmet, CORS configurável e limite de tentativas no login, cadastro e envio de avaliações.
