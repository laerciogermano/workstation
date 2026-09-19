# Configurações para a IA — ConnectMax vendas

**Por quê:** garantir rastreio dos prompts e cascata da esteira de **vendas**.  
**Umbrella:** [`../../config/config-ia.md`](../../config/config-ia.md).  
**Timeline:** [`../../prompts/timeline.md`](../../prompts/timeline.md).

## Regras

1. Todo prompt novo: gravar em [`../../prompts/`](../../prompts/README.md) + linha na timeline.
2. Cascata da esteira de vendas até `prototype.html` quando o artefato for pedido/criado.
3. Ações de UI no LinkedIn: depender do [`../../screen-robot/`](../../screen-robot/README.md), não reimplementar perceive/actuate aqui.

## Árvore de execução (vendas)

```text
README.md (visão)
└── docs/README.md
    └── functionalities.md
        └── user-stories.md
            └── bdd.md
                └── screens.md
                    └── screens-bdd.md
                        └── components.md
                            └── prototype.html
```
