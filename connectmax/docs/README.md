# ConnectMax — Documentação

**Por quê:** índice e ponto de entrada dos artefatos derivados da visão.  
**Importante:** mostra a ordem da esteira e evita abrir um documento fora de contexto.  
**No fluxo:** [`visão`](../README.md) → **este índice** → funcionalidades → histórias → BDD → telas → componentes → protótipo.

Derivados do [documento de visão](../README.md).  
Regras para a IA na esteira: [`../config/config-ia.md`](../config/config-ia.md).  
Timeline de prompts: [`../prompts/timeline.md`](../prompts/timeline.md).

| Artefato | Arquivo | Papel no fluxo | Status |
|----------|---------|----------------|--------|
| Plano percepção imagem → hardware | [`plano-percepcao-imagem-hardware.md`](plano-percepcao-imagem-hardware.md) | WBS, Gantt e horas de esforço IA (Capture→Perceive→Decide→Actuate) | Feito |
| Funcionalidades | `functionalities.md` | Capacidades de cada seção e página em bullets | A produzir |
| Histórias de usuário | `user-stories.md` | O *quê* desejado pelo usuário (Como… quero… para…) | A produzir |
| Cenários BDD | `bdd.md` | Critérios de aceite por história (Dado / Quando / Então) | A produzir |
| Telas | `screens.md` | Superfícies de UI e o que cada uma faz | A produzir |
| Screens BDD | `screens-bdd.md` | Mesmos critérios, agrupados por tela | A produzir |
| Componentes | `components.md` | Inventário de UI para implementar | A produzir |
| Protótipo | `prototype.html` | Validação visual/interativa do que foi especificado | A produzir |

## Próximos passos

→ Implementar **F0** do [`plano-percepcao-imagem-hardware.md`](plano-percepcao-imagem-hardware.md) em `sources/android-control`  
→ Em paralelo na esteira de produto: `functionalities.md` (ainda não criado) a partir da [visão](../README.md)
