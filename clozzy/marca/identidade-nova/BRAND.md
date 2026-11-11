# Brand guidelines — Clozzy 2028

> One-pager operacional. **Versão:** 2026-11-11 · v1 · direção **B “Círculo próximo”** (recomendada, aguardando aprovação).
> Manual: [`identidade-visual-clozzy-2028.pdf`](identidade-visual-clozzy-2028.pdf) · tokens: [`tokens.css`](tokens.css) · motion: [`motion-guidelines.md`](motion-guidelines.md) · logos: [`logos/`](logos/)
> Referência as-is: [`../identidade-atual/BRAND.md`](../identidade-atual/BRAND.md) · método: `core/definir-projeto-moderno/05-identidade-visual/`

## 1. Essência

- **O que é:** site onde influencers vendem conteúdo exclusivo direto para fãs, e onde o fã compra, acessa e acompanha num só lugar.
- **Para quem:** criador (vitrine e venda) · fã (compra e biblioteca) · operação.
- **Personalidade:** próximo · direto · confiante · discreto.
- **Posicionamento:** Para criadores brasileiros, o Clozzy é a vitrine do exclusivo: o fã vê o que compra, paga no Pix e abre na hora.
- **Tagline de capa:** “O exclusivo de quem você segue. Comprado em um toque, aberto na hora.”

### O que muda em relação ao as-is

| Eixo | As-is | 2028 |
|---|---|---|
| Símbolo | 3 marks (geométrico app · estrela roxa site · estrela magenta Figma) | 1 símbolo: **C aberto + estrela** |
| Cor | #FF0065 · #FE2C55 · #FE2C78 · #7651E9 | **#FF0065** + Pink Deep #E0005A · ink/cream quentes |
| Tipo | Montserrat · Proxima Nova · Inter/Roboto | **Gabarito** (display) + **Figtree** (UI) |
| Nome | clozzy · meuclozzy | **clozzy**; “meu clozzy” = só área do criador |
| Promessa | Close Friends pago no Instagram | Vitrine → compra → acesso, sem depender de uma rede só |

Mantido por reconhecimento: magenta, estrela, caixa baixa, “Você só paga se vender”.

### Eixos 2026 (máx. 2)

- **Ativos:** família responsiva (lockup → símbolo → glyph 16px) · motion L1 de assinatura.
- **Evitados:** roxo-sobre-preto do mercado adulto, gradiente SaaS, glow neon, 3D, mascote.
- **Por quê:** o benchmarking mostra o mercado em dark + ciano/rosa/roxo; o Clozzy se separa sendo claro, quente e com um rosa só.

## 2. Logo system

**Conceito “Círculo próximo”:** o C de clozzy é também o círculo de close friends. A abertura (54°, centrada em −18°) fica no eixo da ponta superior-direita da estrela: o exclusivo sai do círculo direto para o fã.

| Variante | Arquivo | Quando |
|---|---|---|
| Lockup horizontal | `lockup-horizontal.svg` | Header, site, docs |
| Lockup horizontal dark | `lockup-horizontal-reversed.svg` | Fundo ink |
| Lockup sobre rosa | `lockup-horizontal-on-pink.svg` (= `-white`) | Fundo Pink Clozzy |
| Lockup mono | `lockup-mono-ink.svg` | Impressão 1 cor |
| Empilhado | `lockup-stacked.svg` / `-white` | Espaços quadrados |
| Símbolo | `mark-pink.svg` / `mark-ink.svg` / `mark-white.svg` | Avatar, selo, hero |
| Glyph 16–32 | `glyph-pink.svg` / `glyph-ink.svg` | Favicon, inline (correção óptica) |
| App icon | `app-icon-pink.svg` / `-ink` / `-cream` | PWA, stores |
| Favicon | `favicon.svg` | Aba |
| Avatar social | `avatar-social.svg` | Instagram, TikTok, X |
| Wordmark | `wordmark-ink.svg` / `-white` / `-pink` | Só onde o símbolo já aparece |

PNG: [`export/`](export/) (app 1024/512/192/180 · favicon 32/16 · avatar 800 · mark 512 · lockup 1200).

- **Construção (grid 100):** anel 45/29 · estrela R 20,5, razão 0,48, cantos arredondados · terminais redondos.
- **Wordmark:** Gabarito 800 em curvas, tracking −18/1000.
- **Respiro:** ½ do diâmetro do símbolo em todos os lados.
- **Mínimo:** lockup 88 px (22 mm) · empilhado 56 px · símbolo 20 px · abaixo disso, glyph 16 px.
- **Fundos OK:** cream · branco · ink · Pink Clozzy (símbolo branco) · foto com placa sólida.

### Não fazer

1. Esticar ou distorcer.
2. Recolorir: roxo ou qualquer cor fora da paleta.
3. Glow, sombra, outline ou gradiente no master.
4. Pôr sobre fundo agitado sem placa.
5. Girar o símbolo (a abertura tem lugar fixo), fechar o C, trocar a estrela por coração ou chama.
6. Usar “meuclozzy” como logo.

### Direções exploradas (checkpoint)

| | Direção | Veredito |
|---|---|---|
| A | Estrela no disco (evolução do Figma 289) | Zero ruptura, mas é o ícone de Close Friends do Instagram |
| **B** | **C aberto + estrela** | **Recomendada:** mantém o reconhecimento e tem silhueta própria |
| C | Wordmark-led (“zz” magenta) | Limpo, mas sem ícone para app/avatar |

Se a escolha mudar, só os SVGs de `logos/` mudam (`_logos.py`); cor, tipo, voz e motion ficam iguais.

## 3. Cor

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--cz-pink` | #FF0065 | Símbolo, splash, grandes áreas | ink sobre ele 5,1:1 · branco só ≥24px bold (3,9:1) |
| `--cz-pink-deep` | #E0005A | Botão/CTA, link | branco sobre ele 4,9:1 · sobre cream 4,6:1 |
| `--cz-pink-soft` | #FFD9E7 | Chip, seleção | ink 15:1 · **nunca** rosa sobre ele (3,8:1) |
| `--cz-pink-glow` | #FF5C9D | Link/rosa no dark | 7,0:1 sobre #0B0609 |
| `--cz-ink` | #14090F | Texto, fundo dark | 18,3:1 sobre cream |
| `--cz-muted` | #6B5A62 | Texto de apoio | 6,0:1 sobre cream |
| `--cz-cream` | #FFF6F0 | Fundo padrão | — |
| `--cz-surface` | #FFFFFF | Cards | — |
| `--cz-line` | #ECDCD8 | Bordas | — |
| `--cz-access` | #0B7A59 (fill #1CCE98) | “Acesso liberado”, sucesso | 5,3:1 sobre branco · ink sobre fill 9,6:1 |
| `--cz-drop` | #FFD84D | Só badge “novo drop” | ink 14:1 |
| `--cz-warning` / `--cz-danger` | #8A5300 / #C4162A | Estados | 5,9 / 5,6:1 sobre cream |

**Proporção:** 60 cream/branco · 22 ink · 12 pink · 4 acesso · 2 drop. O rosa não vira fundo de tela inteira no produto (só splash e social).
**Dark:** fundo #0B0609 · surface #1A1015 · texto #FFF6F0 · apoio #B9A7AF (8,8:1) · botão Pink Clozzy com texto ink.
**Fora da paleta:** #7651E9 (roxo do site antigo), #FE2C55/#FE2C78/#FF116F (unificados em #FF0065).

## 4. Tipografia

| Papel | Família | Pesos | Uso |
|---|---|---|---|
| Display | **Gabarito** (OFL) | 700–900 | Wordmark, títulos, preços, botões |
| Texto/UI | **Figtree** (OFL) | 400–700 | Corpo, labels, formulários |
| Mono | ui-monospace | — | Códigos, chaves Pix |

Escala: Display 64/1,02 (−3%) · H1 44 · H2 32 · H3/preço 22 · Body 16/1,5 · Small 14 · Caption 12. Eyebrow: Figtree 700 caixa alta +12%.
Fontes em [`fonts/`](fonts/). Nunca usar Inter, Roboto ou Proxima como voz da marca.

## 5. Voz

- **Escalas:** casual (70%) · levemente brincalhão (55%) · humano (80%).
- **Do:** “Seu pack tá no ar. Já pode mandar o link.” · “Pago no Pix. Liberado na sua biblioteca.” · “Você só paga se vender.”
- **Don't:** “Plataforma de conteúdo adulto” / “+18 hot” · “Monetize seu engajamento com soluções” · emoji de fogo/berinjela como identidade.
- **Antes → depois:** “Compartilhe o link do seu Close Friends e ganhe dinheiro com assinaturas dentro das suas redes sociais” → “Seu exclusivo tem preço. Monte a vitrine e mande o link.”
- **Glossário fixo:** exclusivo · oferta · pack · drop · biblioteca · canal ([visão](../../README.md)).

## 6. Imagery / ícones / UI

- **Fotografia:** criadores reais, luz natural ou de quarto, rosto/meio-corpo. Preview bloqueado = placa cream/pink soft + cadeado, nunca blur pesado sobre nudez. Proibido em peça de marca: explícito, stock genérico, 3D, pessoa fotorrealista gerada por IA.
- **Ícones:** traço 2px · cantos 2px · grid 24 · terminais redondos · preenchido só no estado ativo · estrela preenchida = exclusivo.
- **UI:** botão pill · card raio 18 · chip pill · sem sombra decorativa (separação por borda #ECDCD8). Badges: “Novo drop” (drop), “✓ Acesso liberado” (access fill), “★ Exclusivo” (pink soft).

## 7. Motion

Assinatura **“abrir o círculo”**: anel gira 25° até a abertura parar no lugar; a estrela vai de 0,9 a 1 com `--cz-ease-pop` · 520 ms. Só em splash, confirmação de compra e acesso liberado. Detalhe em [`motion-guidelines.md`](motion-guidelines.md).

## 8. Acessibilidade

- Todos os pares de texto da §3 são ≥ AA. Branco sobre #FF0065 só em título ≥24px bold.
- Estado nunca só por cor ou só por movimento: o badge de acesso tem ícone e texto.
- Foco visível: anel 2px Pink Deep + offset 2px (cream) / Pink Glow (dark).

## 9. AI content rules

| Pode sem revisão | Precisa de humano |
|---|---|
| Rascunho de copy na voz deste guia | Logo, lockup, símbolo novo ou variação |
| Layout interno usando só `tokens.css` | Campanha, anúncio, peça externa |
| Ícones no sistema 2px/24 | Qualquer imagem de pessoa |
| Traduções e variações de CTA | Peça que mostre preview de conteúdo |

- Proibido: pessoa fotorrealista gerada por IA em material de marca; prompts com roxo-índigo SaaS, orbs, glow neon, 3D plástico, chrome (ver `ANTI-SLOP-E-TENDENCIA.md`).
- Conteúdo de criador feito com IA: decisão de produto (selo “feito com IA”); fica para o card de políticas.

## 10. Canais

| Canal | Mark | Tom |
|---|---|---|
| Site clozzy.com.br | Lockup horizontal · cream | Criador: “monte a vitrine” |
| App criador (meu.clozzy) | Splash Pink + símbolo branco · app icon pink | Gestão, wallet |
| App/área do fã | Lockup · biblioteca | Compra e acesso |
| Instagram/TikTok | Avatar social · stories ink + link sticker | Drop, novidade |
| Favicon / PWA | `favicon.svg` · `export/app-icon-pink-*.png` | — |
| Impressão | `lockup-mono-ink.svg` | — |

## Próximos passos

1. Aprovar a direção B (ou trocar no checkpoint).
2. Design system de UI (card futuro) a partir de `tokens.css`.
3. Migrar performer/front: #FF0065 fica; Montserrat → Gabarito/Figtree; trocar SVGs.
4. Site: tirar o roxo #7651E9; aplicar hero e CTA do manual.
5. Lottie da assinatura (L1) a partir do SVG master.
