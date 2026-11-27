# Brand guidelines — RolêGo

> One-pager operacional da **identidade visual final** (2026-11-27): logo gomosa, **noite roxo + ciano**, **dia melancia**.
> Documento completo: [`identidade-visual-final-rolego.pdf`](identidade-visual-final-rolego.pdf) · tokens: [`tokens.css`](tokens.css) · motion: [`motion-guidelines.md`](../identidade-v5-gomosa/motion-guidelines.md)

## 1. Essência

- **O que é:** app que junta festas, bares, shows e eventos privados por perto, mostra quem vai e deixa o grupo decidir junto — do match ao ingresso.
- **Para quem:** 18–35 que saem em grupo; quem acabou de chegar numa cidade; bares, casas e anfitriões.
- **Personalidade:** descolada (não forçada) · na hora (não apressada) · junto (não sozinho) · segura (não careta).
- **Posicionamento:** Os rolês da sua cidade, num swipe.
- **Slogan:** **Viva o rolê.** · Linha de apoio: *Chega de sofrer para decidir onde sair.*
- **Domínio / redes:** rolego.com.br · @rolego

## 2. Logo system

Masters SVG em [`logo/`](logo/) (logo gomosa; as versões `rolego-*-melancia.svg` são as de dia).

| Variante | Arquivo | Quando |
|---|---|---|
| Lockup no roxo (principal) | `v4-lockup-purple.svg` | Capas, header, peças de marca |
| Lockup no preto | `v4-lockup-dark.svg` | App, peças noturnas |
| Lockup na melancia (dia) | `rolego-lockup-melancia.svg` | Banner, post, capa e merch de dia |
| Empilhado na melancia | `rolego-stacked-melancia.svg` | Canga, capa e splash de rolê de dia |
| Símbolo na melancia | `rolego-go-melancia.svg` | Avatar, estampa e adesivo de dia |
| Lockup no claro | `v4-lockup-light.svg` | Documentos, e-mail, papelaria clara |
| Empilhado | `v4-stacked-{purple,dark,light}.svg` | Splash, ecobag, espaços quadrados |
| Símbolo Go | `v4-go-{white,dark,light,ink}.svg` | Avatar, estampa, marcador de mapa |
| Ícone | `v4-icon-{app,avatar,fav}[-dark].svg` | Loja, home, favicon |
| Uma cor | `v4-lockup-{white,ink}.svg` | Silk 1 cor, gravação, carimbo |

**Regras fixas:** escreve-se **Rolê** com acento · o Go é sempre o símbolo (nunca “Go” digitado) · **Rolê e Go nunca na mesma cor** (exceto versões de uma cor) · **nenhuma letra roxa no preto** · roxo é superfície, não cor de letra no escuro.

- **Área de proteção:** x = metade da altura do R, nos quatro lados.
- **Mínimos:** lockup 96 px de largura / 25 mm · empilhado 64 px / 18 mm · símbolo 16 px / 6 mm.
- **Fundos OK:** roxo · preto · melancia · névoa/branco · foto com degradê roxo, fade pro preto, véu preto ou bloco melancia.

### Não fazer

1. Esticar, achatar, girar ou mudar o itálico.
2. Rolê e Go na mesma cor; letras roxas no preto; degradê do Go no Rolê.
3. Glow, sombra, contorno.
4. Escrever “Go” em texto, tirar o acento, trocar a fonte.
5. Foto sem placa ou degradê atrás do logo.

## 3. Cor

| Token | Hex | Uso |
|---|---|---|
| `--rg-surface-purple` | `#9E19E9 → #6539CB → #452EFF` (135°) | Superfície principal: fundo, ícone, botão |
| `--rg-melancia` | `#FF4D6A` chapada | **Cor do dia**: superfície, faixa, sol, ícone, destaque |
| `--rg-cyan` | `#00E5E5` | Go no roxo/preto, palavra de destaque, tags |
| `--rg-go-on-black` | `#00E5E5 → #3B82F6` | Só no símbolo Go sobre preto |
| `--rg-purple` | `#6539CB` | Roxo de texto no claro, tecido |
| `--rg-black` | `#000000` | Fundo do app |
| `--rg-ink` | `#05070F` | Texto e Rolê no claro |
| `--rg-mist` | `#F4F4F8` | Fundo claro |
| `--rg-grey` / `--rg-graphite` | `#9CA3AF` / `#5B6070` | Texto secundário no preto / no claro |
| Categorias | `#FF1F7A` social · `#00FF00` segurança · `#FFCC00` VIP · `#00E5E5` alerta | Só ícone, tag, barra de card, no preto |

Proporção de noite: 45 roxo · 30 preto · 15 claro · 10 ciano. De dia: 55 melancia · 25 foto · 12 branco · 8 roxo.

### Dia e noite

- **Assinatura:** logo + slogan à esquerda; card de foto à direita (véu preto 55%, título branco, uma palavra em cor, pílula roxa “Bora? N vão” com a contagem em ciano).
- **Noite:** superfície roxa, Go ciano, destaque ciano. **Dia:** superfície melancia chapada, Rolê branco, Go roxo, “rolê.” do slogan em roxo.
- Palavra em destaque no card: melancia se o rolê é de dia (mesmo em peça roxa), ciano se é de noite.
- Na melancia: texto pequeno em tinta; branco só em título ≥ 24 px; roxo só no Go e no slogan.
- **Não:** degradê na melancia · melancia nas letras do logo · ciano sobre melancia · segunda cor de dia · trocar pela magenta de categoria.
- No feed, o dia entra a cada 3 posts.

**Pares AA (WCAG 2.2):** branco no roxo 7.0:1 · branco no violeta 5.6:1 · branco no anil 6.8:1 · ciano no preto 13.3:1 · cinza no preto 8.3:1 · tinta na névoa 18.3:1 · roxo no branco 7.0:1 · grafite na névoa 5.7:1.
**Dia:** tinta na melancia 6.2:1 · melancia no preto 6.5:1 · branco na melancia 3.2:1 (só título grande) · ciano na melancia 2.0:1 (não usar).
**Só título grande:** ciano no roxo 4.4:1 · ciano no violeta 3.5:1. **Não usar:** ciano no branco 1.6:1.

## 4. Tipografia

| Papel | Família | Pesos | Uso |
|---|---|---|---|
| Display / títulos | Poppins | 800 itálico, −2 a −3,5% | Títulos, slogan, números |
| Corpo / UI | Poppins | 400 · 500 · 600 · 700 | Texto, botões, labels |
| Tag | Poppins | 800 caixa alta, +8% | Data, categoria |

Escala: Display 72 · H1 48 · H2 32 · H3 22 · Corpo 16 · Pequeno 14 · Tag 12. Uma palavra por título na cor do Go (ciano no roxo/preto, roxo no claro). Sem segunda fonte; fallback `system-ui`.

## 5. Voz

- **Sliders:** formal ←●→ casual (82%) · sério ←●→ brincalhão (64%) · técnico ←●→ humano (90%) · hype ←●→ pé no chão (58%).
- **Do:** frase curta · “bora”, “tá rolando”, “a galera” · no plural (o grupo decide).
- **Don't:** “imperdível”, “experiência única” · CAIXA ALTA GRITANDO · mais de 1 emoji · piada em erro de pagamento ou segurança.
- **Before → After:** “Confira os eventos imperdíveis da sua região!” → “Tem rolê perto de você. Bora?”

## 6. Imagery / ícones

- **Fotografia:** gente real, movimento, grupos. Noite: luz de palco/rua, degradê roxo ou fade pro preto atrás de texto/logo. Dia: praia, pedal, trilha, fim de tarde; foto limpa com faixa, moldura ou véu; rosto no enquadramento; nada sensual. Proibido: banco de imagem posado, rosto gerado por IA, bebida como protagonista.
- **Ícones:** grade 24 px, traço 2 px, pontas e cantos redondos, outline (preenchido só no ativo). Cor = cor da categoria.
- **Elementos:** supergrafismo Go (8–12%), padrão Go em grade deslocada, tags pill, Go como marcador de mapa. Raios 8 / 16 / 28 / pill.

## 7. Motion

- **Signature move:** o pin cai — Rolê entra (220 ms), Go cai e assenta sem quicar (`--ease-emphasized`), ping ciano uma vez no furo; end frame em 600 ms.
- **Durações:** 100 / 140 / 220 / 400 / 600 ms. **Easing:** `cubic-bezier(.2,0,0,1)` padrão · `(.16,1,.3,1)` entrada · `(.7,0,.84,0)` saída.
- **Reduced-motion:** end frame direto; ping vira troca de cor.
- **Logo nunca:** girar, quicar, esticar, loop, glow pulsando.

## 8. Acessibilidade

- Texto ≥ 4,5:1. No roxo, texto pequeno é branco. Ciano no claro, nunca.
- Estado nunca só por cor ou só por motion. Foco visível (anel ciano no preto, roxo no claro).
- Nada pisca > 3×/s. Alvo de toque ≥ 44 px. Alt text em todo post.

## 9. AI content rules

| Pode sem review | Precisa humano |
|---|---|
| Rascunho de legenda na voz | Logo, lockup ou símbolo novo |
| Post a partir dos templates (`../identidade-v5-gomosa/_posts.py`) | Campanha paga, outdoor, mídia externa |
| Variação de texto de botão/push | Qualquer imagem com pessoas |
| Tradução de tela | Texto de segurança, pagamento, termos |

Proibido em prompt de imagem: rostos de pessoas reais, glow neon no logo, roxo→índigo genérico de SaaS, orb 3D, plástico brilhante, texto dentro da imagem.

## 10. Canais

| Canal | Mark | Tom |
|---|---|---|
| App | Ícone roxo · lockup no preto · Go como marcador | Direto, curto, “bora” |
| Instagram / TikTok | Avatar roxo · templates `posts/` e `stories/` | Mais solto, enquete, lista |
| WhatsApp (prévia de link) | Ícone + “Viva o rolê.” | Convite |
| Parceiros (bares, casas) | Lockup no claro · selo “Tem rolê aqui.” | Profissional, próximo |
| Merch / evento | Slogan, símbolo, lockup uma cor | Celebração |
| Print 1 cor | `v4-lockup-{white,ink}.svg` | — |
