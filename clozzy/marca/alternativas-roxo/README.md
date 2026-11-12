# Clozzy — Alternativas para o roxo (estudo de variações)

Pink Deep `#E0005A`, preto e branco ficam. O roxo sai, e o verde do [estudo anterior](../identidade-verde-close/README.md) também foi descartado. Este estudo testa o que entra no lugar do roxo: o lado da criadora, os convites, o painel e o selo do close.

| Arquivo | O que é |
|---|---|
| [`alternativas-roxo.pdf`](alternativas-roxo.pdf) · `.html` | O estudo, 16 páginas |
| `svg/` | Símbolo e logo de cada variação em cada superfície (60 arquivos) |
| [`_build.py`](_build.py) | Gerador. Reaproveita as peças de `../identidade-verde-close/_build.py` |

## As variações

| | Cor | Hex | Leitura |
|---|---|---|---|
| 1 | **Amarelo-manteiga** | `#FFE45C` | Contraponto quente do rosa, sem vibrar. **Recomendação** |
| 2 | Limão | `#E8FF6B` | Elétrico e jovem; difícil de manter como cor fixa |
| 3 | Blush | `#FFD6E6` | Mesma família do rosa, só como fundo claro; a mais calma |
| 4 | Azul-bebê | `#A8D8FF` | Frio e leve, par Y2K com o rosa; segunda opção |
| 5 | Sem terceira cor | — | Controle: só Pink Deep, preto e branco |

As quatro cores são **claras**. Ficam longe do Pink Deep em luminosidade (o problema do verde era ter a mesma), não disputam o papel de marca e levam **texto e marca pretos** (13,9 a 18,9:1). Texto branco nelas não lê. O "nada preto no rosa" continua valendo só para o rosa.

## Páginas

Capa · por que essas quatro (contraste e amostras) · panorama · para cada variação: paleta, símbolo nas superfícies, logo, ícone e regras, mais as 10 peças (feed, capa, story, conteúdo do close, convite de criadora, app, anúncio, destaques, notificação, selo) · convite de criadora lado a lado · painel da criadora e ícone lado a lado · leitura.

## Gerar de novo

```bash
cd clozzy/marca/alternativas-roxo && python3 _build.py
```

Depende de `../identidade-verde-close/_build.py` (e, por ele, do manual v2, da identidade, das fontes e de `../fotos-criadoras/`, só uso interno).

## Caminho inverso

Apagar esta pasta. Nada fora dela depende dela.
