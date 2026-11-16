# AGENTS.md — e-mail marketing

Antes de mudar: leia [`docs/arquitetura.md`](docs/arquitetura.md) e os [ADRs](docs/adr/).

## Comandos

```bash
npm install
npm run infra:up            # Postgres :5434 + Mailpit :1025/:8025
cp .env.example api/.env
npm run migrate
npm run seed:operator -- voce@connect.com.br 'senha-com-12+'
npm run dev:api & npm run dev:worker & npm run dev:web   # http://localhost:5173
npm run typecheck && npm test                            # testes precisam do Postgres no ar
```

## Regras

- Escopo = CU-01..05 do README. Funcionalidade nova só com novo caso de uso.
- Toda entrada externa passa por zod (`shared/validate.ts`). SQL sempre parametrizado.
- Rota nova em `/api` já nasce protegida (montada depois do `requireAuth`).
- Esquema só muda com migração nova em `api/src/db/migrations/NNNN_*.sql` (nunca editar uma já aplicada). Seguir `core/definir-projeto-moderno/06-banco-postgresql/POSTGRES.md`.
- API expõe só `public_id` (uuid), nunca o `id` bigint.
- Worker: handlers idempotentes; não remover `SKIP LOCKED` nem a recuperação de travas.
- Front: marca Connect (`styles.css`, tokens de `marca/design-system-conect-tech-v1.html`). Sem gradiente, sem fade-up. HTML de campanha só dentro de `<iframe sandbox="">`.
- Testes de UI por papel/rótulo; todo controle precisa de nome acessível.
