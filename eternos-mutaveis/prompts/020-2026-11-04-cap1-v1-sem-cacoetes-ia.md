# 020 — Cap. 1 v1 sem cacoetes de IA (base pré-correções)

| Campo | Valor |
|-------|--------|
| Número | 020 |
| Data | 2026-11-04 |
| Origem | Cursor |
| Título | Limpar cacoetes de IA na versão 1 do novo capítulo 1 (com fotos), sem usar o texto pós-018/019 |

## Prompt original

```
No capítulo um gerado pelo cloud dos eternos mutáveis, remova todos os sinais de AI,
mas não use o último documento, use o documento gerado pela primeira vez, que eu acho
que é a versão um, que tem as fotos que foi gerado pelo cloud e que não foi corrigido
depois das correções que eu adicionei. Use ele como base, mas remova todos os cacoetes
de AI, travessões e tudo mais, e mande o link pra eu olhar.
```

## Interpretação

Base = conteúdo de `novo-capitulo-1-claude.md` no commit `1a6ec688` (PDF com imagens / pós-pinturas 017), **antes** da análise crítica (018) e da passada de estilo (019). Não reaplicar as correções filosóficas do 018. Só limpar estilo de IA e regenerar HTML/PDF.

## O que foi feito

- Restaurado o argumento da v1 (sem premissa explícita, sem nota de apropriação de Platão, etc.).
- Removidos: travessões (resta 1, citação de Gênesis), negrito, “Olhe/Repare/Volte”, “Não é. É…”, “como veremos”, “Aqui é preciso cuidado”, “pode parecer místico”, “ouvir uma cor”, superlativos de abertura.
- Listas de características do mundo óbvio em prosa; tom de guia reduzido.
- Regenerados `novo-capitulo-1-claude.html` e `.pdf`.
