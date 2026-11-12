# 029 — Banners P&B e livro HTML v2

| Campo | Valor |
|-------|--------|
| Número | 029 |
| Data | 2026-11-09 |
| Origem | Claude Code |
| Título | Novos banners em preto e branco no estilo da capa e versão v2 do livro HTML |

## Prompt original

```
para cada banner, crie um outro que use o mesmo conceito, mas utilizando um desenho mais preto e branco mais relacoinado a capa algo nesse estilo, crie uma versao v2 com esses banners mudados novos do livro html
```

## O que foi feito

- `assets/banners-pb/_build_banners.py` → `cap-1..7.svg/.html/.png/.jpg` (1600×900, preto/branco/cinza, formas chapadas, sem texto), mesmo conceito de cada banner colorido (`assets/README.md`):
  1 o vão entre as mãos do rascunho (feminina preta no branco, masculina branca no preto), círculo incompleto, caverna · 2 trilha de símbolos das tradições e o buscador com lanterna · 3 anel de figuras iguais e pêndulo entre desejo e tédio · 4 portal de luz, figura entrando, corrente que vira pó · 5 verbo preso no bloco acorrentado × cubos com cadeado, fissura · 6 fita de cinema na notação do autor (verbo × objeto) e horizonte espelhado · 7 figura de pé com luz no peito, máscaras no chão, árvore.
- `livro-v2.html` (`python3 livro/_build_livro.py v2`): igual ao `livro.html`, mas o banner P&B abre cada capítulo (no lugar do ícone de dominó) e o banner colorido sai do texto. `livro.html` (v1) continua igual.
- Atenção: os primeiros parágrafos de cada capítulo leem o banner colorido; na v2 a descrição não bate com o desenho novo.
- Rollback: apagar `assets/banners-pb/` e `livro-v2.html`; tirar o bloco `V2` de `livro/_build_livro.py`.

> **Substituído no prompt 030:** os banners geométricos foram reprovados e `assets/banners-pb/` foi apagada; o v2 usa pranchas renascentistas em `assets/gravuras/`.
