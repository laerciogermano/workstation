# 030 — Pranchas renascentistas P&B no livro v2 (substituem os banners geométricos)

| Campo | Valor |
|-------|--------|
| Número | 030 |
| Data | 2026-11-09 |
| Origem | Claude Code |
| Título | Banners mais renascentistas, feitos à mão, traço fino, preto e branco |

## Prompt original

```
ficou pessimo, prcisaria ser algo mais renascentista, algo como se tivesse feito a mao mas de forma muito bem feita, tracos finos, algo bem renascentista, msa preto e branco
```

## Interpretação

Os banners geométricos em SVG do prompt 029 foram reprovados. Sem gerador de imagem nesta sessão, o caminho fiel a “renascentista, feito à mão, traço fino, P&B” é usar gravuras reais do Renascimento (buril e xilogravura, domínio público / CC0) escolhidas pelo mesmo conceito de cada banner, tratadas na tinta e no papel da capa.

## O que foi feito

- `assets/gravuras/originais/` (downloads do Wikimedia Commons) → `assets/gravuras/_build_gravuras.py` → `cap-1..7.jpg` (recorte de margens/legendas, autocontraste, tinta #0B0B0B sobre papel #F4F2EC).
  1 Dürer, *Adão e Eva* (1504, NGA, CC0) · 2 Dürer, *São Jerônimo no estúdio* (1514, NGA, CC0) · 3 *Roda da Fortuna*, *A Nau dos Insensatos* (Basileia, 1494, DP) · 4 Gravura Flammarion (1888, à maneira antiga, DP) · 5 Giorgio Ghisi segundo Rafael, *A Escola de Atenas* (1550, DP) · 6 Khunrath, *Anfiteatro da Sabedoria Eterna*, oratório e laboratório (1595, DP) · 7 Dürer, *O Cavaleiro, a Morte e o Diabo* (1513, NGA, CC0).
- `livro-v2.html`: cada capítulo abre com a prancha (tamanho natural, legenda com autor/obra/ano) sobre a página preta; créditos das pranchas no fim.
- `assets/banners-pb/` (prompt 029) apagada.
- Rollback: apagar `assets/gravuras/` e voltar o bloco `V2` de `livro/_build_livro.py`.

> **Atualizado no prompt 031:** caps. 3 e 5 trocados por Goltzius, *Íxion*, e Dürer, *O desenhista*, para não repetir obras do texto.
