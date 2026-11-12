## Problema
No bot-lab, **Trajetória do ponteiro** falha com teleportes: o cursor CDP “pula” entre ações em vez de partir de onde parou.

## Objetivo
Todo movimento do mouse na `human-cdp` deve ser **contínuo**:
- partir sempre da última posição despachada (`_cursor` real)
- sem saltos grandes entre pontos (subdividir trajetória)
- primeiro/último ponto âncora exatos (sem jitter nas pontas)
- clique/drag só depois de chegar no alvo por `mouseMoved`
- persistir cursor entre `connectCdp` da mesma porta

## Aceite
1. `ometv-1` e `ometv-2` no bot-lab com `debug: true`
2. Reset + cliques + drag + type via human-cdp
3. Check **Trajetória do ponteiro** = **pass** nos dois
4. Veredito **humano**

## Escopo
`screen-robot/pocs/chrome-cdp/human-cdp/` (`human.mjs`, `session.mjs`) · lab [`bot-lab`](https://trello.com/c/XcjfqioO)

## Relacionados
- Lib humana: https://trello.com/c/5tt5ZTeN
- Debug overlay: https://trello.com/c/W4GN946S