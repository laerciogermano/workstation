# Clozzy — identidade “Estrela macia”

A Estrela macia da [rodada 15](../logo-glifos/README.md) (glifo 01) com um **ponto de câmera** em cima à direita, em duas formas:

- **Ícone**: só a estrela. Para app, favicon, botão, marca d’água e selo do close.
- **Símbolo**: a estrela dentro do anel do [logo-carregando](../logo-carregando/_carregando.py) (raio 41, espessura 8, traços 2→30° + linha). A estrela fica um pouco menor que a central do carregando: inscrita no círculo de raio 20 (lá é 22); sozinha, no ícone, cabe no círculo de raio 40,5.

| Arquivo | O que é |
|---|---|
| [`identidade-estrela-macia.pdf`](identidade-estrela-macia.pdf) · `.html` | 11 páginas: capa, a estrela (construção e escala), ícone × símbolo, seis anéis, cores, lockups, ícone de app, os seis temas do app, kit por tema, regras de uso, loader e arquivos |
| `svg/` | `icone-{fundo}`, `simbolo-{fundo}`, `simbolo-pequeno-{fundo}`, `logo-{horizontal|empilhado}-{com|sem}-anel-{fundo}`, `anel-{anel}-{preto|branco}`, `app-icon-{com|sem}-anel-{fundo}`, `loader-{fundo}` (animado) |
| [`_marca.py`](_marca.py) · [`_build.py`](_build.py) | Geradores (geometria · documento) |

## Estrela

Vale em 55% do raio, contorno de 37,5% do raio com junta redonda, giro −8°. Ponto da câmera: círculo de 14% do raio a −60° e 1,30 R do centro, no vão entre a ponta de cima e a da direita (`DOT_A`, `DOT_RK`, `DOT_SK` em `_marca.py`).

## Anéis

`carregando` (principal) · `tres-tracos` · `aberto` · `cheio` · `segmentos` · `grosso`. Em 32 px ou menos entra o corte pequeno do carregando (3 traços, anel 11).

## Cor

Só rosa `#FF0065`, Pink Deep `#E0005A`, roxo `#7C48C4`, preto `#000` e branco `#fff`. **Sem creme e sem quase-preto.** No preto, anel rosa e estrela branca (ícone sozinho em rosa); no rosa, no Deep e no roxo, tudo branco; no branco, Pink Deep e palavra preta. Nada preto no rosa; rosa e roxo nunca um sobre o outro; palavra Gabarito 800 sempre separada do símbolo.

## Temas

A página 8 mostra a marca nos seis temas do [protótipo mobile](../../docs/prototipo-mobile/index.html): Preto + rosa, Preto + roxo, Branco + rosa, Branco + roxo, Rosa total e Roxo total.

## Gerar de novo

```bash
cd clozzy/marca/identidade-estrela-macia
python3 _marca.py && python3 _build.py
```
