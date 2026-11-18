# Flow.dev · aplicação (back + front + banco)

Implementação real do protótipo `../prototipo/`: **Explorar + Flow** com dados em PostgreSQL, API REST e front React.
Stack e práticas do pacote `core/definir-projeto-moderno` — decisões em [`docs/ADRs.md`](docs/ADRs.md).

| Camada | Tecnologia |
|---|---|
| Banco | PostgreSQL 18 (schema `flow`), bigint identity + uuidv7 público, FKs indexadas, `text+CHECK`, `timestamptz` |
| API | Node 22 · TypeScript `strict` · Express 5 · Zod · pg · Pino · Helmet/CSP · rate-limit · Argon2id |
| Front | React 19 · Vite · TanStack Query · lucide · CSS/temas do protótipo (12 temas) |
| Compartilhado | `@flow/shared`: contratos Zod, modelo de domínio (layout FOP, validação de contexto, exportação IR/JS/TS/Python) |

## Rodar
```bash
cd flow-dev/app
cp .env.example .env            # ajuste SESSION_SECRET
npm install
npm run db:up                   # Postgres 18 em :55432 (docker compose)
npm run dev                     # API :4180 + web :5180 (migrations rodam no boot)
# opcional: usuário demo → demo@flow.dev / flowdev123
npm run db:seed
```
Abra http://localhost:5180 — **sem tela de login**: cada pessoa entra como visitante com um UUID próprio (guardado no navegador, já com o projeto de exemplo). Em "Salvar com uma conta" ela vincula e-mail e senha ao mesmo UUID; o código também recupera o visitante em outro navegador.

Produção local (1 porta): `npm run build && SERVE_WEB=true npm start`.

## O que existe
- **Visitante por UUID** → vincula conta depois (projetos preservados), vários **projetos**.
- **Explorar**: funções, dados (cubos/folhas, campos filhos), módulos, pessoas, agentes, modelos; busca, sanfonas, menu de contexto, F2/⌘C/⌘X/⌘V/⌘D/Del.
- **Flow**: plano cartesiano sN, barras abstratas×concretas, entradas/saídas □/cubo, sequência, paralelo, seleção (if/senão), repetição (for), camadas/contexto, zoom/pan, modos compacto/por linha, 12 temas.
- **Painéis**: função (responsável, contexto, I/O, assinatura FOP), dado (tipo, valor, módulo, campos), agente (modelo, prompt, foto), modelo, editor de lib Node com execução simulada, catálogo (remoção bloqueada se em uso).
- **Executar vale para tudo**, na ordem dos passos sN: lib Node → o Node executa (sandbox, saídas viram valores do state); agente IA → a IA executa (simulada); pessoa → fica *aguardando* até ela concluir (o fluxo retoma sozinho). Cancelar e tentar de novo e **Exportar** FOP-IR / JavaScript / TypeScript / Python.

## Qualidade
`npm run verify` (typecheck + testes). 20 testes de integração em Postgres real: auth, anti-IDOR, CSRF, Zod, IDR, mutações, sequência, export, sandbox, runner.

## Fora do escopo (igual ao PRD v1)
Board/Gantt/Copiloto; runtimes além de Node; chamada real aos modelos (ADR-004); RLS (ADR-003).
Os modos de render HTML/Canvas do protótipo (experimento de comparação) não foram portados — só SVG.

## Voltar atrás
`npm run db:down` + remover `flow-dev/app/`; banco: `npm run db:migrate -w @flow/api -- down`. O protótipo estático continua intacto.
