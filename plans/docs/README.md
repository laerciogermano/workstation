# Documentação — Plans

Esteira de documentação do produto. Cada camada só avança quando a anterior está estável o bastante.

```text
Negócio (README)
  → Épicos
    → Histórias (+ critérios de aceite)
      → Refinamento técnico
        → Implementação / validação
```

| Camada | Onde | Contém | Não contém |
|--------|------|--------|------------|
| Negócio | [`../README.md`](../README.md) | Contexto, objetivo, definições, capacidades | Épicos, tickets, stack |
| Épicos | [`epics.md`](epics.md) | Capacidades de negócio e funcionalidades | API, schema, libs |
| Histórias | [`stories/`](stories/) | Valor entregável + critérios de aceite | Detalhe de implementação |
| Técnico | [`tech/`](tech/) | ADRs, spikes, breakdown de tarefas | Regras de negócio novas |

## Fluxo de trabalho

1. Congelar / atualizar definições em [`../README.md`](../README.md)
2. Derivar ou ajustar épicos em [`epics.md`](epics.md)
3. Fatiar o épico prioritário em histórias em `stories/ep-XX-.../`
4. Refinar tecnicamente histórias prontas (Definition of Ready) em `tech/`
5. Implementar, validar contra aceite e realimentar o negócio se a regra mudar

## Critérios entre camadas

- **Negócio pronto o bastante** — glossário e regras principais estáveis
- **Épico pronto** — dá para listar histórias sem inventar regra nova
- **História pronta (DoR)** — aceite claro e testável
- **Refinamento pronto** — tarefas técnicas sem descobrir “o que o produto é”
