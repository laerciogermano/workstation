# 021 — Lista do player por épicos

| Campo | Valor |
|-------|--------|
| Número | 021 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Menu à esquerda do player agrupado por épicos |

## Prompt original

````
deixe os menus a esquer dafile:///Users/laerciogermano/Documents/works/super-portal/prototipo/index.html#A-01 concifug 

```
A · Acesso

A-01
Entrar

A-02
Recuperar senha

A-03
E-mail sem acesso

A-04
Saiu do portal
B · Início e fila de decisão

B-16
Menu completo (celular)
H · Cadastros e equipe

H-76
Vendedores

H-78
Cadastro de vendedor
J · White-label e automação

J-97
Minha conta
```

 cpnfigurados por epicos
````

## Interpretação

A lista de telas à esquerda do player deixa de ser agrupada por fluxo (A, B, H, J) e passa a ser agrupada por épico.

## O que foi feito

- [`prototipo/js/app.js`](../prototipo/js/app.js): grupos E01 a E11 na lista; as setas ← → seguem a mesma ordem.
- [`prototipo/README.md`](../prototipo/README.md) atualizado.
