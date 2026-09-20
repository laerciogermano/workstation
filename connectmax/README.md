# ConnectMax

Umbrella ConnectMax + **screen-robot** na raiz do works:

| Projeto | Papel | Pasta |
|---------|-------|--------|
| **screen-robot** | Robô de tela: provisiona agent, lê UI, executa gestos | [`screen-robot/`](../screen-robot/README.md) |
| **linkedin-agent** | Agente LinkedIn: automatiza operações no app usando o screen-robot | [`linkedin-agent/`](linkedin-agent/README.md) |
| **vendas** | Processo de vendas / prospecção (cadência, fila, faturamento) | [`vendas/`](vendas/README.md) |

**Dependências:** `linkedin-agent` consome `screen-robot`; `vendas` consome `linkedin-agent` para ações no LinkedIn. O robô **não** conhece LinkedIn nem regras de venda; o agente LinkedIn **não** conhece fila/faturamento.

Prompts (timeline compartilhada): [`prompts/`](prompts/README.md).  
Config IA (umbrella): [`config/config-ia.md`](config/config-ia.md).

## Ordem sugerida

```text
screen-robot (ver → decidir → atuar na tela)
        ↓
linkedin-agent (login, busca, perfil, conexão, mensagem)
        ↓
vendas (cadência, fila, distribuição, faturamento)
```

## Próximos passos

→ [`screen-robot/README.md`](../screen-robot/README.md) — capacidades Node de tela  
→ [`linkedin-agent/README.md`](linkedin-agent/README.md) — operações LinkedIn  
→ [`vendas/README.md`](vendas/README.md) — esteira de produto de vendas
