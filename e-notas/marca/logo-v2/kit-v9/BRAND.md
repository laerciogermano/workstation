# notinhas.shop — Logo V9 “Duas notinhas”

Direção escolhida em 08/11/2026. Apresentação completa: [`../apresentacao-logo-v2.html`](../apresentacao-logo-v2.html) · [PDF](../apresentacao-logo-v2.pdf).

## Ideia

Duas tiras de nota penduradas, com a borda de baixo rasgada. A comprida é a nota comum; a curta, verde, é o **menor preço**. Uma frase: *a nota menor é a que importa.*

## Construção (grade 256)

| Elemento | Medida |
|---|---|
| Tira longa | x 52, largura 64, de y 40 a 216 |
| Tira curta | x 140, largura 64, de y 40 a 136 |
| Espaço entre tiras | 24 |
| Cantos superiores | raio 12 |
| Serrilhado | 2 dentes por tira, 14 de profundidade (45°) |
| Corte pequeno (≤ 32 px) | 1 entalhe por tira, 32 de profundidade (45°) |

## Cores

| Uso | Hex | Contraste |
|---|---|---|
| Tira longa / “notinhas” | `#014380` | 9,93:1 no branco |
| Tira curta / “.shop” | `#00984B` | 3,75:1 no branco |
| Fundo escuro | `#000000` (preto) | Todo fundo escuro da identidade é preto; `#0B1F33` só em texto |

Verde sobre o azul `#014380` dá só **2,64:1**. Por isso o bloco azul usa as duas tiras em branco.

## Arquivos

| Arquivo | Uso |
|---|---|
| `simbolo-{cor,azul,preto,branco}.svg` | Símbolo |
| `simbolo-pequeno-*.svg` | Símbolo a 32 px ou menos (favicon, aba) |
| `lockup-horizontal-*.svg` | Assinatura principal (header, documentos) |
| `lockup-empilhado-*.svg` | Espaços quadrados (splash, redes, avatar) |
| `wordmark-*.svg` | Só o nome |
| `icone-app-{claro,azul,escuro,verde}.svg` | Opções de ícone de app (com cantos arredondados) |
| `icone-app-*-fullbleed.svg` | Fundo sem arredondar (iOS e lojas aplicam a máscara) |
| `icone-app-*-maskable.svg` | Android maskable (marca dentro da zona segura de 60%) |
| `icone-app-*-pequeno.svg` | Ícone com o corte pequeno |
| `web/` | `favicon.ico` (16/32/48), `favicon.svg`, `apple-touch-icon.png`, `icon-192/512.png`, `maskable-512.png`, `site.webmanifest`, `head-snippet.html` |
| `png/` | PNGs de 1024 px dos ícones e PNGs dos lockups |

## Ícone de app — opções

| Opção | Fundo | Marca | Quando usar |
|---|---|---|---|
| **Claro (padrão)** | `#FFFFFF` | azul + verde | Ícone principal; a marca completa em cor |
| Azul | `#014380` | branca | Lojas, redes, splash na cor primária |
| Escuro | `#000000` (preto) | longa branca + curta verde | Modo escuro |
| Verde | `#00984B` | branca | Campanhas de “menor preço”; uso pontual |

Os ícones web (`web/`) usam a opção **Claro**. Para trocar, gere de novo a partir de outro `icone-app-*.svg`.

## Regras

- **Respiro:** largura de uma tira (64/256 da altura do símbolo) em volta de toda a marca.
- **Tamanho mínimo:** símbolo 16 px (com o corte pequeno até 32 px) · lockup horizontal 120 px de largura.
- **Fundos:** branco, `#F5F7FA` e preto `#000000` (no preto, use a versão branca ou o ícone Escuro).
- **JAMAIS azul ou verde sobre preto.** No preto, a marca (símbolo, wordmark) é sempre toda branca. Única exceção: no ícone de app Escuro, a última nota (tira curta) é verde `#00984B`.
- **Proibido:** azul ou verde sobre preto, gradiente, sombra, contorno, inverter a ordem das tiras (a curta fica sempre à direita), verde na tira longa, esticar, recolorir fora da paleta, usar “e-notas” como marca pública.

## Pendências

- Teste de prateleira com Nota Paraná, Menor Preço e Busca Preço.
- Checagem de marca registrada (feita por uma pessoa).
- Substituir `marca/logo/` e os manuais v1 (`identidade-visual-notinhas-v1.html`, `notinhas.shop.DESIGN.md`) pela V9.
