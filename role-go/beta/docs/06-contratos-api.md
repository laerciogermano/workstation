# RoleGo Beta — Contratos de API

Base: `https://rolego.com.br/api/v1`. JSON em `camelCase`. Datas em ISO 8601 UTC. Dinheiro em centavos.
Fonte de verdade: os schemas Zod em `packages/contracts`. Este documento é o **índice legível**; o OpenAPI gerado (`/api/docs`) é a referência executável.

## 1. Convenções

| Tema | Regra |
|---|---|
| Autenticação | JWT de acesso (10 min) no cookie `rg_at` ou `Authorization: Bearer`; refresh no cookie `rg_rt`. Rotas sem marcação exigem usuário autenticado; `🌐` = pública; `🛡` = admin; `🎪` = organizador dono do recurso. Token expirado → `401 TOKEN_EXPIRED` (o cliente chama `/auth/refresh` e repete) |
| CSRF | Métodos mutáveis exigem o header `X-Requested-With: rolego` |
| Paginação | Cursor: `?cursor=<opaque>&limit=20` → `{ items, nextCursor }` |
| Erros | Problem Details (RFC 9457) + `code` (ver §10) |
| Idempotência | `PUT/DELETE` de interesse e passe são idempotentes; `POST /rsvp` é idempotente por (evento, usuário) |
| Versionamento | Prefixo `/v1`; mudanças aditivas não sobem a versão |
| Rate limit | Headers `RateLimit-*`; 429 com `Retry-After` |

## 2. Identity (`/auth`)

| Método | Rota | Corpo → Resposta | US |
|---|---|---|---|
| GET 🌐 | `/auth/providers` | → `{ google: bool, apple: bool }` | 01.02 |
| POST 🌐 | `/auth/register` | `{ email, password, passwordConfirm, acceptTerms: true, adult: true }` → `201 Me` + cookies `rg_at`/`rg_rt` | 01.01 |
| POST 🌐 | `/auth/login` | `{ email, password }` → `Me` + cookies | 01.04 |
| POST 🌐 | `/auth/google` | `{ code }` → `Me & { needsConsent: bool }` | 01.02 |
| POST 🌐 | `/auth/apple` | `{ idToken, name? }` → idem | 01.03 |
| POST | `/auth/consent` | `{ acceptTerms: true, adult: true }` → `Me` | 01.02 |
| POST 🌐 | `/auth/refresh` | cookie `rg_rt` → `204` + cookies novos (rotação). Reuso detectado → `401 REFRESH_REUSED` e a família é revogada | — |
| POST | `/auth/logout` | `{ everywhere?: bool }` → `204` (revoga a família atual ou todas) | 01.06 |
| POST 🌐 | `/auth/passkey/login/options` | `{ email? }` → `PublicKeyCredentialRequestOptions` (challenge de 5 min) | 01.15 |
| POST 🌐 | `/auth/passkey/login/verify` | `AuthenticationResponseJSON` → `Me` + cookies (`amr=passkey`) | 01.15 |
| POST | `/auth/passkey/register/options` | → `PublicKeyCredentialCreationOptions` | 01.15 |
| POST | `/auth/passkey/register/verify` | `RegistrationResponseJSON & { deviceName? }` → `Passkey` | 01.15 |
| GET | `/auth/passkeys` | → `Passkey[]` | 01.15 |
| DELETE | `/auth/passkeys/:id` | → `204` | 01.15 |
| GET 🌐 | `/.well-known/jwks.json` | → JWKS (chaves públicas Ed25519 ativas) | — |
| POST 🌐 | `/auth/password/forgot` | `{ email }` → `202` (sempre) | 01.05 |
| POST 🌐 | `/auth/password/reset` | `{ token, password, passwordConfirm }` → `Me` + cookies (todas as famílias anteriores revogadas) | 01.05 |
| POST | `/auth/email/verify/send` | → `202` | 01.14 |
| POST 🌐 | `/auth/email/verify` | `{ token }` → `204` | 01.14 |

## 3. Perfil (`/me`)

| Método | Rota | Corpo → Resposta | US |
|---|---|---|---|
| GET | `/me` | → `Me` | — |
| PATCH | `/me` | `{ name?, email? }` → `Me` | 01.11 |
| PUT | `/me/photo` | multipart `file` → `Me` | 01.11 |
| DELETE | `/me/photo` | → `Me` | 01.11 |
| PATCH | `/me/preferences` | `{ eventTypes?, cityId?, originMode?, location?: {lat,lng}, radiusKm?, filters? }` → `Me` | 01.07–10, 01.12, 02.14, 02.15 |
| POST | `/me/onboarding/complete` | → `Me` (422 se incompleto) | 01.10 |
| PATCH | `/me/privacy` | `{ showPresence }` → `Me` | 01.12 |
| GET | `/me/rsvps?scope=upcoming\|past` | → `Page<EventCard & { rsvpStatus }>` | 01.17 |
| GET | `/me/reviews/pending` | → `EventCard[]` | 03.10 |
| DELETE | `/me` | `{ confirm: "EXCLUIR" }` → `202` | 01.13 |

```ts
type Me = {
  id: string; email: string; emailVerified: boolean; name: string; photoUrl: string | null;
  role: 'user' | 'admin'; needsConsent: boolean; onboarded: boolean; hasPasskey: boolean;
  preferences: { eventTypes: string[]; city: CityRef | null; originMode: 'gps'|'city'|'override';
                 location: { lat: number; lng: number } | null; overrideCity: CityRef | null;
                 radiusKm: number; filters: DiscoveryFilters };
  privacy: { showPresence: boolean };
  organizer: OrganizerRef | null;
}
```

## 4. Catálogo (🌐)

| Método | Rota | Resposta |
|---|---|---|
| GET | `/catalog/event-types` | `{ slug, label, accent }[]` |
| GET | `/catalog/cities?q=` | `{ id, name, uf, launchStatus }[]` |
| GET | `/catalog/cep/:cep` | `{ street, neighborhood, city, uf }` (proxy cacheado do ViaCEP; exige autenticação) |

## 5. Organizador e eventos

| Método | Rota | Corpo → Resposta | US |
|---|---|---|---|
| POST | `/organizer` | `{ displayName, kind, bio?, instagram? }` → `Organizer` | 02.01 |
| PATCH | `/organizer` | parcial → `Organizer` | 02.01 |
| GET 🌐 | `/organizers/:slug` | → `OrganizerPublic & { upcoming: EventCard[], past: EventCard[] }` | 03.13 |
| GET 🎪 | `/events/:id` | → `EventDetail` (visão do dono, usada pelo wizard) | 02.02–07 |
| POST | `/events` | `EventDraftInput` (parcial; título + tipo mínimos) → `EventDetail` (draft) | 02.02 |
| PATCH 🎪 | `/events/:id` | `EventDraftInput` parcial → `EventDetail & { notifiesGoing: number }` | 02.03–07 |
| PUT 🎪 | `/events/:id/cover` | multipart → `EventDetail` | 02.02 |
| POST 🎪 | `/events/:id/geocode` | `{ cep, number, complement? }` ou `{ lat, lng }` → `VenuePreview` | 02.03 |
| GET 🎪 | `/events/:id/publish-check` | → `{ ok: bool, missing: FieldCode[] }` | 02.06 |
| POST 🎪 | `/events/:id/publish` | → `EventDetail` + `shareUrl` | 02.06 |
| POST 🎪 | `/events/:id/cancel` | `{ reason }` → `EventDetail` | 03.09 |
| DELETE 🎪 | `/events/:id` | → `204` (só rascunho) | 02.06 |
| POST 🎪 | `/events/:id/editions` | → `EventDetail` (novo rascunho na mesma série) | 02.10 |
| POST 🎪 | `/events/:id/gallery` | multipart (até 20) → `MediaRef[]` | 02.09 |
| DELETE 🎪 | `/events/:id/gallery/:assetId` | → `204` | 02.09 |
| GET | `/organizer/events?tab=upcoming\|drafts\|past` | → `Page<OrganizerEventCard>` | 02.08 |
| GET 🎪 | `/events/:id/guests?status=pending\|going` | → `Page<Guest>` | 03.06 |
| POST 🎪 | `/events/:id/guests/:userId/approve` / `decline` | → `Guest` | 03.06 |
| POST 🎪 | `/events/:id/guests/approve-all` | → `{ approved, leftPending }` | 03.06 |

## 6. Descoberta

| Método | Rota | Query → Resposta | US |
|---|---|---|---|
| GET | `/discovery/feed` | `types?, from?, to?, radiusKm?, cursor?` → `Page<EventCard>` + `origin` | 02.11 |
| GET | `/discovery/swipe` | idem, sem cursor → `EventCard[]` (≤ 10) | 02.12 |
| GET | `/discovery/list` | idem + `sort=soonest\|nearest` → `Page<EventCard>` | 02.13 |
| GET | `/discovery/count` | idem → `{ total }` (prévia dos filtros/onboarding) | 01.10, 02.14 |
| GET | `/discovery/search` | `q, scope=radius\|city` → `Page<EventCard>` | 02.16 |

Os parâmetros omitidos usam `preferences` do usuário. A origem é resolvida no servidor: `override city → gps → city`.

```ts
type EventCard = {
  id: string; slug: string; title: string; type: { slug: string; label: string; accent: Accent };
  coverUrl: string; coverThumbUrl: string; startsAt: string; endsAt: string; timezone: string;
  scheduled: boolean;                                             // false em rascunho sem data
  ageRating: 'free' | '16' | '18'; peoplePreview: PersonRef[];
  phase: 'upcoming' | 'live' | 'ended'; status: 'published' | 'cancelled';
  venue: { name: string; neighborhood: string; city: string };   // nunca rua/coords aqui
  distanceKm: number;                                             // 0.1 ou 1 km (privado)
  visibility: 'public' | 'private'; priceFromCents: number | null; isFree: boolean;
  counts: { interested: number; going: number };
  viewer: { interested: boolean; rsvp: RsvpStatus | null };
  organizer: { slug: string; name: string; avatarUrl: string | null };
}
```

## 7. Evento e engajamento

| Método | Rota | Corpo → Resposta | US |
|---|---|---|---|
| GET 🌐 | `/events/by-slug/:slug?c=` | → `EventDetail` (presenter por perfil) | 03.01, 03.05 |
| POST | `/events/access-code` | `{ code }` → `{ slug }` (rate limit 5/10 min) | 03.05 |
| GET | `/events/:id/people?kind=going\|interested&cursor=` | → `Page<PersonRef> & { hiddenCount }` | 03.02 |
| PUT | `/events/:id/interest` | → `{ interested: true, counts }` | 03.03, 02.12 |
| DELETE | `/events/:id/interest` | → `{ interested: false, counts }` | 03.03 |
| PUT | `/events/:id/pass` | → `204` | 02.12 |
| DELETE | `/events/:id/pass` | → `204` (desfazer) | 02.12 |
| POST | `/events/:id/rsvp` | `{ accessCode? }` → `{ status, counts, event?: EventDetail }` | 03.04, 03.05 |
| DELETE | `/events/:id/rsvp` | → `{ status: 'cancelled_by_user', counts }` | 03.04 |
| POST | `/events/:id/here` | → `204` (só em LIVE + vai) | 03.08 |
| GET 🌐 | `/events/:id/calendar.ics` | → `text/calendar` | 03.04 |
| GET 🌐 | `/events/:id/reviews?cursor=` | → `Page<Review> & { avg, count }` | 03.11 |
| PUT | `/events/:id/review` | `{ rating, comment? }` → `Review` | 03.10 |
| POST | `/reports` | `{ targetType, targetId, reason, note? }` → `201` | 03.14 |
| GET 🌐 | `/events/:id/editions` | → `{ editions: EventCard[], photos: MediaRef[] }` | 03.12 |

```ts
type EventDetail = EventCard & {
  description: string; ageRating: 'free' | '16' | '18';
  venue: EventCard['venue'] & {
    street?: string; number?: string; complement?: string; cep?: string;
    location?: { lat: number; lng: number };      // só se canSeeExactAddress
    addressLocked: boolean;
  };
  priceItems: { label: string; priceCents: number | null; note?: string }[];
  externalTicketUrl: string | null;
  capacity: number | null; isFull: boolean;
  rating: { avg: number; count: number } | null;
  gallery: MediaRef[]; seriesId: string | null;
  cancelReason: string | null;
  peoplePreview: { going: PersonRef[]; interested: PersonRef[] };
  shareUrl: string;
  viewer: EventCard['viewer'] & { canReview: boolean; isOrganizer: boolean };
  organizerView?: { accessCode: string | null; approvalMode: 'manual'|'auto'; pendingCount: number; views: number };
}
```

## 8. Compartilhamento (fora do `/api`)

| Rota | Resposta |
|---|---|
| `GET /e/:slug?s=wa` | HTML com OG + redirect para `/app/e/:slug` (incrementa `share_clicks`) |
| `GET /o/:slug` | HTML com OG do organizador |
| `GET /media/...` | Arquivo estático (nginx) |

## 9. Admin (🛡 `/admin`)

| Método | Rota | Uso |
|---|---|---|
| GET | `/admin/reports?status=open` | fila |
| POST | `/admin/reports/:id/resolve` | `{ action: 'remove'\|'dismiss'\|'hide_review'\|'block_user', note }` |
| POST | `/admin/users/:id/block` / `unblock` | `{ reason }` |
| POST | `/admin/organizers` | cria organizador sem usuário (`contactEmail`) |
| POST | `/admin/organizers/:id/events` | cria evento em nome dele |
| POST | `/admin/events/:id/restore` | REMOVED → PUBLISHED |
| GET | `/admin/stats` | contagens do beta |

## 10. Códigos de erro (`code`)

| code | HTTP | Mensagem padrão (pt-BR) |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Confira os campos destacados. |
| `UNAUTHENTICATED` | 401 | Entre para continuar. |
| `TOKEN_EXPIRED` | 401 | (silencioso: o cliente faz refresh) |
| `REFRESH_REUSED` | 401 | Por segurança, entre de novo. |
| `PASSKEY_FAILED` | 401 | Não conseguimos confirmar sua passkey. Tente de novo ou use a senha. |
| `FORBIDDEN` | 403 | Você não tem acesso a isso. |
| `NOT_FOUND` | 404 | Não encontramos isso. |
| `EMAIL_TAKEN` | 409 | Este e-mail já tem conta. |
| `INVALID_CREDENTIALS` | 401 | E-mail ou senha incorretos. |
| `ACCOUNT_BLOCKED` | 403 | Sua conta está suspensa. |
| `TOKEN_INVALID` | 410 | Este link expirou. Peça um novo. |
| `CONSENT_REQUIRED` | 428 | Aceite os termos para continuar. |
| `ONBOARDING_INCOMPLETE` | 422 | Falta completar seu perfil. |
| `EMAIL_NOT_VERIFIED` | 403 | Confirme seu e-mail para publicar. |
| `ORGANIZER_REQUIRED` | 403 | Ative o modo organizador. |
| `EVENT_NOT_PUBLISHABLE` | 422 | Falta: … (`missing[]`) |
| `EVENT_NOT_EDITABLE` | 409 | Este evento já terminou. |
| `EVENT_FULL` | 409 | Este rolê está lotado. |
| `EVENT_UNAVAILABLE` | 410 | Este evento não está mais disponível. |
| `ACCESS_CODE_INVALID` | 404 | Código não encontrado. |
| `ADULT_REQUIRED` | 403 | Evento para maiores de 18. |
| `REVIEW_WINDOW_CLOSED` | 422 | O prazo para avaliar acabou. |
| `REVIEW_NOT_ALLOWED` | 403 | Só quem foi pode avaliar. |
| `MEDIA_INVALID` | 415 | Envie JPG, PNG ou WebP. |
| `MEDIA_TOO_LARGE` | 413 | Arquivo muito grande. |
| `GEOCODE_FAILED` | 422 | Não achamos esse endereço. Confira o CEP e o número. |
| `RATE_LIMITED` | 429 | Muitas tentativas. Tente de novo em instantes. |
