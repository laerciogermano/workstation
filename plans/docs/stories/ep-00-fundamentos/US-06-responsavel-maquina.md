# US-06 — Responsável máquina

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **atribuir uma máquina como responsável de uma unidade**, para **tratar o trabalho como linguagem de programação executável**.

## Critérios de aceite

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma máquina, então a unidade passa a exibir essa máquina como responsável.
- [ ] Dado que uma unidade tem uma máquina como responsável, quando consulto a unidade, então o tipo de responsável identificado é máquina e a unidade é tratada como linguagem de programação.
- [ ] Dado que removo o responsável máquina, quando consulto a unidade, então ela deixa de ser tratada como linguagem de programação.

## Notas

- Bibliotecas, loops e estados aplicam-se explicitamente no Gantt; na unidade genérica, o comportamento mínimo de “linguagem” ainda precisa ser fechado.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
