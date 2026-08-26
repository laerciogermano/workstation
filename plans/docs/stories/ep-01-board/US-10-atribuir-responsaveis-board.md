# US-10 — Atribuir responsáveis no board

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **atribuir responsáveis a cards**, para **definir quem (pessoa, IA, prestador ou máquina) conduz cada item**.

## Critérios de aceite

- [ ] Dado que existe um card no board, quando atribuo um responsável de qualquer tipo permitido, então o card exibe esse responsável.
- [ ] Dado que um card já tem responsável, quando altero o responsável, então o card passa a exibir o novo responsável.
- [ ] Dado que informo um tipo de responsável não permitido, quando tento atribuir, então o sistema rejeita a operação.

## Notas

- Se um card pode ter múltiplos responsáveis ou apenas um não está no README (assume-se um).

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
