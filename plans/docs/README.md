# Documentação — Plans

Esteira de documentação do produto. Cada camada só avança quando a anterior está estável o bastante.

```text
Negócio (README)
  → Épicos
    → Histórias (+ critérios de aceite)
      → Board (status / persona / versão)
        → Refinamento técnico
          → Implementação / validação
```

| Camada | Onde | Contém | Não contém |
|--------|------|--------|------------|
| Negócio | [`../README.md`](../README.md) | Contexto, objetivo, definições, capacidades | Épicos, tickets, stack |
| Épicos | [`epics.md`](epics.md) | Capacidades de negócio e funcionalidades | Status de US, API, schema |
| Histórias | [`stories/user-stories.md`](stories/user-stories.md) | Valor entregável + critérios de aceite | Status, versão, stack |
| Board | [`board.md`](board.md) | Status, persona e versão das US (kanban) | Texto de aceite, stack |
| Técnico | [`tech/`](tech/) | ADRs, spikes, breakdown de tarefas | Regras de negócio novas |

## Fluxo de trabalho

1. Congelar / atualizar definições em [`../README.md`](../README.md)
2. Derivar ou ajustar épicos em [`epics.md`](epics.md)
3. Manter histórias em [`stories/user-stories.md`](stories/user-stories.md)
4. Mover status e versão no board [`board.md`](board.md)
5. Refinar tecnicamente histórias `ready` (DoR) em `tech/`
6. Implementar, validar contra aceite e realimentar o negócio se a regra mudar

## Critérios entre camadas

- **Negócio pronto o bastante** — glossário e regras principais estáveis
- **Épico pronto** — dá para listar histórias sem inventar regra nova
- **História pronta (DoR)** — aceite claro e testável
- **Versão no board** — cada US com `vN` preenchida
- **Refinamento pronto** — tarefas técnicas sem descobrir “o que o produto é”
