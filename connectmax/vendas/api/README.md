# vendas/api — perfis LinkedIn → Postgres

API NestJS mínima: recebe POST do extract (`login-extract-profiles`) e persiste cards em PostgreSQL.

**Umbrella:** [`../../README.md`](../../README.md) · **Visão vendas:** [`../README.md`](../README.md) · **Script extract:** [`../../../screen-robot/src/scripts/login-extract-profiles.js`](../../../screen-robot/src/scripts/login-extract-profiles.js)  
**Arquitetura (C4 + classes + sequências):** [`../../docs/arquitetura.md`](../../docs/arquitetura.md)

---

## Antes → depois

| Antes | Depois |
|-------|--------|
| Extract só grava JSON em `screenshots/login-extract-profiles/` | Com `PROFILES_API_URL`, cada perfil também vai para `POST /profiles` |
| Sem persistência central | Tabela `linkedin_profiles` no Postgres |

**Rollback:** pare a API; no extract, não defina `PROFILES_API_URL` (volta só JSON local). Remova o container: `docker compose down -v` nesta pasta.

---

## Subir

```bash
# 1) Postgres — Docker (se o daemon estiver up)
docker compose up -d

# ou Homebrew local (sem Docker):
#   createuser -s connectmax  /  createuser -P connectmax
#   createdb -O connectmax connectmax
#   (senha no .env = DB_PASSWORD)

# 2) API
cp .env.example .env
npm install
npm run start:dev
```

Default: `http://localhost:3000`

---

## Endpoints

### `POST /profiles`

Um perfil (formato do `profileRow` do extract):

```json
{
  "name": "Alexandre Silva",
  "title": "Comprador/Planejador / ...",
  "level": "2nd",
  "connection": "Pending",
  "city": "Belo Horizonte, Minas",
  "mutualConnections": "2 mutual connections",
  "current": "Comprador at Grupo GPS",
  "past": null,
  "extractedAt": "2026-10-13T19:00:00.000Z",
  "round": 1
}
```

Upsert por `(name, current)`.

### `POST /profiles/batch`

```json
{ "profiles": [ { "name": "..." }, ... ] }
```

---

## Extract → API

```bash
# cwd: screen-robot/src
PROFILES_API_URL=http://localhost:3000 npm run login-extract-profiles
```

Sem a env, o script não chama a API (só arquivos locais).

---

## Env

| Var | Default | Efeito |
|-----|---------|--------|
| `PORT` | `3000` | porta HTTP |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | localhost / 5432 / connectmax… | Postgres |
| `DB_SYNC` | `true` | TypeORM `synchronize` (desligar em prod) |
