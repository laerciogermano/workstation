# 010 — Editor visual da linguagem Flow com código em tempo real

| Campo | Valor |
|-------|--------|
| Número | 010 |
| Data/hora | 2026-11-19 |
| Origem | Chat no Claude Code (workstation) |
| Título | Editor visual da linguagem Flow com código em tempo real |

## Prompt original

```
dentro do projeto flow language, crie o sistema que ao desenhar um codigo visual usando a mesma estrutura da visao flow ide do flow, porem nesse sistema vai ser focado apenas na lninguagem, na parte visual que pode ser manipulada e transformada em codigo. o sistema deve ter uma interface igual a do flow ide, porem focada nisso, onde o usuario podera criar um novo fluxo, adicionar filho, irmao e etc... evisualizar em tempo real o codigo
```

Complementos enviados durante a execução:

```
contendo tbm todas as estruturas, solidos, abstratos, funcao, dado, estado, e etc
```

```
condicao, repeticao e etc
```

## Interpretação

Criar em `flow-language/editor/` um editor visual (mesma interface do Flow IDE: Explorar · Flow · painel de código) só da linguagem: novo fluxo, filho, irmão, paralelo, condição (if/senão ↺), repetição (for/while), funções sólidas/abstratas/vazadas, dados sólidos/abstratos, estados sN, responsáveis; código JS/TS/Python e notação Flow gerados em tempo real.

## O que foi feito

- 1ª versão (interface própria) rejeitada: "ta tudo errado, era pra ter feito identico ao flow ide".
- [`../editor/`](../editor/README.md): refeito a partir do próprio Flow IDE (`flow-dev/prototipo`), aberto na tela Flow em tela cheia, com painel Código ao vivo (JS/TS/Python/FOP-IR) e botão Novo fluxo; sem Executar/Terminal.
- Painel Código recolhível (ícone `panel-right` / atalho **N**), no padrão das notas do protótipo; preferência em `localStorage` `flow-lang-code`.
