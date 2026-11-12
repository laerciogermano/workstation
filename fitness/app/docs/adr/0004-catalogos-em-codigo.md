# ADR-0004 · Catálogos de alimentos e exercícios versionados em código

- Status: aceito · 2026-11-09

## Decisão
Alimentos, refeições-modelo, exercícios, sessões e plano semanal vivem em `packages/domain` como `as const`. O banco guarda só referências (ids) do usuário; a API valida ids com `z.enum`. Academias ficam no banco (catálogo que cresce).

## Consequências
+ Cálculo offline no cliente com o mesmo catálogo; ids tipados.
− Mudar catálogo exige deploy; um id removido precisa de migração de dados.
