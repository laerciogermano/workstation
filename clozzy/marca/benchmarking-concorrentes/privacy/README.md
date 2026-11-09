# Privacy — inspeção (Clozzy benchmarking)

Site: https://privacy.com.br/ · card: `Trello/Clozzy 2028/Backlog/Inspecionar Privacy-…`

## Conta lab

| Campo | Valor |
|-------|--------|
| User | `benchclozzy342` |
| E-mail | `benchmarking@brsupply.email` |
| Senha | `Pr!vacyBench26` |
| CDP | `benchmarking` · `:9263` · `~/chrome-profiles/benchmarking` |
| Tipo | Assinante (fan); creator = onboarding separado + KYC |

Credenciais espelhadas em [`credenciais-privacy.txt`](credenciais-privacy.txt).

## Prints mobile (canônico)

Pasta [`prints/mobile/`](prints/mobile/) — **1 print por página**, sem repetidos (hash). Viewport iPhone `390×844 @3x`.

Recapturar:

```bash
cd clozzy/marca/benchmarking-concorrentes/privacy
node capture-mobile.mjs
```

| Print | Tela |
|-------|------|
| `01-login` | Auth login |
| `02-signup` | Cadastro assinante |
| `03-signup-creator` | Cadastro creator (toggle) |
| `04-help` | Central de ajuda |
| `05-termos` | Termos (`/termos`) |
| `06-como-funciona` | Como funciona |
| `07-blog-features` | Blog — guia de funcionalidades |
| `10-destaques` | Destaques (bottom nav “Em alta” = esta home) |
| `11-top-creators` | Ranking Top Creators |
| `12-feed` | Feed |
| `15-search` | Busca |
| `16-chat` | Conversas |
| `17-notifications` | Notificações (Laranjinha) |
| `18-wallet` | Recarregar carteira |
| `19-settings` | Configurações de perfil |
| `20-user-menu` | Menu do usuário |

**Antes → depois:** mobile tinha dezenas de PNGs com hashes iguais (feed copiado como wallet/chat/etc.). Agora só páginas distintas. Desktop em [`prints/desktop/`](prints/desktop/) ainda é legado (inclui passos de signup).

## Docs

- **Documento único:** [`benchmarking-privacy.html`](benchmarking-privacy.html) / [`benchmarking-privacy.pdf`](benchmarking-privacy.pdf)
- [`funcionalidades.md`](funcionalidades.md) — inventário web + “app”
- [`ia.md`](ia.md) — política / produto / promessa IA

## App

**Não há app nativo** nas stores. Experiência mobile = web responsiva + “Adicionar à tela inicial” (PWA-like).

## E-mail lab (pré-requisito do cadastro)

Mailcow reinstalado na Contabo `185.250.37.82`; DNS Hostinger `brsupply.email`:

- A `mail` → `185.250.37.82`
- SPF `ip4:185.250.37.82`
- DKIM atualizado pós-Mailcow novo
- HTTPS `https://mail.brsupply.email/` (LE)

**Antes → depois:** MX apontava para VPS morta `144.126.154.90` → Contabo atual + Mailcow novo.  
**Rollback DNS:** A `mail` / SPF de volta para `144…` (só se o host antigo voltar). Rollback Mailcow: `docker compose down` em `/opt/mailcow-dockerized` + remover site nginx `mail-brsupply`.

## Rollback desta pasta

```bash
rm -rf clozzy/marca/benchmarking-concorrentes/privacy
# CDP: node -e "import {removeCdp} from './screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs'; removeCdp('benchmarking',{deleteProfile:true})"
```
