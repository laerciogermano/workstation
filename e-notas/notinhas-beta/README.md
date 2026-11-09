# notinhas.shop Beta — front + back

Implementação completa do **notinhas.shop Beta 1.0** (repositório interno `e-notas`): escaneie o QR da NFC-e, o preço vira índice público (com loja e data), a comunidade liga o código de barras e todo mundo acha o menor preço perto de casa.

- **Base de produto:** [`../beta-docs/`](../beta-docs/README.md) (PRD, histórias Gherkin, contratos, ADRs) e o **protótipo v2.0** [`../beta-docs/prototipos/v2/`](../beta-docs/prototipos/v2/index.html) — todas as telas T-xx estão implementadas ([rastreio](docs/TRACEABILITY.md)).
- **Boas práticas:** [`../../core/definir-projeto-moderno/`](../../core/definir-projeto-moderno/README.md) — arquitetura lean C4 + ADR, TS strict, Postgres, UI/motion 2026.
- **Reaproveitado do lab** ([`../app/`](../app/README.md)): parser da DANFE SEFAZ-PR, categorias canônicas, regras de vínculo EAN, dados reais de SJP (`npm run db:import-lab`).

## Stack

| Camada | Escolha |
|---|---|
| Monorepo | npm workspaces · TypeScript 5 `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `erasableSyntaxOnly` |
| Domínio | `packages/domain` — funções puras (RN-10 ranking, RN-11 destaque, RN-13 cotação/split, GTIN, chave NFC-e, dinheiro em centavos) |
| Contratos | `packages/contracts` — Zod nas entradas, DTOs tipados, catálogo de erros RFC 9457 |
| API | `apps/api` — Node 22 · Express 5 modular (feature modules + portas/adaptadores) · `pg` · Pino · Helmet · rate limit · JWT 15 min + refresh rotativo |
| Web | `apps/web` — React 19 · Vite 6 · React Router 7 (View Transitions) · TanStack Query 5 · Motion · Leaflet/OSM · zxing (QR/EAN) · PWA |
| Banco | PostgreSQL 16 · schema `notinhas` (configurável) · migrations SQL versionadas |
| Testes | Vitest (domínio, API contra Postgres real, componentes com Testing Library) |

## Rodar local

Pré-requisitos: Node ≥ 22.12 e um Postgres 16 (o container do lab `enotas-postgres` em `127.0.0.1:5432` serve; ou `docker compose up -d` para um novo).

```bash
cd e-notas/notinhas-beta
cp .env.example .env            # gere JWT_SECRET e FINGERPRINT_PEPPER (comando no arquivo)
npm install
npm run db:migrate              # cria o schema `notinhas`
npm run db:import-lab           # opcional: notas reais do lab (schema enotas → notinhas)
npm run db:seed                 # dados do protótipo v2 + admin (senha impressa no terminal)
npm run dev                     # API :4174 + web :5188 (proxy /api)
```

Abra http://localhost:5188. Backoffice: `/admin` com `admin@notinhas.local`.

> A câmera exige HTTPS fora de `localhost` (RN-07). Para testar no celular, use o nginx/certs do deploy ou `vite --host` atrás de um túnel HTTPS.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run verify` | typecheck (`tsc -b`) + ESLint + checagem de marca + todos os testes |
| `npm test` | Vitest em `domain`, `api` (integração usa schema `notinhas_test`, descartável) e `web` |
| `npm run build` | bundle da API (`tsup`, JS compilado) + build da web (Vite + service worker) |
| `npm start` | API compilada (`apps/api/dist/main.js`); servir `apps/web/dist` no nginx |

## Produção

**https://notinhas.shop/** na Contabo (`/opt/notinhas-beta`, `notinhas-api`, nginx + LE).  
Passos e rollback: [`deploy/README.md`](deploy/README.md).

## Estrutura

```text
packages/
  domain/        regras puras (sem I/O) + testes
  contracts/     Zod + DTOs + erros (fonte única entre API e web)
apps/
  api/
    migrations/  0001_init.sql, 0002_… (imutáveis depois de aplicadas)
    src/
      modules/   identity · receipts · barcodes · catalog · lists · spending · admin · points
      jobs/      geocodificação, nova tentativa SEFAZ, preço fora da curva (em processo)
      shared/    env (Zod), db, logger, http (erros, CSRF, contexto), segurança, e-mail
      scripts/   migrate, seed-demo, import-lab
    test/        parser SEFAZ (fixture) + integração com Postgres real
  web/
    src/
      app/       shell, rotas (T-xx), skeleton
      features/  produtos · nota · lojas · listas · notas · conta · admin
      ui/        componentes do DS (tokens --nt-*), mapa, gráfico, sheet, toast
      lib/       api (CSRF, fingerprint, refresh), sessão, localização, queries
      styles/    tokens.css (DESIGN.md v2 + escuro preto) e app.css
docs/            ARCHITECTURE.md (lean C4), adr/, TRACEABILITY.md, FUTURE.md
deploy/          nginx, systemd, Dockerfile
```

## Decisões principais

Ver [`docs/adr/`](docs/adr/). Resumo: monorepo TS com domínio e contratos compartilhados (ADR-0001); front em React SPA no lugar do vanilla do lab (ADR-0002); jobs em processo, sem Redis no Beta (ADR-0003); índice de preços em snapshot com as regras puras do domínio (ADR-0004); schema novo com posse separada do índice público (ADR-0005); identidade anônima por fingerprint com HMAC e sessão com refresh rotativo (ADR-0006).

## Diferenças conscientes em relação ao lab

- Item da nota é único por **linha** (`receipt_id, line_no`), não por código: o lab descartava produtos repetidos na mesma nota (ex.: nota da Formosa com 15 itens guardou 4).
- Posse da nota (`receipt_owners`) fica fora das tabelas fiscais: o índice público não tem nenhuma coluna de pessoa (RN-06).
- Dinheiro em centavos inteiros; datas em `timestamptz`; IDs públicos `uuid`.
- Primeiro vínculo de EAN vale; divergência vira pendência de moderação (Q2), em vez de sobrescrever.
