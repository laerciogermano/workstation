# Brand guidelines — Clozzy · Identidade visual v2

> One-pager. **Versão:** 2026-11-11 · v2. Manual: [`identidade-visual-clozzy-v2.pdf`](identidade-visual-clozzy-v2.pdf) · tokens: [`tokens.css`](tokens.css) · logos: [`logos/`](logos/) · PNG: [`export/`](export/)
> Contexto: [visão](../../README.md) · logo v1 (hml) · prints favoritos [`../refs/`](../refs/) · rodadas 1–8 (`../logo-*`) · [referências de apps](../referencias-apps/README.md). A v1 da identidade nova continua em [`../identidade-nova/`](../identidade-nova/README.md).

## 1. Essência
- **O que é:** o close friends pago. Influencers vendem conteúdo exclusivo (stories, vídeos, chat, videochamada), e o fã compra no Pix e abre na biblioteca.
- **Promessa:** *Seu close, seu preço.*
- **Personalidade:** próximo · direto · confiante · discreto.
- **Palavras-chave:** vídeos · stories · chat · videochat · fechado · privado · close · close friends · estrela.

## 2. Logo
- **Símbolo:** o C do Círculo próximo com a **estrela original**. A ponta de cima vira **· – ––** (ponto, traço de 20°, traço de 30°) e então o C. A espessura é sempre a mesma; vão de 5. Origem: rodada 8 · “1 · Sutil · vão 5” ([`../logo-tracos-sutis/`](../logo-tracos-sutis/README.md)).
- **Grid 100:** raio externo 45 · traço 10 · abertura de 54° em −18° · estrela R 20,5, miolo 0,48, canto 5.
- **Corte pequeno (≤ 24 px):** traço 14, ponto + um traço (`simbolo-16-*.svg`).
- **Lockups:** horizontal (padrão), empilhado, só símbolo, só nome (Gabarito 800).
- **Respiro:** 2× o ponto (20% do símbolo). **Mínimos:** símbolo 16 px · lockup 88 px · empilhado 56 px · impressão 6 mm.
- **Cor do logo:** Pink Deep no claro · Pink Clozzy no escuro · branco sobre rosa/Deep/roxo · ink em uma cor. Duas cores (rosa + estrela roxa) só em peças grandes.
- **Não fazer:** esticar, girar, espelhar, gradiente, glow, rosa sobre roxo, fechar o C, tirar ou reordenar a ponta, trocar a fonte, recolorir fora da paleta.

## 3. Cor (só estas seis)

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--cz-pink` | #FF0065 | Símbolo no escuro, anel do Close, destaques | ink 5,1:1 · branco só ≥ 24 px bold (3,9:1) |
| `--cz-pink-deep` | #E0005A | Botões, links, símbolo no claro | branco 4,9:1 |
| `--cz-purple` | #7C48C4 | Acento: chat, convite, drop | branco 5,9:1 |
| `--cz-ink` | #14090F | Texto, modo escuro | 19,5:1 sobre branco |
| `--cz-cream` | #FFF6F0 | Fundo quente | ink 18,3:1 |
| `--cz-white` | #FFFFFF | Fundo base | — |

Proporção: branco 44 · cream 18 · ink 22 · rosa 10 · roxo 6. Estados sem cor nova (ink + ícone + texto). Nunca rosa sobre roxo; sem gradiente, glow ou neon.

## 4. Tipografia
**Gabarito** 700–900 (títulos, preços, números, botões, nome) + **Figtree** 400–700 (interface e texto). Escala: 64 · 44 · 32 · 22 · 16 · 14 · 12. Fontes em [`fonts/`](fonts/).

## 5. Linguagem gráfica
- Traço gradativo · – –– ———— como divisor e barra de progresso.
- Anel do Close (com a ponta do logo) nos avatares com story.
- Selo de estrela (“Close”, “Exclusivo”, “Liberado”).
- Conteúdo fechado: blur + placa sólida + cadeado + preço.

## 6. Interface
Botão principal Pink Deep (no escuro, Pink Clozzy com texto ink) · raios 10/18/28/pill · grade de 4 px · um botão principal por tela.

## 7. Movimento
Assinatura 520 ms: a estrela aparece (pop), o C se desenha e a ponta entra da ponta para dentro. Micro 120–220 ms. `prefers-reduced-motion` mostra só o quadro final.

## 8. Voz
Fala como amigo próximo: casual, sensual pela sugestão, frases curtas, preço visível. “Entrar no Close”, “Pago no Pix. Liberado na sua biblioteca.” Nunca “+18 hot”, “plataforma de conteúdo adulto” ou emoji de fogo e berinjela como identidade.
