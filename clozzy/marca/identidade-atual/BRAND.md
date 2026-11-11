# Brand guidelines — Clozzy (as-is)

> One-pager no molde RoleGo v4. **Versão:** 2026-11-11 · identidade **atual** extraída do código + site.  
> Manual: [`identidade-visual-clozzy-atual.pdf`](identidade-visual-clozzy-atual.pdf) · tokens: [`tokens.css`](tokens.css) · logos: [`logos/`](logos/)

**Código canônico:** [`../benchmarking-concorrentes/clozzy/performer/`](../benchmarking-concorrentes/clozzy/performer/) (`--color-primary: #FF0065`, Montserrat, SVGs em `src/assets/icons/`).  
**Site:** [clozzy.com.br](https://clozzy.com.br/) (Fastly; `og:url`) · espelho [clozzy.link](https://clozzy.link/) · app criador [meu.clozzy.com.br](https://meu.clozzy.com.br/).

## 1. Essência

- **O que é:** plataforma BR de Close Friends pago — link na bio, assinaturas, stories/conteúdo exclusivo, gestão de membros.
- **Para quem:** criadores (performer) e fãs (front).
- **Personalidade observada:** light UI · tipografia bold · conversão (“Você só paga se vender”) · **duas paletas vivas** (rosa no app, roxo no site).
- **Posicionamento (site):** “Compartilhe o link do seu Close Friends e ganhe dinheiro com assinaturas dentro das suas redes sociais.”
- **Nome:** Clozzy · lowercase `clozzy` no wordmark · PWA `meuclozzy` / manifest `clozzy`.

## 2. Logo system

### A — App / código (performer)

Masters SVG em `performer/src/assets/icons/` → [`logos/`](logos/).

| Variante | Arquivo | Quando |
|---|---|---|
| Lockup preto + mark rosa | `lockup-clozzy.svg` / `lockup-black.svg` | App criador |
| Lockup branco + mark rosa | `lockup-white.svg` | Fundo escuro |
| Mark círculo geométrico | `mark-circle.svg` | Avatar app |
| App icons PNG | `mark-app-512.png` | PWA |

**Mark A:** círculo `#FF0065` + glifo branco geométrico (pétalas/losango).

### B — Site marketing (clozzy.com.br)

Referências em [`refs/`](refs/) + reconstituição em [`logos/`](logos/).

| Variante | Arquivo | Quando |
|---|---|---|
| Lockup site (estrela roxa) | `lockup-site-purple.svg` | Header landing |
| Mark estrela roxa | `mark-star-purple.svg` | Hero / favicon-style site |
| Print desktop | `refs/site-landing-desktop.png` | Landing completa |
| Print mobile | `refs/site-landing-mobile.png` | Landing 390×844 |
| Crops | `refs/site-logo-crop.png` · `site-mark-crop.png` · `site-cta-crop.png` | Detalhe |

**Mark B:** círculo `#7651E9` + **estrela** branca de 5 pontas · wordmark `clozzy` preto · CTA pill/retângulo arredondado roxo (“Criar o meu close friends”).

### Não fazer

1. Esticar / distorcer.  
2. Misturar mark A (geométrico rosa) com mark B (estrela roxa) na mesma peça sem legenda.  
3. Glow / sombra no master.  
4. Assumir que o site já unificou com o performer — ainda não.

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

- Mark rosa em círculo; ícones Material / Ionic outline.
- Fotografia: criadores reais nas páginas de venda; UI light.
- Raios: pills de versão `#ff0065`; botões com radius médio Ionic.

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

Pasta: [`refs/figma/`](refs/figma/README.md)

| Export | Conteúdo | Cor dominante |
|---|---|---|
| `exports/untitled-zip/Deslogado.png` | Landing mobile estrela | Roxo site |
| `exports/01-group-284.png` | Wallet / Minha Carteira | Rosa CTA (+ roxo pontual) |
| `exports/02-group-285.png` | Onboarding / perfil / plano | Rosa performer |
| `exports/03-group-286.png` | v1.0 + components | Rosa |
| `exports/04-group-287.png` | Conta / saque / teclado | Rosa + cards azul |
| `exports/rectangle-43.png` | Pill gradiente | Roxo→fúcsia |

Links origem: Untitled×3 + [clozzy-performers](https://www.figma.com/design/h0BH4yv0LoeBsUlgjK7B2M/clozzy-performers).
