# Configurações para a IA — ConnectMax (umbrella)

**Por quê:** timeline única e mapa dos projetos.  
**Projetos:** [`../../screen-robot/`](../../screen-robot/README.md) · [`../linkedin-agent/`](../linkedin-agent/README.md) · [`../vendas/`](../vendas/README.md).  
**Timeline:** [`../prompts/timeline.md`](../prompts/timeline.md).

## Regras

### Salvar todos os prompts

Todo prompt do umbrella ConnectMax (qualquer subprojeto) deve ser gravado em [`../prompts/`](../prompts/README.md) com o próximo `NNN` e linha na timeline.

### Cascata

- Alterações em **screen-robot**: seguir [`../../screen-robot/config/config-ia.md`](../../screen-robot/config/config-ia.md).
- Alterações em **linkedin-agent**: seguir [`../linkedin-agent/config/config-ia.md`](../linkedin-agent/config/config-ia.md).
- Alterações em **vendas**: seguir [`../vendas/config/config-ia.md`](../vendas/config/config-ia.md).

## Mapa

```text
works/
├── screen-robot/       # robô de tela (device → elementos → gestos)
└── connectmax/
    ├── linkedin-agent/ # operações LinkedIn sobre o screen-robot
    └── vendas/         # processo de vendas / prospecção
```
