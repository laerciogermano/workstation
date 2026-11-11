# Clozzy — Identidade oficial · teste de fontes do nome

Mesmo documento da [`identidade-oficial/`](../identidade-oficial/README.md) (16 páginas, regras de cor e lockup iguais), com o nome **clozzy** mais fino e em fontes diferentes que combinam com o Gabarito (redondas, geométricas). Só a palavra muda; o resto do documento continua em Gabarito + Figtree.

**Mais fino:** a haste do l fica em **85%** da do Gabarito 800. A espessura é medida no contorno (largura do l a 45% da altura, relativa à altura do l), então a comparação vale entre fontes; cada uma recebe o peso que chega nesse valor. O l tem a mesma altura (681) em todas, então o lockup (anel 1,4× o l, vão 0,35 l) não muda.

| Pasta | Fonte · peso | Leitura |
|---|---|---|
| [`gabarito/`](gabarito/identidade-clozzy-gabarito.pdf) | Gabarito 650 | a mesma fonte, mais leve: o controle |
| [`outfit/`](outfit/identidade-clozzy-outfit.pdf) | Outfit 660 | geométrica limpa |
| [`lexend/`](lexend/identidade-clozzy-lexend.pdf) | Lexend 630 | larga e aberta |
| [`nunito/`](nunito/identidade-clozzy-nunito.pdf) | Nunito 780 | terminais redondos, a mais macia |
| [`rubik/`](rubik/identidade-clozzy-rubik.pdf) | Rubik 560 | cantos levemente arredondados |
| [`fredoka/`](fredoka/identidade-clozzy-fredoka.pdf) | Fredoka 580 | redonda e informal |

[`comparativo-fontes.pdf`](comparativo-fontes.pdf): o nome em cada fonte nas quatro versões (preto, rosa, roxo, branco), mais 24 e 16 px, ao lado do Gabarito 800 original.

Cada pasta tem `identidade-clozzy-<fonte>.pdf` · `.html` e `svg/` (53 arquivos, mesma lista da identidade oficial). As regras de cor são as mesmas.

```bash
cd clozzy/marca/identidade-oficial-fontes && python3 _fontes.py          # tudo
python3 _fontes.py nunito                                                # só uma
```

`_fontes.py` troca o desenho das letras em tempo de execução (`T.glyph`), calibra o peso (`pesos.json`, cache) e chama o gerador da identidade oficial. `_stem.py` mede a haste. Fontes em `fonts/` (Google Fonts, OFL; Gabarito vem de `../identidade-nova/fonts/`). Mudar `ALVO` (0,85) em `_fontes.py` refaz tudo mais fino ou mais grosso; apague `pesos.json` depois.

## Caminho inverso
- **Antes:** nome em Gabarito 800. **Depois (teste):** nome a 85% da espessura, em outra fonte.
- Mudança no código da `identidade-oficial/`: `_build.py` ganhou `NOME_FONTE`, `OUT_DIR`, `OUT_NAME`, `DOC_TITULO` e `FONTS` como variáveis, e `_marca.build(out)` aceita pasta de saída. Os valores padrão reproduzem o documento original (a página de tipografia passou a citar “Nome clozzy: Gabarito 800”).
- Para ficar com uma fonte: use a pasta dela. Para voltar ao oficial: [`../identidade-oficial/`](../identidade-oficial/README.md).

## Rollback

```bash
rm -rf clozzy/marca/identidade-oficial-fontes
```
