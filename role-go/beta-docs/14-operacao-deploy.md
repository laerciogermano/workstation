# RoleGo Beta — Operação, infraestrutura e deploy

## 1. Ambientes

| Ambiente | URL | Onde | Dados | Deploy |
|---|---|---|---|---|
| Local | `localhost:5173` (web) / `:3000` (api) | docker compose dev (postgis + mailpit) | seed | — |
| Staging | `staging.rolego.com.br` | VPS app (Contabo, compose `rolego-staging`) | seed + testes | automático a cada merge na `main` |
| Produção | `rolego.com.br` | VPS app (compose `rolego-prod`) | reais | manual com aprovação (GitHub Environment) |
| Mail | `mail.rolego.com.br` | VPS mail + obs (Mailcow) | e-mails | manual (runbook) |
| Observabilidade | `grafana.rolego.com.br` | VPS mail + obs (LGTM) | telemetria | manual |

Em `rolego.com.br` (`/opt/rolego/web`) está o **protótipo Beta HTML** ([`prototipos/index.html`](prototipos/index.html)); o SPA Vite E01 ficou em `/opt/rolego/web-e01-vite-bak`. No BETA-607 esse root passa a ser o build de produção. Rollback: [`../deploy/README.md`](../deploy/README.md).

## 2. Topologia

```mermaid
flowchart LR
  subgraph A[VPS app · 144.126.154.90]
    N[nginx host + certbot]
    subgraph P[compose rolego-prod]
      API[api]
      WK[worker]
      DB[(postgis)]
    end
    subgraph S[compose rolego-staging]
      API2[api]
      WK2[worker]
      DB2[(postgis)]
      MP[mailpit]
    end
    AL[Grafana Alloy]
  end
  subgraph B[VPS mail + observabilidade]
    MC[Mailcow]
    G[Grafana + Loki + Prometheus + Tempo]
    AL2[Alloy + blackbox]
  end
  N --> API & API2
  API & WK -->|SMTP 587| MC
  API & WK & DB -.OTLP / métricas / logs.-> AL --> G
  AL2 -->|uptime /health| N
  AL2 --> G
```

Dimensionamento sugerido: VPS app 4 vCPU / 8 GB (atual); VPS mail + obs 4 vCPU / 8 GB (Mailcow cerca de 4–6 GB + LGTM cerca de 2 GB). Se faltar memória, as opções são separar o LGTM ou usar o Grafana Cloud free com o mesmo Alloy ([ADR-012](04-adrs.md#adr-012)).

## 3. Containers (VPS app)

`infra/docker-compose.prod.yml` (resumo):
```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    volumes: [ "/srv/rolego/prod/pg:/var/lib/postgresql/data" ]
    env_file: /srv/rolego/prod/.env.db
    networks: [ internal ]
  api:
    image: ghcr.io/rolego/api:${SHA}
    command: ["node", "dist/main.js"]
    env_file: /srv/rolego/prod/.env
    volumes: [ "/srv/rolego/prod/media:/media" ]
    ports: [ "127.0.0.1:3000:3000" ]
    depends_on: [ db ]
    healthcheck: { test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"], interval: 15s }
    networks: [ internal ]
  worker:
    image: ghcr.io/rolego/api:${SHA}
    command: ["node", "dist/worker.js"]
    env_file: /srv/rolego/prod/.env
    volumes: [ "/srv/rolego/prod/media:/media" ]
    networks: [ internal ]
networks: { internal: {} }
```
O nginx host serve `apps/web/dist` (enviado por rsync para `/srv/rolego/prod/web`) e `/media`, e faz proxy de `/api`, `/e/*`, `/o/*` e `/.well-known/jwks.json` para `127.0.0.1:3000`.

## 4. Variáveis de ambiente (API/worker)

| Var | Exemplo | Nota |
|---|---|---|
| `NODE_ENV` | `production` | |
| `APP_URL` | `https://rolego.com.br` | links de e-mail, OG |
| `DATABASE_URL` | `postgres://rolego:***@db:5432/rolego` | |
| `JWT_ISSUER` / `JWT_AUDIENCE` | `rolego.com.br` / `rolego-api` | |
| `JWT_KEK` | 32 bytes base64 | cifra as chaves privadas Ed25519 em `jwt_keys` |
| `ACCESS_TTL_S` / `REFRESH_TTL_D` | `600` / `30` | |
| `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGIN` | `rolego.com.br` / `https://rolego.com.br` | passkeys |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | | |
| `APPLE_CLIENT_ID` / `APPLE_REDIRECT_URI` | | |
| `SMTP_HOST` / `SMTP_PORT` | `mail.rolego.com.br` / `587` | Mailcow (STARTTLS) |
| `SMTP_USER` / `SMTP_PASS` | `nao-responda@rolego.com.br` / senha de app | |
| `MAIL_FROM` | `RoleGo <nao-responda@rolego.com.br>` | |
| `BOUNCE_IMAP_URL` | `imaps://bounces%40rolego.com.br:***@mail.rolego.com.br` | job `email.bounces` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://alloy:4318` | |
| `OTEL_SERVICE_NAME` | `rolego-api` / `rolego-worker` | |
| `FARO_URL` (web, build) | `https://faro.rolego.com.br/collect` | |
| `NOMINATIM_URL` / `NOMINATIM_UA` | `https://nominatim.openstreetmap.org` / `RoleGo/1.0 (contato@rolego.com.br)` | |
| `MEDIA_DIR` | `/media` | |
| `POSTHOG_KEY` | | só depois do consentimento |

A aplicação valida tudo com Zod na subida e não sobe com env inválida.

## 5. Mailcow — runbook de configuração (BETA-011)

1. Contratar a VPS e configurar o **PTR/rDNS** do IP → `mail.rolego.com.br` (painel Contabo) e confirmar que a porta 25 de saída está liberada.
2. DNS (`rolego.com.br`):
   - `A mail` → IP da VPS de e-mail · `MX @` → `mail.rolego.com.br` (prio 10)
   - `TXT @` → `v=spf1 mx a:mail.rolego.com.br -all`
   - `TXT dkim._domainkey` → chave gerada no Mailcow (2048 bits)
   - `TXT _dmarc` → `v=DMARC1; p=quarantine; rua=mailto:dmarc@rolego.com.br; adkim=s; aspf=s` (subir para `p=reject` depois de 30 dias limpos)
   - `CNAME autodiscover/autoconfig` → `mail.rolego.com.br`; MTA-STS (`_mta-sts` + `mta-sts.rolego.com.br`) e `_smtp._tls` (TLS-RPT)
3. Instalar o `mailcow-dockerized` (versão estável), `MAILCOW_HOSTNAME=mail.rolego.com.br`, ACME automático.
4. Criar o domínio `rolego.com.br` e as caixas `nao-responda@` (só envio; senha de app), `bounces@` (Return-Path), `suporte@`, `privacidade@`, `dmarc@`.
5. Endurecer: 2FA no admin, painel restrito por IP/VPN, rate limit por caixa (`nao-responda` 500/h no beta), fail2ban ativo, ClamAV pode ficar desligado se faltar RAM.
6. Validar: mail-tester ≥ 9/10; Gmail "Mostrar original" com SPF/DKIM/DMARC = PASS; caixa de entrada em Gmail, Outlook e iCloud.
7. Aquecimento: semana 1 ≤ 200/dia (time + beta fechado), semana 2 ≤ 1.000/dia, depois livre; acompanhar no Grafana.
8. Backup: `helper-scripts/backup_and_restore.sh` diário para storage externo; testar o restore.
9. Plano B: se a reputação não decolar, configurar um relay (Amazon SES/Brevo) como **sender-dependent transport** no Mailcow. Nada muda na aplicação.

## 6. Grafana — runbook (BETA-012 / BETA-604)

1. Na VPS de observabilidade: compose com `grafana`, `loki`, `prometheus`, `tempo`, `alloy` (com o receiver Faro) e `blackbox_exporter`; volumes persistentes; Grafana em `grafana.rolego.com.br` com 2FA.
2. Na VPS app: `alloy` coletando OTLP (4317/4318 só na rede interna), logs do Docker, `node_exporter` e `postgres_exporter`; envio para a VPS de observabilidade por TLS + basic auth.
3. A API inicia o OpenTelemetry **antes** do Nest (`--import ./otel.js`), com auto-instrumentação http, express, pg e undici + métricas customizadas.
4. O web inicializa o Faro em `main.tsx`, com `beforeSend` removendo PII; release = `VITE_GIT_SHA`.
5. Dashboards versionados em `infra/grafana/dashboards/*.json` (provisioning); alertas versionados em `infra/grafana/alerting/*.yaml` (ver [ADR-012](04-adrs.md#adr-012)).
6. Retenção: Loki 14 d, Prometheus 30 d, Tempo 7 d.

## 7. Pipeline CI/CD

```mermaid
flowchart LR
  PR[Pull request] --> L[lint · typecheck · stylelint]
  L --> U[unit + integração Testcontainers]
  U --> C[contrato + privacidade]
  C --> E[e2e smoke Playwright + Mailpit]
  E --> B[build web + imagem api]
  B -->|merge main| ST[deploy staging: migrate → up → smoke]
  ST -->|aprovação manual| PRD[deploy prod: backup → migrate → up → smoke → anotação no Grafana]
```

Script de deploy (resumo): `ssh deploy@vps "cd /srv/rolego/prod && SHA=$SHA docker compose pull && docker compose run --rm api node dist/migrate.js && SHA=$SHA docker compose up -d && ./smoke.sh"` + `rsync` de `web/dist`. Toda subida cria uma **anotação de release** no Grafana para correlacionar com erros.

## 8. Backup e restore

| O quê | Como | Frequência | Retenção |
|---|---|---|---|
| Postgres prod | `pg_dump -Fc` → cifrado com `age` → storage externo (S3 compatível) | diário 03:00 | 14 diários + 8 semanais |
| `/media` | `restic` → mesmo storage | diário | 14 |
| Mailcow | script oficial de backup | diário | 7 |
| Dashboards/alertas | já ficam no git | — | — |

Teste de restore **mensal** em staging (runbook `infra/runbooks/restore.md`); o alerta "backup não concluído" fica no Grafana.

## 9. Rotação de segredos

| Segredo | Rotação |
|---|---|
| Chaves JWT (Ed25519) | automática a cada 90 dias (nova `kid`; a antiga continua publicada até o último token expirar) |
| `JWT_KEK` | anual ou em incidente (job re-cifra `jwt_keys`) |
| Senha SMTP `nao-responda@` | semestral |
| OAuth Google/Apple | conforme o provedor (a chave da Apple vence em 6 meses) |
| DB | anual |

## 10. Incidentes (resumo)

1. O alerta chega pelo Grafana (e-mail/Telegram) → o responsável reconhece em até 30 min no horário do beta.
2. Diagnóstico pelo dashboard RED → trace (Tempo) → logs (Loki) pelo `traceId`.
3. Mitigação: rollback (`SHA` anterior), feature flag ou modo leitura.
4. Pós-mortem sem culpados em até 48 h para Sev1/Sev2, com uma ação no backlog.
