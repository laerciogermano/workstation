# Brand guidelines — Clozzy

> Versão 1.0 · 2026-11-27 · manual: [`identidade-clozzy-final.pdf`](identidade-clozzy-final.pdf) · visão do produto: [`../../README.md`](../../README.md)

## 1. Essência

- **O que é:** três apps em um (mesma conta B2C): rede social · relacionamento · vendas de conteúdo exclusivo no close.
- **Para quem:** viewers, influencers, flertadores, clientes e criadores. Só maiores de 18 anos.
- **Personalidade:** próximo · discreto · íntimo · claro.
- **Posicionamento:** o Clozzy aproxima desconhecidos; o que é exclusivo fica entre quem entrou.
- **Frase de capa:** “Chega mais perto.”
- **Gênero:** “o Clozzy”, sempre no masculino.

## 2. Regra da discrição

| Onde | Preço e Pix | Verde | Chamada de close | Assunto |
|------|-------------|-------|------------------|---------|
| Loja de app, home, anúncio, post da marca | não | não | não | conhecer gente |
| Descoberta e feed | não | só anel de quem já é do seu close | não | pessoas, puxar assunto |
| Perfil público | não | selo, anel, trancado | “Entrar no close” | prévia; resto trancado |
| Chat e folha do close | sim | sim | sim | oferta, preço, o que libera |
| Biblioteca | sim | sim | sim | o que é seu e até quando |
| Convite e área de criadora | sim | não | “Abrir meu close” | preço, recebimento, painel |

Notificação na tela bloqueada não cita preço nem mostra mídia.

## 3. Logo

| Variante | Arquivo (`svg/`, trocar `{tema}`) | Quando |
|----------|-----------------------------------|--------|
| Horizontal (principal) | `logo-horizontal-{tema}.svg` | assinatura padrão |
| Empilhada | `logo-empilhado-{tema}.svg` | espaço quadrado |
| Estrela + palavra | `logo-estrela-{tema}.svg` | cabeçalho do app, rodapés |
| Palavra | `palavra-{tema}.svg` | quando o ícone já está na peça |
| Símbolo (estrela + arco) | `simbolo-{tema}.svg` · `simbolo-pequeno-{tema}.svg` (≤ 32 px) | avatar, abertura |
| Ícone (estrela com ponto) | `icone-{tema}.svg` · `app-icon-*.svg` · `favicon.svg` | app, favicon |
| Close | `close-simbolo-preto.svg` · `close-estrela.svg` · `app-icon-close.svg` | só o que é do close |

Temas: `preto` · `branco` · `pink-deep` · `roxo` · `criadora-no-preto` · `uma-cor-preta` · `uma-cor-branca`. Logos, palavra e símbolo têm também `-transparente`.

- **Estrela macia:** vale 55% do raio, contorno redondo 37,5%, giro −8°. Ponto de câmera (14% do raio, −60°) só quando está sozinha.
- **Arco:** raio 41, espessura 8, traços de 2° a 30° e linha. Uma cor só.
- **Palavra:** `clozzy` em curvas, Gabarito 800 com cantos arredondados (raio 38 em unidades de fonte). Sempre separada do símbolo.
- **Proteção:** ¼ da altura do símbolo. **Mínimos:** símbolo 24 px / 8 mm; logo 18 px / 6 mm; abaixo disso, só a estrela.

### Não fazer

Ponto dentro do arco · arco em duas cores · estrela, texto ou botão rosa no preto · preto no rosa · rosa no roxo (ou o inverso) · verde de fundo ou em botão · C do símbolo como letra · degradê, sombra, contorno ou distorção · animar o arco · logo ou cor própria por app · “meuclozzy” como logo.

## 4. Cor

| Token | Hex | Uso |
|-------|-----|-----|
| `--cz-pink-deep` | `#E0005A` | marca; compra no claro; momentos; arco no preto |
| `--cz-preto` | `#000000` | fundo principal |
| `--cz-branco` | `#FFFFFF` | fundo claro; texto e botão no preto |
| `--cz-roxo` | `#7C48C4` | criadora |
| `--cz-verde-close` | `#69C353` | close, em detalhe (~2%) |

Proporção: preto 55 · branco 25 · Pink Deep 12 · roxo 6 · verde 2. Neutros: `#141414` `#222222` `#2A2A2A` `#8C8C8C` `#F2F2F2` `#E6E6E6` `#666666`.

Contraste: branco/preto 21 · branco/Pink Deep 4,9 · branco/roxo 5,9 · Pink Deep/preto 4,3 (só grande ou forma) · branco/verde 2,2 (só estrela, check e rótulo 800+).

Temas e papéis: [`tokens.css`](tokens.css) · [`tokens.json`](tokens.json) (`preto`, `branco`, `rosa`, `roxo`, `criadora`).

## 5. Tipografia

| Papel | Família | Pesos | Uso |
|-------|---------|-------|-----|
| Display | Gabarito | 800 · 900 | títulos, preço, botão |
| Texto | Figtree | 400 · 600 · 700 | corpo e interface |

Fontes OFL, em [`../logo-final-v3/fonts/`](../logo-final-v3/fonts/). Escala em `tokens.css`.

## 6. Voz

- Casual, próximo, frases curtas, “você”.
- **Capa:** “Chega mais perto.” · “Gente que você ainda não conhece.” · “Puxa assunto.”
- **Flerte:** “Vocês se curtiram.” · “Agora é com vocês.”
- **Close:** “Só quem entra, vê.” · “Pago no Pix. Liberado na hora.” · “Tá na sua biblioteca.”
- **Criadora:** “Seu close, seu preço.” · “Você decide quem entra.”
- **Não:** “+18”, “hot”, “monetize”, “plataforma adulta”, fogo/berinjela, urgência falsa.
- **Antes → depois:** “Assine conteúdos exclusivos.” → “Chega mais perto.” · “Comprar pack” → “Entrar no close”.
- **Retorno ao mercado:** “chega em breve”; nunca “estamos de volta”, nunca explicar a pausa, nunca Pix como novidade.

## 7. Pessoas, foto e ícones

- Gente de verdade em momento comum (selfie, café, dança, make, amigos), enquadramento de celular. Criadoras de 18 a 22 anos.
- **Proibido:** menor de 18 ou aparência de menor; apelo sensual na peça de marca; mídia trancada adivinhável; pessoa sem autorização de imagem em peça publicada.
- [`../fotos-criadoras/`](../fotos-criadoras/README.md) é banco Pexels sem autorização para o Clozzy: **uso interno apenas**.
- Ícones de linha 1,8 px, grade 24, pontas redondas. Cantos 6/10/14/18/24/pílula. Superfícies chapadas.

## 8. Movimento

120 / 200 / 320 ms · `cubic-bezier(.2,0,0,1)` entra · `cubic-bezier(.4,0,1,1)` sai. Liberou: desfoque sai, check entra uma vez. O logo não se mexe. Com movimento reduzido: opacidade ou corte seco.

## 9. Acessibilidade

Texto ≥ 4,5:1 (3:1 só em texto grande) · estado nunca só por cor (verde sempre com estrela, check ou rótulo) · toque mínimo 44 px · foco visível · nada piscando.

## 10. Regras para IA

| Pode sem revisão | Precisa de pessoa |
|------------------|-------------------|
| Rascunho de texto na voz | Logo ou versão nova |
| Layout interno com tokens | Peça publicada, anúncio, campanha |
| Ícones no sistema de linha | Qualquer imagem de pessoa |

Nunca gerar imagem de pessoa sensual ou de aparência jovem demais; nunca recriar o logo por geração de imagem (usar os SVGs); nunca introduzir cor, degradê ou animação do arco.

## 11. Canais

| Canal | Marca | Tom |
|-------|-------|-----|
| Lojas de app | `app-icon-pink-deep.svg` | capa |
| App | estrela + palavra no cabeçalho; tema preto | capa → close conforme a área |
| Redes da marca | símbolo ou ícone no avatar | capa |
| Área de criadora | `criadora-no-preto` ou roxo | direto |
| Impresso 1 cor | `uma-cor-preta` ou `uma-cor-branca` | — |

Registro: marca nominativa CLOZZY, pedido INPI 945932294.
