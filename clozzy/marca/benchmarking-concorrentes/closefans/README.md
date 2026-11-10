# CloseFans — inspeção (Clozzy benchmarking)

Site: https://close.fans/ · card: `Trello/Clozzy 2028/Backlog/Inspecionar CloseFans-…` · https://trello.com/c/JFzUjNaW

## Conta lab

| Campo | Valor |
|-------|--------|
| E-mail | `closefans.bench@brsupply.email` |
| Senha | `Cl0seFansBench26!` |
| CDP | `closefans` · `:9264` · `~/chrome-profiles/closefans` |
| Tipo | Fan logado · display `Closefans.bench` · signup só e-mail+senha+18+ (sem confirmação prévia) |

Credenciais espelhadas em [`credenciais-closefans.txt`](credenciais-closefans.txt).

## Escopo desta entrega

Inspeção **pública** + **área logada fan** (feed, Descobrir/lista, busca, highlights, settings). Sem KYC creator completo; sem checkout Pix real. `/wallet` redireciona ao onboarding creator.

## Prints mobile (canônico)

Pasta [`prints/mobile/`](prints/mobile/) — viewport iPhone `390×844 @3x`.

| Print | Tela |
|-------|------|
| `01-landing` | Home pública |
| `02-login` | Login |
| `03-signup` | Cadastro (`/signin`) |
| `04-onboarding` | Venda seu conteúdo (signup creator) |
| `05-closebot` | CloseBot landing |
| `06-termos` | Termos de uso |
| `07-privacidade` | Aviso de privacidade |
| `08-ajuda` | Central de ajuda |
| `09-help-ia` | Help — modelo IA |
| `10-help-closebot` | Help — o que é CloseBot |
| `11-help-taxa` | Help — taxas |
| `12-help-criador` | Categoria criador |
| `13-help-assinante` | Categoria assinante |
| `14-blog` | Blog |
| `15-blog-funcionalidades` | Blog — ferramentas |
| `50-feed` … `54-chat` | Área logada (mobile) |

### Desktop logado (2026-11-10)

| Print | Tela |
|-------|------|
| `40–45` | Login inválido → signup → `/my-feed` |
| `50-feed` | Feed Para você / Seguindo |
| `51-discover` | **Lista influenciadores** (Descobrir) |
| `52-search` / `53-highlights` | Rankings Black Friday / Em alta |
| `58-settings` | Configurações |
| `57-wallet` | Redireciona onboarding creator (5 passos) |

Desktop completo em [`prints/desktop/`](prints/desktop/).

## Docs

- **Documento único:** [`benchmarking-closefans.html`](benchmarking-closefans.html) / [`benchmarking-closefans.pdf`](benchmarking-closefans.pdf)
- [`funcionalidades.md`](funcionalidades.md)
- [`ia.md`](ia.md)

## App

**Sem app nativo** nas stores. Help: Web App / “Instalar o App” (atalho navegador).

## Diferencial vs Privacy

- Pitch **3 em 1**: site + **Bot Telegram (CloseBot)** + integração automática
- Taxa **20% + tarifa fixa** por venda (Pix/cartão/boleto)
- **CloseMatch** (troca / contratar divulgação entre criadoras)
- IA: **ban** de perfil com imagens geradas por IA / deepfake (help + Termos 5.3.A)

## Rollback desta pasta

```bash
rm -rf clozzy/marca/benchmarking-concorrentes/closefans
# CDP: node -e "import {removeCdp} from './screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs'; removeCdp('closefans',{deleteProfile:true})"
```
