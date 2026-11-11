# Clozzy — Manual de identidade visual (apresentação)

Apresentação de 26 páginas (1600 × 900) para mostrar a marca: essência, logo, cor, **degradês rosa → roxo**, tipografia, voz e aplicações (banners, anúncios, feed, stories, capas, app, web, papelaria e merch). Base: [`../identidade-oficial/`](../identidade-oficial/README.md) (regras de cor, símbolo, lockup). Nome **clozzy em Gabarito 650**, o gabarito do [`comparativo-fontes.pdf`](../identidade-oficial-fontes/README.md).

| Arquivo | O que é |
|---|---|
| [`manual-identidade-clozzy.pdf`](manual-identidade-clozzy.pdf) · `.html` | O manual |
| `svg/` | 53 SVGs da marca com o nome em Gabarito 650 (mesma lista da identidade oficial) |
| `_apresentacao.py` | Gerador: troca a fonte do nome (`_fontes.usar`), reaproveita páginas de `identidade-oficial/_build.py` e acrescenta as novas |

```bash
cd clozzy/marca/apresentacao-identidade && python3 _apresentacao.py
```

Depende de `../identidade-oficial/`, `../identidade-oficial-fontes/` (troca de fonte) e `../identidade-nova/fonts/`. Usa Chrome headless só para gerar o PDF.

## Degradês (regra nova)
| Nome | Definição | Logo em cima |
|---|---|---|
| Pop | 135°, `#FF0065` 0% → `#7C48C4` 100% | versão rosa/roxa (tudo branco) |
| Aurora | base `#14090F`, brilho rosa inferior esquerdo e roxo superior direito | versão rosa/roxa (tudo branco) |
| Névoa | 135°, `#FFD9E7` → `#EBE3FA` | versão branco |

Degradê só em fundo; nunca no logo, símbolo, texto ou borda. Texto branco só a partir de 24 px em peso 800.

## Caminho inverso
- **Antes:** nome em Gabarito 800 e sem degradê ([`../identidade-oficial/`](../identidade-oficial/README.md), não alterada). **Depois:** nome em 650 e três degradês de fundo.
- Outro peso: mude `PESO` em `_apresentacao.py` (650 = haste a 85% do 800). Voltar ao 800: `PESO = 800`.
- Mudar um degradê: `POP`, `AURORA`, `NEVOA` no topo do script.

## Rollback

```bash
rm -rf clozzy/marca/apresentacao-identidade
```
