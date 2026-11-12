# 027 — Capa v2: preto e branco, dominó, quebra-cabeça, vermelho → lilás

| Campo | Valor |
|-------|--------|
| Número | 027 |
| Data | 2026-11-09 |
| Origem | Claude Code |
| Título | Outras versões de capa a partir dos desenhos do autor |

## Prompt original

```
crie outra versao, algo mais preto e branco, mais relacionado aos desenhos que existem no documentos qubera cabeca, algo como domino, algo como a capa sentdo preta com uma bola branca e atras ser branca com bola preta represntando a superacao adamica, o slogan tbm é a superacao adamica ou a alfabtizacao espiritual ou a gnose, escolha o melhor, poderia ser tbm iniciando com vermelho, era adamica, e terminand com lilas, superacao adamica, enfim crie possibilidades
```

## Interpretação

Base = rascunho de capa do autor em `inputs/Livro_ O Código.docx` (imagem 5, copiada para `capa/v2/rascunho-autor.png`): título à mão, peças de quebra-cabeça, retângulo-dominó (branco + bola preta = feminino, entrada, abstrato, espaço/forma, metafísico; preto + bola branca = sólido, saída, masculino, componente/matéria, físico, luz), mãos da era adâmica. Frente preta com bola branca (o homem na matéria, com a centelha); verso branco com bola preta (superação adâmica). Slogan escolhido: “A superação adâmica”.

## O que foi feito

- `capa/v2/_build_capa_v2.py` → `capa-{a,b,c,d}.html` (capa inteira 6×9 pol.: verso | lombada | frente), PNG da frente e da capa inteira, e `opcoes.html` / `opcoes.pdf` (rascunho + 4 opções).
- A Dominó · B Quebra-cabeça (encaixes atravessam a lombada) · C Vermelho → lilás (era adâmica → superação) · D Dominó em pé (ETERNOS no lado preto, MUTÁVEIS no branco).
- Verso com texto de contracapa (alfabetização espiritual, gnose, todos somos um).
- A capa v1 (`capa/capa.*`) segue no livro compilado até a escolha.
- Rollback: `rm -rf capa/v2`.
