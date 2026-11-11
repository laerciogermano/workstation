# Brand guidelines — Clozzy (as-is)

> One-pager no molde RoleGo v4. **Versão:** 2026-11-11 · identidade **atual** extraída do código + site.  
> Manual: [`identidade-visual-clozzy-atual.pdf`](identidade-visual-clozzy-atual.pdf) · tokens: [`tokens.css`](tokens.css) · logos: [`logos/`](logos/)

**Código canônico:** [`../benchmarking-concorrentes/clozzy/performer/`](../benchmarking-concorrentes/clozzy/performer/) (`--color-primary: #FF0065`, Montserrat, SVGs em `src/assets/icons/`).  
**Site:** [clozzy.com.br](https://clozzy.com.br/) (Fastly; `og:url`) · espelho [clozzy.link](https://clozzy.link/) · app criador [meu.clozzy.com.br](https://meu.clozzy.com.br/).

## 1. Essência

- **O que é:** ferramenta BR para gerenciar e profissionalizar lista de Close Friends (Instagram) — link, assinaturas, conteúdo exclusivo.
- **Para quem:** criadores (performer / `meuclozzy`) e fãs (front).
- **Personalidade observada:** light UI · tipografia bold · conversão (“ASSINAR AGORA”, “Você só paga se vender”) · **duas paletas vivas** (magenta app, roxo site).
- **Posicionamento (Figma 289 / site):** “O meuclozzy é a ferramenta ideal para você gerenciar e profissionalizar sua lista de 'Close Friends' no Instagram.” · site: “Compartilhe o link do seu Close Friends e ganhe dinheiro…”
- **Nome:** Clozzy · lowercase `clozzy` / PWA wordmark **`meuclozzy`** (board Figma).

## 2. Logo system

### A — App / código (performer)

Masters SVG em `performer/src/assets/icons/` → [`logos/`](logos/).

| Variante | Arquivo | Quando |
|---|---|---|
| Lockup preto + mark rosa | `lockup-clozzy.svg` / `lockup-black.svg` | App criador |
| Lockup branco + mark rosa | `lockup-white.svg` | Fundo escuro |
| Mark círculo geométrico | `mark-circle.svg` | Avatar app (legado código) |
| App icons PNG | `mark-app-512.png` | PWA |

**Mark A (código):** círculo `#FF0065` + glifo branco geométrico (pétalas/losango).

### B — Site marketing (clozzy.com.br)

Referências em [`refs/`](refs/) + reconstituição em [`logos/`](logos/).

| Variante | Arquivo | Quando |
|---|---|---|
| Lockup site (estrela roxa) | `lockup-site-purple.svg` | Header landing |
| Mark estrela roxa | `mark-star-purple.svg` | Hero / favicon-style site |
| Print desktop / mobile | `refs/site-landing-*.png` | Landing |

**Mark B:** círculo `#7651E9` + **estrela** branca · wordmark `clozzy` preto · CTA roxo.

### C — Brand board Figma (`Group 289`)

Fonte: [`clozzy/figma/Group 289.png`](../../figma/Group%20289.png) → [`refs/figma/exports/06-group-289.png`](refs/figma/exports/06-group-289.png).

| Elemento | Observado |
|---|---|
| Wordmark | `meuclozzy` branco lowercase · sans geométrica (Montserrat-like) |
| Mark canônico do board | círculo branco + **estrela** 5 pontas magenta (inverso: círculo magenta + estrela branca) |
| Splash / login | fundo sólido magenta · inputs “Usuário/Senha” · botão Login branco |
| CTA produto | pill/botão **ASSINAR AGORA** magenta em perfil claro |
| Ícones satélite | flame + logo Instagram; flame estilo Tinder; apps icons estrela/flame em grades |
| Magenta amostrado | ~`#F80068` / `#F82878` (alinha a `#FF0065` do código) |

**Mark C ≠ Mark A:** Figma usa **estrela**; o SVG do performer ainda é o glifo geométrico. Documentar os dois até unificar.

### Não fazer

1. Esticar / distorcer.  
2. Misturar mark A (geométrico), B (estrela roxa) e C (estrela magenta) na mesma peça sem legenda.  
3. Glow / sombra no master.  
4. Assumir que site, código e Figma já unificaram — ainda não (288 explora CTA rosa **ou** roxo na wallet).

## 3. Cor

### App (código)

| Token | Hex | Fonte |
|---|---|---|
| `--cz-pink` | `#FF0065` | `performer` `--color-primary` |
| `--cz-pink-front` | `#FE2C55` | `front` `--ion-color-primary` |
| `--cz-pink-landing` | `#FE2C78` | `landing-logo.svg` |
| `--cz-ink` | `#222428` | Ionic dark / caret |
| `--cz-light` | `#F4F5F8` | Ionic light |
| `--cz-paper` | `#FFFFFF` | Fundo app |
| `--cz-success` | `#2DD36F` | Ionic success |

### Site (clozzy.com.br / .link)

| Token | Hex | Fonte |
|---|---|---|
| `--cz-site-purple` | `#7651E9` | CSS `--primary-color` · CTA RGB ≈ (118,81,233) |
| `--cz-site-green` | `#1CCE98` | CSS `--secondary-color` |
| `--cz-site-mist` | `#EDEEF1` | fundos / chrome |
| `--cz-site-wash` | `#F6F7F8` | wash |
| `--cz-site-border` | `#DDD` | bordas |

**AA:** branco no `#FF0065` ≈ 3.9:1 · rosa no preto ≈ 5.4:1 · branco no `#7651E9` ≈ 5.1:1 · preto no branco 21:1.

## 4. Tipografia

| Papel | Família | Onde |
|---|---|---|
| App criador (performer) | **Montserrat** 100–900 | `global.scss` import Google Fonts |
| App fã (front) | **Proxima Nova** | `@font-face` local |
| Site marketing | Inter / Montserrat / Roboto misturados no HTML | drift |

UI performer: `font-family: "Montserrat", sans-serif !important` em tudo exceto Material Icons.

## 5. Voz

- **Do:** Close Friends · assinaturas · link na bio · “ganhe dinheiro” · “Você só paga se vender”.
- **Don't:** copiar pitch Telegram-first do CloseFans; vender GenAI como núcleo (sem suite IA no código).
- **Before → After:** “Plataforma de conteúdo adulto” → “Compartilhe o link do seu Close Friends…”

## 6. Imagery / ícones

- Figma 289: estrela em círculo; flame + Instagram; grades de app icon (rounded square / circle).
- Código: mark geométrico; Material / Ionic outline.
- Fotografia: criadores reais; mock Instagram/TikTok no board; UI light.
- Raios: pills `#ff0065`; botões radius médio Ionic; status wallet (288): Pendente / Realizado / Rejeitado.

## 7. Motion

Sem motion-guidelines oficiais. Transições Ionic padrão.

## 8. Acessibilidade

- Rosa como texto pequeno em branco falha AA — usar em botão preenchido com texto branco grande, ou texto preto no claro.
- Contraste de corpo: preto/cinza no branco.

## 9. AI content rules

Sem política GenAI explícita no código inspecionado. Para Clozzy 2028: definir disclosure próprio (benchmarking vs ban CloseFans).

## 10. Canais

| Canal | Mark | Tom |
|---|---|---|
| performer / meu.clozzy.com.br | Rosa `#FF0065` · Montserrat | Criador, wallet, stories |
| front | Rosa `#FE2C55` · Proxima | Fã, assinatura |
| clozzy.com.br | Hoje roxo `#7651E9` (drift) | Marketing / cadastro |
| PWA | Icons PNG rosa | Manifest theme `#ffffff` |

## 11. Refs Figma (exports)

Origem: [`clozzy/figma/`](../../figma/) · espelho [`refs/figma/`](refs/figma/README.md)

| Export | Conteúdo | Cor / nota |
|---|---|---|
| `06-group-289.png` | **Brand board** meuclozzy | Magenta + estrela · splash · ASSINAR |
| `05-group-288.png` | Wallet A/B (`web.clozzy.com`) | CTA rosa **vs** roxo `#7651E9` |
| `01-group-284.png` | Wallet / Minha Carteira | Rosa (+ roxo pontual) |
| `02-group-285.png` | Onboarding / perfil / plano | Rosa |
| `03-group-286.png` | v1.0 + components | Rosa |
| `04-group-287.png` | Conta / saque / teclado | Rosa + cards azul |
| `untitled-zip/Deslogado.png` | Landing mobile | Roxo site |
| `rectangle-43.png` | Pill gradiente | Roxo→fúcsia |

Links: Untitled×3 + [clozzy-performers](https://www.figma.com/design/h0BH4yv0LoeBsUlgjK7B2M/clozzy-performers).
