# Prompt 009 — 2026-09-19 — Separar ConnectMax em screen-robot e vendas

## Metadados

| Campo | Valor |
|-------|--------|
| Data | 2026-09-19 |
| Número | 009 |
| Slug | separar-screen-robot-e-vendas |

## Prompt original

```text
crie um projeto dentro de connect max, separe em dois, um é para criar apenas o robo que extrai uma imagem e conseguimos manipular por meio del listas, cliques, escrever alo, identificar icones, textos, dentre outras coisas, manipular a tela para deicdir o que fqzer, ditiar ou clicar e o outro projeto [e automatizar a conecct maxo processo de vendas
```

## Interpretação

Dividir o ConnectMax em dois projetos: (1) robô genérico de tela (imagem → elementos → clicar/digitar/rolar); (2) automação do processo de vendas/prospecção, consumindo o robô.

## O que foi feito

- Criados [`screen-robot/`](../../screen-robot/README.md) (sources + planos de percepção + functionalities do robô) e [`vendas/`](../vendas/README.md) (visão comercial + functionalities de vendas).
- Umbrella [`../README.md`](../README.md); board P1 / P1b; índices na workstation.
- Este registro + timeline.
