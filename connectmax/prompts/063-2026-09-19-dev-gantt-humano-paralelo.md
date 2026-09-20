# Prompt 063 — Gantt guia robôs; humano libera o próximo

**Data:** 2026-09-19  
**Projeto:** core/processo · core/tasks

## Prompt

```
adicone que o desenvolvimento todo e guiado pela ordem de atividades do gantt das tasks e que o proximo robo so vai entrar em acao quando a ativiadde for validade pelo humano

adicione tbm que quando a ativiade for sequencial, um robo deve epserar pelo outro, mas se for paralelo, ambos podem paralelizar as atividades e subir pull requests separados aguardando oa proxima aprovacao para executar o rpoximon passo da arvore de execucao e do gantt
```

## Interpretação

Desenvolvimento guiado pelo Gantt das tasks; próximo robô só após validação humana. Sequencial = espera; paralelo = PRs separados e avanço na árvore/Gantt só após aprovação.

## Resultado

- [`3.desenvolvimento/README.md`](../../../core/processo/3.desenvolvimento/README.md): ordem Gantt, gate humano, sequencial vs paralelo.
- Alinhados processo, workstation README e intro de [`core/tasks`](../../../core/tasks/README.md).
