# Architecture Decision Records — Beta

Formato curto (Contexto → Decisão → Consequências → Alternativas). Um ADR novo é **acrescentado**, nunca editado: quando muda a decisão, cria-se outro que substitui o anterior.

| # | Decisão | Status |
|---|---|---|
| [ADR-001](#adr-001) | PWA mobile-first em vez de app nativo no Beta | Aceito |
| [ADR-002](#adr-002) | Monorepo pnpm + Turborepo, TypeScript ponta a ponta | Aceito |
| [ADR-003](#adr-003) | NestJS como monólito modular | Aceito |
| [ADR-004](#adr-004) | PostgreSQL + PostGIS | Aceito |
| [ADR-005](#adr-005) | Drizzle ORM com migrations SQL | Aceito |
| [ADR-006](#adr-006) | Geocoding ViaCEP + Nominatim atrás de port | Aceito |
| [ADR-007](#adr-007) | Filas com pg-boss | Aceito |
| [ADR-008](#adr-008) | JWT curto (EdDSA) + refresh token rotativo + passkeys | Aceito |
| [ADR-009](#adr-009) | CSS Modules + tokens (sem framework de UI) | Aceito |
| [ADR-010](#adr-010) | Mídia em disco com StoragePort | Aceito |
| [ADR-011](#adr-011) | E-mail transacional com Mailcow (SMTP próprio) + React Email | Aceito |
| [ADR-012](#adr-012) | Observabilidade com Grafana (LGTM + Faro) e OpenTelemetry | Aceito |
| [ADR-013](#adr-013) | PostHog para analytics de produto | Proposto |
| [ADR-014](#adr-014) | Sem venda in-app no Beta; valores informativos + link externo | Aceito |
| [ADR-015](#adr-015) | Fase do evento calculada, não persistida | Aceito |
| [ADR-016](#adr-016) | Simplificações da primeira implementação do Beta | Aceito |

---

<a id="adr-001"></a>
## ADR-001 — PWA mobile-first no Beta
**Contexto:** o objetivo é validar o loop rapidamente numa cidade. As lojas (Apple/Google) acrescentam semanas de revisão e o custo de dois builds. O link compartilhado no WhatsApp precisa abrir o evento direto, sem instalar nada.
**Decisão:** React PWA instalável, layout para celular 360–430 px.
**Consequências:** (+) um código, deploy instantâneo, deep link nativo pela web. (−) iOS limita a instalação e o push (irrelevante, push está fora do beta); sem acesso a câmera/QR nativo (desnecessário sem ingressos).
**Alternativas:** React Native/Expo (adiado para depois do beta, aproveitando `contracts` e a lógica dos hooks); Flutter (troca de linguagem, descartado).

<a id="adr-002"></a>
## ADR-002 — Monorepo pnpm + Turborepo
**Contexto:** front e back compartilham contratos; agentes de IA rendem mais com o contexto num só lugar.
**Decisão:** monorepo `apps/*` + `packages/*`, pnpm workspaces, Turborepo para cache de build/test.
**Consequências:** um PR muda contrato + API + web atomicamente. É preciso disciplina de fronteiras (eslint `import/no-restricted-paths`).
**Alternativas:** repositórios separados (descasa os contratos); Nx (mais pesado do que precisamos).

<a id="adr-003"></a>
## ADR-003 — NestJS como monólito modular
**Contexto:** o domínio tem cerca de 11 módulos com regras de acesso finas; o time conhece Nest (v0.1).
**Decisão:** NestJS 11, um módulo por bounded context, camadas `domain/application/infra/http`.
**Consequências:** DI facilita os fakes nos testes; a estrutura previsível ajuda a IA. Overhead de decorators aceitável.
**Alternativas:** Fastify puro/Hono (menos estrutura para o time); microserviços (prematuro).

<a id="adr-004"></a>
## ADR-004 — PostgreSQL + PostGIS
**Contexto:** busca por raio com filtros, ordenação por distância e privacidade de coordenadas.
**Decisão:** Postgres 16 com PostGIS (`geography`), `pg_trgm` e `unaccent` para busca.
**Consequências:** consultas geográficas exatas e indexadas; a busca textual não precisa de Elastic. Exige a imagem `postgis/postgis`.
**Alternativas:** SQLite/Haversine (v0.1, não escala nem indexa); MongoDB 2dsphere (perde relacional e transações simples).

<a id="adr-005"></a>
## ADR-005 — Drizzle ORM
**Contexto:** precisamos de SQL geográfico expressivo, tipagem forte e migrations revisáveis.
**Decisão:** Drizzle ORM (schema em TS, `sql` template para PostGIS) + drizzle-kit para gerar migrations SQL versionadas no git.
**Consequências:** queries tipadas sem a "mágica" de entidades; as migrations são SQL legível no PR.
**Alternativas:** TypeORM (decorators, migrations frágeis); Prisma (PostGIS só por `$queryRaw`, tipos se perdem).

<a id="adr-006"></a>
## ADR-006 — Geocoding
**Contexto:** o organizador informa o endereço e precisamos de coordenadas. O custo deve ficar perto de zero no beta.
**Decisão:** `GeocodingPort` com o adapter `ViaCepNominatimGeocoder`: o CEP preenche o endereço (ViaCEP), depois o endereço vira coordenadas (Nominatim, ≤ 1 req/s, User-Agent próprio, cache de 30 dias em `geocode_cache`). Fallback: o organizador usa a localização atual do aparelho.
**Consequências:** custo zero; a precisão às vezes fica no nível da rua (aceitável para o raio). Trocar para Google Geocoding é só um adapter novo + uma env var.
**Alternativas:** Google Places Autocomplete (melhor UX, custo por requisição; reavaliar depois do beta).

<a id="adr-007"></a>
## ADR-007 — Filas com pg-boss
**Contexto:** e-mails, processamento de imagem e crons; uma VPS só.
**Decisão:** pg-boss no Postgres; o worker é um processo separado com o mesmo código.
**Consequências:** sem Redis; jobs transacionais com o banco (outbox natural). O limite de throughput (cerca de milhares de jobs/min) sobra para o beta.
**Alternativas:** BullMQ + Redis (mais um serviço para operar).

<a id="adr-008"></a>
## ADR-008 — Autenticação: JWT curto + refresh rotativo + passkeys
**Contexto:** queremos autenticação stateless no caminho quente (nenhum SELECT por request), pronta para o app nativo e para serviços futuros (chat, ingressos), sem abrir mão de revogação (reset de senha, bloqueio, exclusão). Também queremos um login mais moderno que senha.
**Decisão:**
1. **Access token JWT** assinado com **EdDSA (Ed25519)** via `jose`, validade de **10 min**. Claims: `sub`, `role`, `org` (id do organizador, se houver), `amr` (`pwd|google|apple|passkey`), `sid` (família do refresh), `jti`, `iat`, `exp`, `iss=rolego.com.br`, `aud=rolego-api`. Na web vai no cookie `rg_at` (httpOnly, Secure, SameSite=Lax, `Path=/api`); clientes nativos usam `Authorization: Bearer`.
2. **Refresh token opaco** (32 bytes) no cookie `rg_rt` (httpOnly, Secure, SameSite=Strict, `Path=/api/v1/auth/refresh`), válido por 30 dias, **rotacionado a cada uso**. A tabela `refresh_tokens` guarda o hash, a `family_id` e o `replaced_by`. **Reuso** de um token já rotacionado → toda a família é revogada (detecção de roubo, padrão OAuth 2.1 / RFC 9700).
3. **Chaves públicas** em `/.well-known/jwks.json` com `kid`; rotação a cada 90 dias (a chave anterior continua publicada até expirar).
4. **Revogação imediata** (bloqueio/exclusão/reset): revoga as famílias de refresh + publica `sub` numa denylist em memória (TTL 10 min) propagada entre instâncias via Postgres `LISTEN/NOTIFY`.
5. **Passkeys (WebAuthn)** com `@simplewebauthn/server|browser`: o usuário cria uma passkey depois do onboarding e entra com Face ID/digital, inclusive pelo autofill (conditional UI). Senha, Google e Apple continuam como alternativas.
**Consequências:** (+) validação local da assinatura, sem consulta ao banco; o mesmo token serve web, nativo e serviços; passkey resistente a phishing e mais rápida que senha. (−) Mais peças (rotação, detecção de reuso, JWKS, denylist), cobertas por testes dedicados ([09 §4](09-estrategia-de-testes.md)). O front precisa de refresh silencioso (single-flight no http client).
**Alternativas:** sessão opaca em banco (descartada a pedido do produto: um SELECT por request e acoplamento ao banco); JWT longo sem refresh (sem revogação); PASETO v4 (equivalente em segurança, ecossistema menor); OAuth/OIDC gerenciado (Auth0/Clerk: custo e dados fora; reavaliar com o app nativo).

<a id="adr-009"></a>
## ADR-009 — CSS Modules + design tokens
**Contexto:** identidade forte e específica (preto, neon, Poppins itálico 800, glow); componentes prontos de biblioteca brigariam com a marca.
**Decisão:** `packages/tokens` (CSS custom properties `--rg-*` + espelho em TS) + CSS Modules por componente + um design system próprio em `apps/web/src/ui`.
**Consequências:** controle total do visual, bundle pequeno. Acessibilidade fica por nossa conta (usar `@radix-ui/react-*` headless onde houver diálogo, sheet ou slider).
**Alternativas:** Tailwind (aceitável, mas dilui os tokens nomeados da marca); MUI/Chakra (visual genérico).

<a id="adr-010"></a>
## ADR-010 — Mídia em disco com StoragePort
**Decisão:** `StoragePort` com `LocalDiskStorage` (volume `/media`, servido pelo nginx) no beta; `S3Storage` (Contabo Object Storage/R2) quando houver mais de uma instância. O backup diário inclui o volume.

<a id="adr-011"></a>
## ADR-011 — E-mail transacional com Mailcow
**Contexto:** precisamos de e-mail transacional (verificação, reset de senha, presença confirmada, aprovação, mudança/cancelamento de evento) com domínio próprio, custo fixo e dados sob nosso controle.
**Decisão:** servidor de e-mail **Mailcow (dockerized)** numa **VPS dedicada** `mail.rolego.com.br` (Mailcow quer as portas 25/80/443 e cerca de 6 GB de RAM; não divide a VPS da aplicação). A API envia por **SMTP submission (587, STARTTLS)** com a caixa `nao-responda@rolego.com.br` (senha de aplicativo do Mailcow) via Nodemailer. `EmailPort` com `ConsoleEmail` (dev), `MailpitEmail` (staging/e2e, captura sem enviar) e `SmtpEmail` (prod → Mailcow). Templates em **React Email** versionados no repo.
**Entregabilidade (obrigatório antes do beta):** SPF `v=spf1 mx a:mail.rolego.com.br -all`; DKIM 2048 bits gerado no Mailcow; DMARC `p=quarantine; rua=mailto:dmarc@rolego.com.br`; **PTR/rDNS** do IP apontando para `mail.rolego.com.br` (configurado no painel da Contabo); MTA-STS + TLS-RPT; IP fora das blocklists (Spamhaus, Barracuda); aquecimento gradual (≤ 200 e-mails/dia na 1ª semana); cabeçalho `List-Unsubscribe` nos e-mails não críticos; monitoramento de bounces (o worker lê a caixa de bounce por IMAP e marca e-mails inválidos).
**Consequências:** (+) custo fixo, sem limite por mensagem, dados no Brasil/Europa sob nosso controle, caixas de suporte@/privacidade@ no mesmo servidor. (−) A reputação de IP novo exige aquecimento; operar um servidor de e-mail (atualizações, backup, monitoramento) fica com o time. **Plano B:** relay SMTP de terceiro (Amazon SES/Brevo) configurado como *smarthost* no próprio Mailcow, sem mudar o código.
**Alternativas:** Resend/SES direto (entregabilidade pronta, custo por envio, dados fora); Postfix puro (mais trabalho, sem painel).

<a id="adr-012"></a>
## ADR-012 — Observabilidade com Grafana
**Contexto:** precisamos de logs, métricas, traces, erros do front e alertas, com custo baixo e dados pessoais sob controle (LGPD).
**Decisão:** stack **Grafana LGTM self-hosted** numa VPS de observabilidade (ou na de e-mail, se houver folga): **Loki** (logs), **Prometheus** (métricas, com `blackbox_exporter` para uptime de `/health` e da home), **Tempo** (traces), **Grafana** (dashboards + Alerting → e-mail/Telegram). Coleta por **Grafana Alloy** em cada VPS. A API é instrumentada com **OpenTelemetry** (HTTP, pg, pg-boss) e logs **pino** em JSON com `traceId`/`requestId`. O front usa o **Grafana Faro Web SDK** (erros JS, Web Vitals, sessões anônimas) enviado ao coletor Faro do Alloy. Release = git sha em todos os sinais.
**Dashboards mínimos:** RED por rota (rate, erros, duração p95), feed p95 vs RNF-02, filas pg-boss (pendentes/falhas), e-mails enviados/bounces, Web Vitals (LCP/INP/CLS), erros JS por release, saúde do Postgres (`postgres_exporter`) e da VPS (`node_exporter`).
**Alertas:** 5xx > 2% em 5 min; feed p95 > 400 ms em 10 min; `/health` fora por 2 min; fila `email.send` com mais de 100 pendentes; disco > 80%; backup diário não concluído.
**Consequências:** (+) uma ferramenta para tudo, sem custo por evento, dados sob nosso controle. (−) Operar a stack (retenção: logs 14 dias, métricas 30 dias, traces 7 dias). Alternativa gerenciada: Grafana Cloud (free tier) com o mesmo Alloy; troca só de endpoint.
**Alternativas:** Sentry + Uptime Kuma (descartado a pedido do produto); Datadog/New Relic (custo).

<a id="adr-013"></a>
## ADR-013 — Analytics de produto (Proposto)
**Contexto:** as metas O1–O5 do PRD exigem funis (onboarding, swipe → página → RSVP).
**Decisão proposta:** PostHog Cloud EU, `distinct_id` = UUID pseudônimo do usuário, sem e-mail/nome; plano de eventos em [09 §7](09-estrategia-de-testes.md#7-plano-de-eventos-de-analytics). Precisa de aceite no banner de cookies e de menção na Política de Privacidade.
**Alternativa:** tabela própria `analytics_events` + consultas SQL (sem terceiros; menos ferramentas de funil).

<a id="adr-014"></a>
## ADR-014 — Sem venda in-app no Beta
**Contexto:** o Beta cobre E01–E03; E04 envolve gateway, split e risco regulatório.
**Decisão:** o evento tem `price_items` informativos e um `external_ticket_url` opcional; a confirmação de presença é gratuita (RSVP).
**Consequências:** valida a intenção sem o custo de pagamento. Na 1.2, `price_items` migram para `ticket_types`.

<a id="adr-015"></a>
## ADR-015 — Fase do evento calculada
**Decisão:** o banco guarda só `status` ∈ {DRAFT, PUBLISHED, CANCELLED, REMOVED}; a `phase` (UPCOMING/LIVE/ENDED) é derivada de `startsAt`/`endsAt` e do Clock, no SQL e no domínio.
**Consequências:** sem cron para virar estado e sem inconsistência. Toda regra temporal recebe o `now` do ClockPort.


---

<a id="adr-016"></a>
## ADR-016 — Simplificações da primeira implementação do Beta
**Contexto:** a primeira versão do código cobre os requisitos M de E01–E03 e o backoffice. Algumas escolhas de implementação ficaram mais simples do que o descrito nos documentos, sem mudar contratos nem regras de negócio.
**Decisão:**
1. **Mídia processada na requisição** (sharp gera as variantes WebP na hora); a fila `media.process` fica para quando o storage for S3. Validação por magic bytes e remoção de EXIF continuam iguais.
2. **Templates de e-mail em HTML/texto puro** (`notifications/templates.ts`) no lugar de React Email; o envio continua por SMTP (Mailpit/Mailcow) via fila `email.send`.
3. **Serviços usam o Drizzle diretamente** (sem interfaces de repositório por módulo). Domínio e policies continuam puros e testados; o SQL de leitura de evento está centralizado em `events/infra/event-read.ts`.
4. **Formulários sem react-hook-form**: estado controlado + schemas Zod do `@rolego/contracts`. **Swipe sem `motion`**: pointer events + CSS (bundle inicial de 118 KB gzip).
5. **Testes de integração** usam o banco `rolego_test` do compose de dev (ou o service do CI) em vez de Testcontainers.
6. **`EventCard.scheduled`** (aditivo): indica rascunho ainda sem data. **`GET /events/:id`** (aditivo): detalhe para o dono, usado pelo wizard.
7. Ficam para depois: passkeys (RF-E01-18, S), Apple (RF-E01-03, S), OpenTelemetry/Grafana/Faro, PostHog, leitura de bounces por IMAP e o guia de instalação do PWA no iOS.
**Consequências:** (+) menos código e dependências para o beta fechado. (−) a troca para S3/React Email/repositórios exige refatoração localizada nos pontos listados.
