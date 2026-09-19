# Board

Gantts por projeto (prioridade maior → menor).  
Árvore de execução e status Todo/Doing/Done: [`tasks/`](../tasks/README.md).

---

## P1 — ConnectMax · screen-robot

Robô de tela em 4 épicos: Capture → Perceive → Decide → Actuate.  
Estimativas: **minutos de esforço IA** (não humano).  
Épicos: [`screen-robot/epics/`](../../connectmax/screen-robot/epics/README.md).

```mermaid
gantt
  title screen-robot — 4 épicos (minutos IA)
  dateFormat X
  axisFormat %s

  section EP-01 Capture
  Contratos Capture        :a01, 0, 12m
  AdbCapture               :a02, after a01, 30m
  Smoke frame              :a03, after a02, 9m
  Capture agent            :a04, after a03, 90m
  Flag backend capture     :a05, after a04, 24m

  section EP-02 Perceive
  Schema Element           :b01, after a03, 24m
  OCR                      :b02, after b01, 60m
  Vision                   :b03, after b01, 90m
  Merge                    :b04, after b02, 36m
  CLI + overlay            :b05, after b04, 30m

  section EP-03 Decide
  Matcher                  :c01, after b05, 36m
  LLM Decide               :c02, after b05, 48m
  Steps + goal E2E         :c03, after c01, 72m
  Wait/retry               :c04, after c03, 30m
  Metricas                 :c05, after c04, 24m

  section EP-04 Actuate
  Contratos Actuate        :d01, 0, 12m
  AdbActuate               :d02, after d01, 24m
  Smoke tap                :d03, after d02, 9m
  Scroll                   :d04, after c03, 36m
  Calibracao               :d05, after c03, 30m
  Actuate agent            :d06, after d05, 90m
  Flag backend actuate     :d07, after d06, 24m
```

→ [`tasks`](../tasks/README.md#p1--connectmax--screen-robot) · [`epics`](../../connectmax/screen-robot/epics/README.md)

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
