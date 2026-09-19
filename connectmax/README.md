# ConnectMax

Umbrella com **dois projetos** independentes:

| Projeto | Papel | Pasta |
|---------|-------|--------|
| **screen-robot** | Robô de tela: captura imagem, identifica textos/ícones/listas e manipula (clicar, digitar, rolar) | [`screen-robot/`](screen-robot/) |
| **vendas** | Automação do processo de vendas / prospecção LinkedIn da operação ConnectMax | [`vendas/`](vendas/) |

**Dependência:** `vendas` consome o `screen-robot` para agir no LinkedIn; o robô **não** conhece regras de negócio de vendas.

Prompts (timeline compartilhada): [`prompts/`](prompts/).  
Config IA (umbrella): [`config/config-ia.md`](config/config-ia.md).

## Ordem sugerida

```text
screen-robot (ver → decidir → atuar na tela)
        ↓
vendas (cadência, fila, distribuição, faturamento)
```

## Próximos passos

→ [`screen-robot/README.md`](screen-robot/README.md) — épicos Capture → Perceive → Decide → Actuate
→ [`vendas/README.md`](vendas/README.md) — esteira de produto de vendas
