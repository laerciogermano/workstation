# Brand guidelines — Clozzy (as-is)

> One-pager no molde RoleGo v4. **Versão:** 2026-11-11 · identidade **atual** extraída do código + site.  
> Manual: [`identidade-visual-clozzy-atual.pdf`](identidade-visual-clozzy-atual.pdf) · tokens: [`tokens.css`](tokens.css) · logos: [`logos/`](logos/)

**Código canônico:** [`../benchmarking-concorrentes/clozzy/performer/`](../benchmarking-concorrentes/clozzy/performer/) (`--color-primary: #FF0065`, Montserrat, SVGs em `src/assets/icons/`).  
**Site:** [clozzy.com.br](https://clozzy.com.br/) (Fastly; `og:url`) · espelho [clozzy.link](https://clozzy.link/) · app criador [meu.clozzy.com.br](https://meu.clozzy.com.br/).

## 1. Essência

- **O que é:** plataforma BR de Close Friends pago — link na bio, assinaturas, stories/conteúdo exclusivo, gestão de membros.
- **Para quem:** criadores (performer) e fãs (front).
- **Personalidade observada:** rosa choque · tipografia bold · light UI · conversão (“Você só paga se vender”).
- **Posicionamento (site):** “Compartilhe o link do seu Close Friends e ganhe dinheiro com assinaturas dentro das suas redes sociais.”
- **Nome:** Clozzy · lowercase `clozzy` no wordmark · PWA `meuclozzy` / manifest `clozzy`.

## 2. Logo system (código performer)

Masters SVG em `performer/src/assets/icons/` → cópia em [`logos/`](logos/).

| Variante | Arquivo | Quando |
|---|---|---|
| Lockup preto + mark rosa | `lockup-clozzy.svg` / `lockup-black.svg` | Header claro, docs |
| Lockup branco + mark rosa | `lockup-white.svg` | Fundo escuro / landing dark |
| Mark círculo | `mark-circle.svg` | Avatar, favicon base |
| App icons PNG | `mark-app-512.png` etc. | PWA / loja |

**Anatomia do mark:** círculo `#FF0065` + glifo branco geométrico (pétalas/losango — não é estrela no SVG master). Wordmark “clozzy” em preto (ou branco no lockup dark), sans bold.

### Não fazer

1. Esticar / distorcer.  
2. Trocar o rosa por roxo genérico sem decisão de redesign.  
3. Glow / sombra no master.  
4. Misturar mark geométrico (código) com estrela roxa do site sem documentar o drift.

## 3. Cor

| Token | Hex | Fonte |
|---|---|---|
| `--cz-pink` | `#FF0065` | `performer` `--color-primary` |
| `--cz-pink-front` | `#FE2C55` | `front` `--ion-color-primary` |
| `--cz-pink-landing` | `#FE2C78` | `landing-logo.svg` |
| `--cz-ink` | `#222428` | Ionic dark / caret |
| `--cz-light` | `#F4F5F8` | Ionic light |
| `--cz-paper` | `#FFFFFF` | Fundo app / theme-color performer |
| `--cz-success` | `#2DD36F` | Ionic success |

**Drift site marketing (2026-11):** landing em produção usa `--primary-color:#7651E9` (roxo) + estrela — **não** bate com o performer. Favicon público ainda na família rosa. Tratar roxo como variante de marketing até unificar.

**AA:** branco no `#FF0065` ≈ 3.9:1 (CTA grande) · rosa no preto ≈ 5.4:1 · preto no branco 21:1.

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
