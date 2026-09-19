# Board

Gantts por projeto (prioridade maior → menor).  
Árvore de execução e status Todo/Doing/Done: [`tasks/`](../tasks/README.md).

---

## P1 — ConnectMax · screen-robot

Robô de tela: imagem → lista de elementos → clicar/digitar/rolar.  
Estimativas: **minutos de esforço IA** (não humano).

```mermaid
gantt
  title screen-robot (minutos de esforço IA)
  dateFormat X
  axisFormat %s

  section F0 Fundamentos
  F0.1 Contratos           :a01, 0, 24m
  F0.2 AdbCapture          :a02, after a01, 30m
  F0.3 AdbActuate          :a03, after a01, 24m
  F0.4 Smoke               :a04, after a02, 18m

  section F1 Perceive
  F1.1 Schema              :b01, after a04, 24m
  F1.2 OCR                 :b02, after b01, 60m
  F1.3 Vision              :b03, after b01, 90m
  F1.4 Merge               :b04, after b02, 36m
  F1.5 CLI + overlay       :b05, after b04, 30m

  section F2 Decide
  F2.1 Matcher             :c01, after b05, 36m
  F2.2 LLM Decide          :c02, after b05, 48m
  F2.3 Steps goal          :c03, after c01, 48m
  F2.4 Example E2E         :c04, after c03, 24m

  section F3 Robustez
  F3.1 Wait/retry          :d01, after c04, 30m
  F3.2 Scroll              :d02, after c04, 36m
  F3.3 Calibracao          :d03, after c04, 30m
  F3.4 Metricas            :d04, after d01, 24m

  section F4 Hardware
  F4.1 Revisar contratos   :e01, after d04, 18m
  F4.2 Capture agent       :e02, after e01, 90m
  F4.3 Actuate agent       :e03, after e01, 90m
  F4.4 Flag + regressao    :e04, after e02, 48m
```

→ [`tasks`](../tasks/README.md#p1--connectmax--screen-robot)

---

## P1b — ConnectMax · vendas

Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p1b--connectmax--vendas)

---

## P2 — Flow

Pré-requisito do Plans.  
Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p2--flow)

---

## P3 — Plans

Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p3--plans)

---

## P4 — RoleGo

Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p4--rolego)

---

## P5 — Chines

Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p5--chines)

---

## P6 — Caronas

Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p6--caronas)

---

## P7 — Fitness

Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p7--fitness)

---

## P8 — Eternos Mutáveis

Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p8--eternos-mutáveis)

---

## P9 — Jiu-jitsu

Sem Gantt ainda.

→ [`tasks`](../tasks/README.md#p9--jiu-jitsu)
