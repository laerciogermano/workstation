# Brand guidelines — CloseFans (as-is)

> One-pager operacional no molde RoleGo v4 / template `BRAND.md`.  
> **Versão:** 2026-11-11 · auditoria da marca **atual** em produção.  
> Manual: [`identidade-visual-closefans-atual.pdf`](identidade-visual-closefans-atual.pdf) · tokens: [`tokens.css`](tokens.css) · logos: [`logos/`](logos/)

**Domínio canônico:** [close.fans](https://close.fans/) · blog [blog.close.fans](https://blog.close.fans/) · ajuda [ajuda.close.fans](https://ajuda.close.fans/pt-br/)  
**Não é esta marca:** [close.com.br](https://close.com.br/) — produtora de vídeo (Uberlândia/MG), sem relação com CloseFans.

## 1. Essência

- **O que é:** plataforma BR de conteúdo exclusivo — site + bot Telegram + integração (“3 em 1”), com Pix e monetização para criadores.
- **Para quem:** criadores que vendem conteúdo adulto / lifestyle pago; fãs que assinam e compram packs.
- **Personalidade observada:** direta · dark-first · roxo elétrico · Telegram-first · hype de conversão (Black Close, rankings).
- **Posicionamento (site):** “Publique uma vez e esteja em todos os lugares!” · “Conteúdos exclusivos de quem você ama!”
- **Promessa:** Site exclusivo + Bot Telegram + Integração automática · “+ 1 milhão de usuários mensais”.
- **Nome:** Close Fans / CloseFans / Close (curto no produto). Manifest: `"name": "Close Fans"`, `"short_name": "CloseFans"`.

## 2. Logo system (encontrado)

Não há pack SVG público único — variantes baixadas do site, favicon, help e blog:

| Variante | Arquivo | Onde aparece |
|---|---|---|
| Stacked Close preto + fans roxo | `logos/lockup-stacked-close-black-fans-purple.png` | OG / meta `og:image` |
| Stacked branco no preto | `logos/lockup-stacked-white-on-black.png` | Help Crisp |
| Stacked roxo no preto | `logos/lockup-stacked-purple-on-black.png` | Help (“roxo principal”) |
| Mark chave C+F no roxo | `logos/mark-key-app-512.png` | PWA / app icon |
| Mark chave (blog) | `logos/mark-key-blog-192.png` | Favicon blog Wix |
| Wordmark UI horizontal | (raster no produto) | Header feed/landing: “closefans” branco + mark tipo chave no **c** |

**Anatomia do mark:** monograma **C** sobre haste tipo **chave/F** (acesso / unlock). Fundo do ícone ≈ `#47008A`.

**Regras observadas (não oficiais — inferidas):** lowercase no wordmark de produto; stacked “Close” + “fans” no lockup de marketing; dark UI com logo branco; theme `#890AFF`.

### Não fazer (boas práticas — marca alheia)

1. Esticar / distorcer o lockup ou o mark.  
2. Recolorir o mark fora da família roxa/branco/preto.  
3. Glow neon genérico ou misturar com identidade de Privacy/OF.  
4. Usar assets de `close.com.br` como se fossem CloseFans.

## 3. Cor

| Token | Hex | Uso |
|---|---|---|
| `--cf-purple` | `#890AFF` | Theme / tile / CTAs (meta `theme-color`) |
| `--cf-purple-deep` | `#6F00D6` | Ação forte, player (`--plyr-color-main`) |
| `--cf-purple-dark` | `#47008A` | Ícone app, superfícies profundas |
| `--cf-purple-soft` | `#C299FF` | Links, destaque no escuro |
| `--cf-black` | `#050506` | Fundo app / manifest |
| `--cf-surface` | `#1C1D25` | Cards / chrome |
| `--cf-surface-2` | `#42455C` | Scrollbar / secundário |
| `--cf-white` | `#FFFFFF` | Texto principal no dark |
| `--cf-success` | `#19D297` | Online / ok |
| `--cf-danger` | `#D84940` | Erro |
| `--cf-warning` | `#FFD03D` | Alerta / promo |

Proporção observada: ~55 dark · 25 roxo · 15 branco/texto · 5 semântica.

**AA:** branco no `#890AFF` 5.9:1 · branco no `#6F00D6` 7.9:1 · branco no `#050506` 20.4:1 · `#C299FF` no preto 9.0:1 · `#890AFF` no preto 3.4:1 (só grande).

## 4. Tipografia

| Papel | Família | Pesos | Uso |
|---|---|---|---|
| UI / corpo | **Archivo** (Google Fonts) | 300 · 400 · 500 · 700 (+ itálico 400/500) | App, landing, forms |
| Alternativa | **DM Sans** | — | Trechos pontuais no CSS |
| MUI fallback | Roboto / Helvetica / Arial | — | Componentes MUI |

Lockup de marketing usa **display custom** (não é Archivo puro — ink traps / geometria própria). Escala de UI: títulos bold no Archivo; corpo 400; CTAs 500–700.

## 5. Voz

- **Sliders observados:** formal ←●→ casual (~75%) · sério ←●→ hype (~70%) · técnico ←●→ humano (~60%).
- **Do:** “Publique uma vez…”, “3 em 1”, “Venda seu conteúdo”, “Seguir grátis”, números grandes (ganhos, assinantes).
- **Don't (produto):** IA como feature positiva — ban explícito a perfis/imagens GenAI ([`../ia.md`](../ia.md)).
- **Before → After (tom site):** institucional genérico → “Publique uma vez e esteja em todos os lugares!”

## 6. Imagery / ícones

- **Fotografia:** criadoras reais em mockups de celular; UI dark; dashboards de ganhos.
- **Ícones:** outline claros no dark; set SVG em `/images/ico-*.svg`; canais CloseFans / Telegram / Instagram.
- **Raios:** pills em CTAs; cards ~12–16px; favicon squircle.

## 7. Motion

Sem motion-guidelines oficiais públicas. UI com transições curtas; sem signature move documentado. Player usa `--plyr-color-main: #6f00d6`.

## 8. Acessibilidade

- Dark-first: texto branco no preto OK; roxo `#890AFF` como texto pequeno no preto **falha** AA (3.4:1) — no produto o roxo é botão/underline, não corpo.
- Foco / estados: roxo + underline ativo (ex.: “Para você”).
- Age / adulto: superfície 18+.

## 9. AI content rules (da própria CloseFans)

| Pode | Não pode |
|---|---|
| Templates CloseBot (cobrança/Telegram) | Perfis ou mídia GenAI / deepfake para vender |
| — | Ver Termos 5.3.A + help “modelo criada por IA” |

## 10. Canais

| Canal | Mark | Nota |
|---|---|---|
| App / PWA | Mark chave no roxo | `theme_color` / `background_color` `#050506` no manifest (tile meta ainda `#890AFF`) |
| Site | Wordmark horizontal branco | Landing dark + glow roxo |
| Help | Stacked branco ou roxo | Crisp |
| Blog | Mark chave | Wix |
| Telegram | CloseBot + ícone avião | Pitch 3 em 1 |
