# 028 — Capas: azul na C, opções das mãos (E/F), texto do verso; livro em HTML com música

| Campo | Valor |
|-------|--------|
| Número | 028 |
| Data | 2026-11-09 |
| Origem | Claude Code |
| Título | Ajustes nas capas v2 e livro completo em HTML com trilha por capítulo |

## Prompts originais

```
fique com a ultima e construa um html com todo o livro e que rode musicas de acofdo om cada capitulo ou pagina
```
```
e o penultimo, deixe azul o fundo, vermelho a capa e azu o fundo representando a dualidade no opcoes... nao no livro html q vc vai fazer agora, para esse use o ultmo
```
```
crie trambem uma opcao das maos antes nao se tocando e depois se tocando em preto e branco tbm, adicinoe essa opcao
```
```
uma mao feminia preta e a branca masculina
```
```
no texto atras ficou mto bom, msa coloque que descobriu por meio da programacao, e nao dos solidos e abstratos, precisa dizer que veio do codigo, da programacao, coisa assim
```
```
na cama das maos, a primeira as duas estao afastadas, interpretando o quadro de michelangelo, e no fim, as duas estao se tocando esticadas e um bnrilho acontece
```
```
crie uma versao horizontal e outra vertical
```
```
a capa nao sai nada dos dedos, apenas os dois esticados se tocando, melho
```
```
nas maos, o branco fica em cima e o preto em baixo, a mao branca fica em baixo e a mao preta em cima, a mao branca é masclina e a preta feminina
```

## O que foi feito

- **Opção C** (`capa/v2/`): frente vermelha, verso azul (dualidade); lombada faz a passagem.
- **Texto do verso** (todas as opções): a resposta veio do código, “Foi programando sistemas que entendeu como o real é construído”.
- **Opção E · As mãos (horizontal)**: mãos do rascunho do autor (`_build_maos.py` → `maos-feminina.png` preta, `maos-masculina.png` branca). Frente: metade branca com a mão feminina preta, metade preta com a mão masculina branca, afastadas (o vão do afresco de Michelangelo). Verso: os dedos esticados se tocando, sem brilho (o brilho foi testado e retirado a pedido). Texto em duas cores, cortado na divisa.
- **Opção F · As mãos (vertical)**: branco em cima com a mão feminina preta descendo; preto embaixo com a mão masculina branca subindo; frente afastadas, verso se tocando.
- `opcoes.pdf` regenerado com A–F.
- **Livro em HTML** (`livro.html` ← `livro/_build_livro.py`): capa D (dominó em pé) na abertura e contracapa D no fim; caps. 1–7 de `eternos-mutaveis.html`; abertura de cada capítulo com dominó, título e a música; player fixo (tocar/pausar, volume, capítulos, progresso, tecla M); a trilha troca com crossfade quando um capítulo chega ao meio da tela.
- Trilha (`assets/musica/*.mp3`, Wikimedia Commons, domínio público/CC0/CC BY): abertura Satie Gymnopédie 1 · 1 Bach Air · 2 Satie Gnossienne 1 · 3 Grieg Na gruta do rei da montanha · 4 Bach Prelúdio BWV 846 (Ishizaka, CC0) · 5 Chopin Prelúdio op. 28 nº 4 (Ivan Ilić, CC BY 3.0) · 6 Debussy Clair de lune · 7 Bach BWV 147. Créditos no fim do livro.
- Rollback: apagar `livro.html`, `livro/`, `assets/musica/`; remover `"e"`/`"f"` de `capa/v2/_build_capa_v2.py` e os `maos-*.png`.
