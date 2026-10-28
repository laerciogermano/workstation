# ConnectMax

Umbrella ConnectMax + **screen-robot** na raiz do works:

| Projeto | Papel | Pasta |
|---------|-------|--------|
| **screen-robot** | Robô de tela: provisiona agent, lê UI, executa gestos | [`screen-robot/`](../screen-robot/README.md) |
| **linkedin-agent** | Agente LinkedIn: automatiza operações no app usando o screen-robot | [`linkedin-agent/`](linkedin-agent/README.md) |
| **vendas** | Processo de vendas / prospecção (cadência, fila, faturamento) | [`vendas/`](vendas/README.md) · [`api/`](vendas/api/README.md) · [`worker/`](vendas/worker/README.md) |

**Dependências:** `linkedin-agent` consome `screen-robot`; `vendas` consome `linkedin-agent` para ações no LinkedIn. O robô **não** conhece LinkedIn nem regras de venda; o agente LinkedIn **não** conhece fila/faturamento.

Prompts (timeline compartilhada): [`prompts/`](prompts/README.md).  
Config IA (umbrella): [`config/config-ia.md`](config/config-ia.md).  
Docs transversais: [`docs/`](docs/README.md) · portal franqueado: [`docs/portal-franqueado.md`](docs/portal-franqueado.md).  
Tasks Trello (insumos por card): [`tasks/`](tasks/README.md).  
Marca: [`marca/README.md`](marca/README.md) · ConectMax: [`marca/identidade-visual-conectmax-v1.html`](marca/identidade-visual-conectmax-v1.html) · logos: [`marca/logos/README.md`](marca/logos/README.md).

## Ordem sugerida

```text
screen-robot (ver → atuar na tela; lib)
        ↓
linkedin-agent (scripts por operação LinkedIn; sem IA no crítico)
        ↓
vendas (board, fila, device pool, cadência)
```

**Plano de implementação (scripts + pool):** [`docs/plano-implementacao-prospeccao-scripts.md`](docs/plano-implementacao-prospeccao-scripts.md).  
**Plano worker AVD (pull uniforme):** [`docs/plano-implementacao-worker-avd.md`](docs/plano-implementacao-worker-avd.md).

## Próximos passos

→ [`docs/plano-implementacao-worker-avd.md`](docs/plano-implementacao-worker-avd.md) — worker pull (servidor = gestor)  
→ [`docs/plano-implementacao-prospeccao-scripts.md`](docs/plano-implementacao-prospeccao-scripts.md) — arquitetura e ordem de construção  
→ [`screen-robot/README.md`](../screen-robot/README.md) — capacidades Node de tela  
→ [`linkedin-agent/README.md`](linkedin-agent/README.md) — operações LinkedIn  
→ [`vendas/README.md`](vendas/README.md) — esteira de produto de vendas
