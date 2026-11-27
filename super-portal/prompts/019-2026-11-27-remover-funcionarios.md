# 019 — Remover funcionários

| Campo | Valor |
|-------|--------|
| Número | 019 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Remover funcionários do protótipo |

## Prompt original

```
file:///Users/laerciogermano/Documents/works/super-portal/prototipo/index.html#H-76 remova funcionarios
```

## Interpretação

Tirar do protótipo a tela Funcionários (H-77) e o que só existia por causa dela. Vendedores (H-76) fica.

## O que foi feito

- Tela H-77 e item de menu removidos; H-78 passa a ser só “Cadastro de vendedor”, sem cargo e permissões.
- Grupo “Funcionários” dos envolvidos em chamados vira “Logística”.
- Mantidas as pessoas de exemplo que sustentam os perfis Administrador e Logística.
- [`prototipo/`](../prototipo/index.html) e [`docs/epics.md`](../docs/epics.md): 82 telas.
