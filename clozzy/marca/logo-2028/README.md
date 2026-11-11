# Clozzy 2028 — logos, rodada 2

Novas possibilidades de símbolo seguindo `core/definir-projeto-moderno/04-logos` (brief → clichês → word map → longlist → SVG preto → testes 16 px / 1 cor / leitura → **checkpoint**). Cor e tipo vêm de [`../identidade-nova/`](../identidade-nova/README.md).

| Arquivo | O que é |
|---|---|
| [`apresentacao-logos-clozzy-2028.pdf`](apresentacao-logos-clozzy-2028.pdf) | Apresentação: brief, 8 conceitos em cor, aplicações, notas, recomendação |
| `apresentacao-logos-clozzy-2028.html` | Mesmo conteúdo (self-contained) |
| [`conceitos/00-folha-conceitos-pb.png`](conceitos/00-folha-conceitos-pb.png) | Folha em P&B (64/32/16 px), gerada com `concept_sheet.py` |
| `conceitos/<slug>[-color|-white|-lockup|-lockup-color|-app].svg` | Masters por conceito (grid 256, só fills) |
| `_conceitos.py` · `_apresentacao.py` | Geradores |

| | Conceito | Tipo | Nota | Status |
|---|---|---|---|---|
| A | Círculo próximo | Combination | 21 | Base atual (kit identidade-nova; “B” na rodada 1) |
| B | **Ingresso** | Pictorial | 20 | **Recomendado entre os novos** |
| C | Etiqueta | Pictorial | 19 | Alternativa |
| D | Bastidores | Abstract | 17 | Alternativa (risco de leitura) |
| E | Cometa | Lettermark | 15 | Descartar (lê “recarregar”) |
| F | Entre nós | Abstract | 14 | Descartar (Venn/Mastercard) |
| G | Vitrine | Pictorial | 15 | Descartar (porta/lápide) |
| H | Costura zz | Lettermark | 20 | Alternativa forte / padrão gráfico |

## Rodada 3 — mais símbolos + cor

[`apresentacao-logos-clozzy-2028-r3.pdf`](apresentacao-logos-clozzy-2028-r3.pdf) · folha P&B [`conceitos/00-folha-conceitos-r3-pb.png`](conceitos/00-folha-conceitos-r3-pb.png) · gerador `_rodada3.py` + `_apresentacao_r3.py` (usa shapely).

| | Conceito | Tipo | Cor mostrada | Nota | Status |
|---|---|---|---|---|---|
| I | Pulseira VIP | Pictorial | Close Verde | 16 | Fraca em 16 px |
| J | Chave-estrela | Pictorial | Cobalto + Manteiga | 17 | Fraca em 16 px |
| K | **Estrela aberta** | Abstract/lettermark | Batom | 22 | Finalista |
| L | **Abraço** ( ★ ) | Abstract | Laranja Drop | 21 | **Favorito** |
| M | Liberado (toggle) | Pictorial | Cereja | 17 | Genérico de UI |
| N | Drop (caixa) | Pictorial | Manteiga | 15 | Comum |
| O | **Ingresso zz** | Combination | Pink | 21 | Finalista |
| P | o-estrela | Wordmark-led | Cacau + Pêssego | 20 | Alternativa de wordmark |

**8 paletas:** Pink Clozzy · Batom · Laranja Drop · Close Verde · Cobalto + Manteiga · Cereja · Manteiga · Cacau + Pêssego. Contraste e risco de concorrente na pág. 2; matriz símbolo × cor na pág. 7.

Kit completo só depois da escolha (checkpoint do método).

```bash
cd clozzy/marca/logo-2028 && python3 _apresentacao.py && python3 _apresentacao_r3.py
```

Rollback: `rm -rf clozzy/marca/logo-2028`
