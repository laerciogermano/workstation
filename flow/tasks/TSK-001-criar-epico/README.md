# TSK-001 — Criar épico

| Campo | Valor |
|-------|--------|
| ID | TSK-001 |
| Status | Doing |
| Pai | — |
| Board | [Flow](../../../board.md) |
| Output | [`epics/`](../../epics/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T001[TSK-001 Criar epico]
  T002[TSK-002 Criar as historias]
  T003[TSK-003 Explorar]
  T007[TSK-007 Criar arquivo]
  T008[TSK-008 Remover arquivo]
  T009[TSK-009 Renomear arquivo]
  T010[TSK-010 Mover arquivo]
  T011[TSK-011 Visualizar arvore]
  T028[TSK-028 Criar BDD]
  T029[TSK-029 Criar PAF]
  T030[TSK-030 Criar BDD]
  T031[TSK-031 Criar PAF]
  T032[TSK-032 Criar BDD]
  T033[TSK-033 Criar PAF]
  T034[TSK-034 Criar BDD]
  T035[TSK-035 Criar PAF]
  T036[TSK-036 Criar BDD]
  T037[TSK-037 Criar PAF]
  T004[TSK-004 Board]
  T013[TSK-013 Criar card]
  T014[TSK-014 Remover card]
  T015[TSK-015 Mover card]
  T016[TSK-016 Renomear card]
  T017[TSK-017 Abrir card]
  T018[TSK-018 Editar card]
  T019[TSK-019 Criar coluna]
  T020[TSK-020 Criar raia]
  T040[TSK-040 Criar BDD]
  T041[TSK-041 Criar PAF]
  T042[TSK-042 Criar BDD]
  T043[TSK-043 Criar PAF]
  T044[TSK-044 Criar BDD]
  T045[TSK-045 Criar PAF]
  T046[TSK-046 Criar BDD]
  T047[TSK-047 Criar PAF]
  T048[TSK-048 Criar BDD]
  T049[TSK-049 Criar PAF]
  T050[TSK-050 Criar BDD]
  T051[TSK-051 Criar PAF]
  T052[TSK-052 Criar BDD]
  T053[TSK-053 Criar PAF]
  T054[TSK-054 Criar BDD]
  T055[TSK-055 Criar PAF]
  T005[TSK-005 Gantt]
  T021[TSK-021 Criar tarefa]
  T022[TSK-022 Mover tarefa]
  T023[TSK-023 Remover tarefa]
  T024[TSK-024 Atribuir responsavel]
  T027[TSK-027 Visualizar tarefas]
  T056[TSK-056 Criar BDD]
  T057[TSK-057 Criar PAF]
  T058[TSK-058 Criar BDD]
  T059[TSK-059 Criar PAF]
  T060[TSK-060 Criar BDD]
  T061[TSK-061 Criar PAF]
  T062[TSK-062 Criar BDD]
  T063[TSK-063 Criar PAF]
  T068[TSK-068 Criar BDD]
  T069[TSK-069 Criar PAF]
  T070[TSK-070 Selecionar atividade]
  T071[TSK-071 Criar BDD]
  T072[TSK-072 Criar PAF]
  T073[TSK-073 Criar atividade]
  T074[TSK-074 Mover atividade]
  T075[TSK-075 Remover atividade]
  T076[TSK-076 Atribuir responsavel]
  T077[TSK-077 Visualizar arvore]
  T078[TSK-078 Selecionar atividade]
  T079[TSK-079 Criar BDD]
  T080[TSK-080 Criar PAF]
  T081[TSK-081 Criar BDD]
  T082[TSK-082 Criar PAF]
  T083[TSK-083 Criar BDD]
  T084[TSK-084 Criar PAF]
  T085[TSK-085 Criar BDD]
  T086[TSK-086 Criar PAF]
  T087[TSK-087 Criar BDD]
  T088[TSK-088 Criar PAF]
  T089[TSK-089 Criar BDD]
  T090[TSK-090 Criar PAF]
  T006[TSK-006 Arvore execucao]
  T001 --> T002
  T002 --> T003
  T003 --> T007
  T003 --> T008
  T003 --> T009
  T003 --> T010
  T003 --> T011
  T007 --> T028
  T007 --> T029
  T008 --> T030
  T008 --> T031
  T009 --> T032
  T009 --> T033
  T010 --> T034
  T010 --> T035
  T011 --> T036
  T011 --> T037
  T002 --> T004
  T004 --> T013
  T004 --> T014
  T004 --> T015
  T004 --> T016
  T004 --> T017
  T004 --> T018
  T004 --> T019
  T004 --> T020
  T013 --> T040
  T013 --> T041
  T014 --> T042
  T014 --> T043
  T015 --> T044
  T015 --> T045
  T016 --> T046
  T016 --> T047
  T017 --> T048
  T017 --> T049
  T018 --> T050
  T018 --> T051
  T019 --> T052
  T019 --> T053
  T020 --> T054
  T020 --> T055
  T002 --> T005
  T005 --> T021
  T005 --> T022
  T005 --> T023
  T005 --> T024
  T005 --> T027
  T005 --> T070
  T021 --> T056
  T021 --> T057
  T022 --> T058
  T022 --> T059
  T023 --> T060
  T023 --> T061
  T024 --> T062
  T024 --> T063
  T027 --> T068
  T027 --> T069
  T070 --> T071
  T070 --> T072
  T002 --> T006
  T006 --> T073
  T006 --> T074
  T006 --> T075
  T006 --> T076
  T006 --> T077
  T006 --> T078
  T073 --> T079
  T073 --> T080
  T074 --> T081
  T074 --> T082
  T075 --> T083
  T075 --> T084
  T076 --> T085
  T076 --> T086
  T077 --> T087
  T077 --> T088
  T078 --> T089
  T078 --> T090
  style T001 fill:#fff3cd
  style T002 fill:#fff3cd
  style T003 fill:#d4edda
  style T004 fill:#fff3cd
  style T005 fill:#fff3cd
  style T007 fill:#d4edda
  style T008 fill:#d4edda
  style T009 fill:#d4edda
  style T010 fill:#d4edda
  style T011 fill:#d4edda
  style T013 fill:#fff3cd
  style T014 fill:#fff3cd
  style T015 fill:#fff3cd
  style T016 fill:#fff3cd
  style T017 fill:#fff3cd
  style T018 fill:#fff3cd
  style T019 fill:#fff3cd
  style T020 fill:#fff3cd
  style T021 fill:#fff3cd
  style T022 fill:#fff3cd
  style T023 fill:#fff3cd
  style T024 fill:#fff3cd
  style T027 fill:#fff3cd
  style T070 fill:#fff3cd
  style T028 fill:#d4edda
  style T030 fill:#d4edda
  style T032 fill:#d4edda
  style T034 fill:#d4edda
  style T036 fill:#d4edda
  style T040 fill:#d4edda
  style T042 fill:#d4edda
  style T044 fill:#d4edda
  style T046 fill:#d4edda
  style T048 fill:#d4edda
  style T050 fill:#d4edda
  style T052 fill:#d4edda
  style T054 fill:#d4edda
  style T056 fill:#d4edda
  style T058 fill:#d4edda
  style T060 fill:#d4edda
  style T062 fill:#d4edda
  style T068 fill:#d4edda
  style T071 fill:#d4edda
  style T029 fill:#d4edda
  style T031 fill:#d4edda
  style T033 fill:#d4edda
  style T035 fill:#d4edda
  style T037 fill:#d4edda
  style T006 fill:#fff3cd
  style T073 fill:#fff3cd
  style T074 fill:#fff3cd
  style T075 fill:#fff3cd
  style T076 fill:#fff3cd
  style T077 fill:#fff3cd
  style T078 fill:#fff3cd
  style T079 fill:#d4edda
  style T081 fill:#d4edda
  style T083 fill:#d4edda
  style T085 fill:#d4edda
  style T087 fill:#d4edda
  style T089 fill:#d4edda
```

## Objetivo

Criar os épicos do projeto Flow.

## Filhos

- [`TSK-002`](TSK-002-criar-as-historias/README.md) — Criar as histórias
  - [`TSK-003`](TSK-002-criar-as-historias/TSK-003-explorar/README.md) — Explorar → Output [EP-01](../../epics/EP-01-explorar/README.md)
  - [`TSK-004`](TSK-002-criar-as-historias/TSK-004-board/README.md) — Board → Output [EP-02](../../epics/EP-02-board/README.md)
  - [`TSK-005`](TSK-002-criar-as-historias/TSK-005-gantt/README.md) — Gantt → Output [EP-03](../../epics/EP-03-gantt/README.md)
  - [`TSK-006`](TSK-002-criar-as-historias/TSK-006-arvore-de-execucao/README.md) — Árvore de execução → Output [EP-04](../../epics/EP-04-arvore-de-execucao/README.md)
