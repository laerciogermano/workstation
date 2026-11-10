# Fansly — inventário de funcionalidades

Fonte: inspeção CDP `fansly` :9266 (2026-11-10) + [Help Center](https://help.fansly.com/) + [ToS](https://fansly.com/tos) + [Privacy](https://fansly.com/privacy).

## Cadastro / acesso

- Age gate 18+ (“Enter” / “Leave”) + cookie banner (Essential Only / Accept All)
- Landing: **Sign up** · **Login** · OAuth **X / Google / Twitch**
- Modal “Sign up now”: Username · Email · Password · Confirm Password · requisitos de senha (Strong) · **Join**
- Lab 2026-11-10: `fansly.bench@brsupply.email` / `FanslyBench26` → `/home` **com** banner “email not yet verified”
- Verificação de e-mail: link de ativação (mailbox criada após o 1º envio; resend UI em Settings → Account; **e-mail não chegou** no Mailcow nesta sessão)
- Security: Change Email · Change Password · 2FA (Authy/Google Authenticator) · Sessions
- Delete Account (permanente; aviso de payouts)

## Discovery / fan (UI logada)

- Home `/home`: tabs **All · Subscribed · For You** · saldo `$0` · “Made For You” / Suggestions · Follow · **Streams You Might Like** (live)
- Explore `/explore/discover`: hashtags (#petite, #sexy, …) · Accounts · Live Streams · Who To Follow
- Search `/search`
- Messages `/messages`
- Notifications `/notifications`
- Perfil próprio `/FanslyBench26` (posts)
- Perfil creator público (ex. `/NinaValeBrazil/posts`) — Assinar / Follow / mídia
- Collections · Bookmarks (rotas presentes)
- Wallet balance no topo

## Creator

- Footer / landing: **Become A Creator**
- Settings → Account → **Creator Application → Apply**
- Help: apply as creator / agency/studio; virtual non-photorealistic OK com ID real
- KYC/gov ID (help) — não executado nesta inspeção

## Pagamentos

- Settings → Payments:
  - Cards (Visa / Mastercard / Discover)
  - Bank and local methods (depende do país)
  - Wallet top-ups: **Crypto** · Gift code
  - Billing history: Charges · Wallet activity
- Sem Pix explícito na UI lab (conta BR não listou método local específico)
- Gift codes: só promocionais (anti-fraude “sites que vendem gift codes”)

## Legal / compliance

- Terms · Privacy · USC 2257 · DMCA · Complaints · Reporting NCII
- Help Center (Intercom-like) multi-idioma (EN/ES)
- Operadora: **Select Media LLC** (Maryland) — ToS 21 jul 2026

## App

- Web app; sem app nativo inventariado nesta inspeção

## IA

Ver [`ia.md`](ia.md) — ban fotorealista + ban AI chat sem oversight humano.
