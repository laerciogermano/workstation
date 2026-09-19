# Board

Gantts por projeto (prioridade maior → menor).  
Árvore de execução e status Todo/Doing/Done: [`tasks/`](../tasks/README.md).

---

## P1 — ConnectMax · screen-robot

Robô de tela em 4 épicos: Capture → Perceive → Decide → Actuate.  
**Premissa:** devices = **agents** (sem dual ADB/agent neste momento).  
Estimativas: **minutos de esforço IA** (não humano).  
Épicos: [`screen-robot/epics/`](../../connectmax/screen-robot/epics/README.md).

```mermaid
gantt
  title screen-robot — 4 épicos (minutos IA) — agent only
  dateFormat X
  axisFormat %s

  section EP-01 Capture
  Captura agent            :a01, 0, 90m

  section EP-02 Perceive
  Schema elemento          :b01, after a01, 24m
  OCR textos               :b02, after b01, 60m
  Controles vision         :b03, after b01, 90m
  Unificar lista           :b04, after b02, 36m
  CLI perceive             :b05, after b04, 30m

  section EP-03 Decide
  Selecionar elemento      :c01, after b05, 36m
  Decidir via LLM          :c02, after b05, 48m
  Goal sem coords          :c03, after c01, 72m
  Aguardar elemento        :c04, after c03, 30m
  Metricas                 :c05, after c03, 24m

  section EP-04 Actuate
  Gestos agent             :d01, 0, 102m
  Rolar ate achar          :d02, after c03, 36m
  Calibrar resolucao       :d03, after d01, 30m
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
