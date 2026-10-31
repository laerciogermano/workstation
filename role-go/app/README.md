# RoleGo App v0.1 — E01 Conta, onboarding e perfil

Primeira versão funcional do RoleGo: **front React (Vite)** + **back NestJS**, cobrindo o épico [E01](../epics.md#e01--conta-onboarding-e-perfil). Telas e visual vêm do protótipo [`../web/`](../web/README.md) (identidade v1, tokens `--rg-*`), agora com API, banco e sessão de verdade.

```
app/
├── api/   NestJS 11 + TypeORM (SQLite) — porta 3000, prefixo /api
└── web/   React 19 + Vite — porta 5173, proxy /api → :3000
```

## Rodar local

```bash
# terminal 1 — API
cd app/api
npm install --cache /tmp/npm-cache-rolego
cp .env.example .env        # troque JWT_SECRET (openssl rand -hex 32)
npm run dev

# terminal 2 — front
cd app/web
npm install --cache /tmp/npm-cache-rolego
npm run dev                 # http://localhost:5173
```

Testes de API (banco em memória): `cd app/api && npm run test:e2e`.

Sem SMTP configurado, o link de “Esqueci minha senha” aparece no log da API.

## Escopo E01 entregue

| Item do épico | Tela | API |
|---|---|---|
| Criar conta (e-mail, senha, confirmar) | `/cadastro` | `POST /api/auth/register` |
| Entrar com Google | `/cadastro`, `/login` | `POST /api/auth/google` (code do popup GIS) |
| Entrar com Apple | `/cadastro`, `/login` | `POST /api/auth/apple` (id_token verificado no JWKS da Apple) |
| Login e-mail/senha | `/login` | `POST /api/auth/login` |
| Recuperar / redefinir senha | `/recuperar-senha`, `/redefinir-senha?token=` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Logout | `/perfil` | `POST /api/auth/logout` |
| Preferências de tipo de evento | `/onboarding/preferencias` | `PATCH /api/me/preferences` |
| Cidade | `/onboarding/cidade` | idem |
| Permissão de localização (grava lat/lng) | `/onboarding/localizacao` | idem |
| Raio 1–100 km | `/onboarding/raio` | idem + `POST /api/me/onboarding/complete` |
| Entrar no app com preferências aplicadas | `/home` | `GET /api/me` |
| Foto de perfil (JPG/PNG/WebP, até 5 MB) | `/perfil/foto` | `PUT` / `DELETE /api/me/photo` |
| Editar nome e e-mail | `/perfil/editar` | `PATCH /api/me` |

Outros: `GET /api/catalog` (opções do onboarding), `GET /api/auth/providers` (quais logins sociais estão ligados).

## Regras implementadas

- Sessão em cookie `httpOnly` (`SameSite=Lax`, `Secure` em produção), JWT de 30 dias.
- Rotas do front: sem sessão → `/login`; com sessão e onboarding pendente → `/onboarding/preferencias`; telas de entrada redirecionam quem já está logado.
- E-mail normalizado (minúsculo, sem espaços); e-mail duplicado → 409 no cadastro e na edição.
- Senha com bcrypt; login com erro genérico (“E-mail ou senha incorretos.”).
- Redefinição: token aleatório guardado como sha256, vale 1 h, uso único; ao redefinir, as sessões antigas caem. “Esqueci minha senha” responde igual para e-mail com ou sem conta.
- Google/Apple: acha a conta pelo ID do provedor; se não achar, vincula pelo e-mail **verificado**; se não houver conta, cria.
- Foto: o tipo é conferido pelos bytes do arquivo (não pelo que o navegador informa); nome aleatório; a foto antiga é apagada.
- Rate limit: 10 req/min por IP em `/auth/*`, 5 a cada 15 min em `forgot-password`.
- Onboarding só conclui com tipos de evento e cidade definidos; raio validado entre 1 e 100.

## Configuração (`api/.env`)

Ver [`api/.env.example`](api/.env.example). Para ligar os logins sociais:

- **Google:** OAuth Client “Web application” no Google Cloud; origem JS autorizada = URL do front. Preencher `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
- **Apple:** Services ID com “Sign in with Apple”, domínio e return URL cadastrados. Preencher `APPLE_CLIENT_ID` (Services ID) e `APPLE_REDIRECT_URI`.

Sem essas variáveis os botões continuam na tela e mostram “Login com Google/Apple ainda não está disponível.” (a API responde 503).

## Produção (notas)

- Front: `cd web && npm run build` → servir `web/dist/` com fallback de SPA para `index.html`.
- API: `cd api && npm run build && NODE_ENV=production node dist/main.js` (a API não sobe sem `JWT_SECRET` forte). O nginx precisa encaminhar `/api/` para `127.0.0.1:3000` e aceitar uploads de 5 MB (`client_max_body_size 6m`).
- `DB_PATH` e `UPLOAD_DIR` em volume persistente. `DB_SYNC=true` cria as tabelas na 1ª subida; depois de estabilizar, desligar e passar para migrations.
- O deploy atual (`../deploy/`) publica só o protótipo estático; o deploy desta versão (systemd/pm2 + bloco `location /api/`) ainda não foi feito.

## Antes → depois / rollback

- **Antes:** protótipo `../web/` com estado só em memória (dados somem no refresh; Google/Apple simulados; reset de senha só visual).
- **Depois:** `app/` com API Nest, banco SQLite, sessão, upload de foto, reset por e-mail e login social real (quando configurado). Mudanças visíveis em relação ao protótipo: sem o menu lateral de navegação de telas; nova tela `/redefinir-senha`; Home sem o selo “stub E02”; no celular a moldura de aparelho some e a tela ocupa a viewport toda.
- **Voltar:** `rm -rf role-go/app` (o protótipo `role-go/web` não foi alterado).
