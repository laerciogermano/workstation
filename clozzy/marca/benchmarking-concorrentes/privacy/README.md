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

## Prints

Pasta [`prints/desktop/`](prints/desktop/) e [`prints/mobile/`](prints/mobile/) — mesmo nome em ambos.

| Print | Tela |
|-------|------|
| `02-login` | Login (Email/CPF + senha + OAuth) |
| `03-signup` / `03b-signup-creator` | Cadastro assinante / toggle creator |
| `16-ready-submit` | Form preenchido + checklist senha + termos |
| `18-submit-result` | Pós-submit → login + toast confirmação e-mail |
| `19`–`20` | Tentativa login pré-confirmação |
| `25-email-confirm` | Conta validada com sucesso |
| `26-login-ready` | Login preenchido pós-confirmação |
| `27-logged-home` | Onboarding pós-login (`/topcreators?tab=destaques`) |
| `33-destaques` | Home Destaques (logado) |
| `34-tab-em-alta` | Em alta |
| `35-search` | Busca |
| `36-messages` | Chat/messages |
| `37-notifications` | Notificações |
| `21`–`24` | Help / Termos / Blog features / Como funciona |

## Docs

- [`funcionalidades.md`](funcionalidades.md) — inventário web + “app”
- [`ia.md`](ia.md) — política / produto / promessa IA

## App

**Não há app nativo** nas stores. Experiência mobile = web responsiva + “Adicionar à tela inicial” (PWA-like). Ver prints `mobile/`.

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
