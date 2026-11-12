# ADR-0006 · Snapshot público do personagem

- Status: aceito · 2026-11-09 · RF-43, RF-46, RN-17..19

## Decisão
`characters.public_stats` (jsonb) guarda só o que pode sair, já filtrado pelos toggles (`toPublicStats`). É recalculado a cada ação real (treino, dia fechado, medida, perfil, privacidade). Busca e perfil público leem apenas esse snapshot; posts só nascem com personagem + opt-in + toggle.

## Consequências
+ Fronteira de privacidade explícita e auditável; leitura pública barata.
− Snapshot pode ficar defasado até a próxima ação (aceitável).
