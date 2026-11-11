# Clozzy — aplicações da marca (v2)

Peças que usam [`identidade-oficial-v2`](../identidade-oficial-v2/README.md) para ver a marca em uso. Os SVGs, Gabarito e Figtree são lidos direto de lá (sem cópia).

| Peça | Status | Arquivo |
|---|---|---|
| Landing page | piloto — aguardando validação | [`landing/index.html`](landing/index.html) · [`preview.png`](landing/preview.png) |
| App, posts, feed, stories, etc. | só depois de validar o piloto | — |

Regras aplicadas: rosa `#FF0065` só com logo/título branco; preto `#14090F` com anel rosa; roxo sem rosa em cima; Pink Deep em fundo claro; Gabarito 800–900 nos títulos, Figtree no texto; sem gradiente/sombra.

`shot.mjs` tira PNG via Chrome CDP (:9290, perfil `~/chrome-profiles/clozzy-mockups`):

```bash
node shot.mjs landing/index.html landing/preview.png 1440 900 1   # 1 = página inteira
```

## Caminho inverso
`rm -rf clozzy/marca/aplicacoes-v2`; fechar o Chrome da :9290 e apagar `~/chrome-profiles/clozzy-mockups`.
