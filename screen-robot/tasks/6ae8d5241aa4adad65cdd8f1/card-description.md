## Objetivo
Na **lib human-cdp**, ao conectar (`connect` / `connectCdp`), permitir optar por **modo debug**. Com debug ligado, aparecem o **cursor virtual** (`fig-mouse`) e o **painel de comportamento fixo à direita**, minimizável — **conforme o bot-lab**.

## Problema
Sem debug, o programador não vê o ponteiro CDP nem o trilho de diagnóstico enquanto automatiza. O painel não deve flutuar junto ao mouse: deve permanecer no trilho direito do lab, com minimizar.

## Escopo
1. Opção na conexão: `connect({ …, debug: true })` e `connectCdp(id, { debug: true })` (default **off**)
2. Com `debug: true`:
   - cursor virtual seguindo o ponteiro (mousemove / CDP)
   - painel de comportamento **fixo à direita** (veredito + checks + meters no bot-lab)
   - botão minimizar/expandir (mesmo UX do bot-lab)
   - fora do lab: injeta mouse + trilho equivalente (sem checks ao vivo do lab)
3. Com `debug: false` (default): zero overlay, zero impacto no aceite humano
4. Docs + aceite `npm run test:debug`

## Entrega
- Flag `debug` em `connect` / `connectCdp`
- Overlay: mouse + rail fixo minimizável
- Minimizar nativo no bot-lab (`btn-rail-toggle`)
- README atualizado (uso + rollback)

## Fora de escopo
- Preferência global persistente
- Suíte completa de checks do lab em páginas arbitrárias

## Relacionados
- Lib humana: https://trello.com/c/5tt5ZTeN · `screen-robot/pocs/chrome-cdp/human-cdp/`
- Lab: https://trello.com/c/XcjfqioO · `screen-robot/pocs/bot-lab/`
- CRUD CDPs: https://trello.com/c/hoLSkLko
