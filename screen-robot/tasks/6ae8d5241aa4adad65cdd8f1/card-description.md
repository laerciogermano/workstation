## Objetivo
Na **lib human-cdp**, ao conectar (`connect` / `connectCdp`), permitir optar por **modo debug**. Com debug ligado, o **painel lateral de diagnóstico do bot-lab** (veredito + checks de comportamento / ambiente) **aparece flutuando junto ao mouse**, acompanhando o ponteiro enquanto a sessão roda.

## Problema
Hoje o feedback de detecção só existe no trilho fixo (`feedback-rail`) da página do bot-lab. Ao automatizar (mesmo no lab), o olhar fica longe do cursor; fora do lab não há overlay de diagnóstico. Precisamos de um modo explícito de conexão para inspecionar o que o lab “vê” **ao lado do mouse**.

## Escopo
1. Opção na conexão, ex.: `connect({ …, debug: true })` e `connectCdp(id, { debug: true })` (default **off**)
2. Com `debug: true`:
   - injetar/exibir o painel de diagnóstico (mesmo conteúdo essencial do `feedback-rail`: veredito, lista de comportamento, meters)
   - posicionar o painel **próximo ao cursor** (offset fixo, sem cobrir o ponto de clique; atualizar em `mousemove` / CDP mouseMoved)
   - atualizar o painel em tempo real com os sinais do bot-lab quando a página for o lab; documentar comportamento em páginas que não são o lab (só cursor/overlay mínimo ou N/A)
3. Com `debug: false` (default): zero overlay, zero impacto no aceite humano
4. Docs: README human-cdp — exemplo de connect com debug + caminho inverso (omitir flag / `debug: false`)
5. Aceite: connect com debug no bot-lab → painel visível e segue o mouse; connect sem debug → painel ausente; suíte `test:bot-lab` continua **humano** sem debug

## Entrega
- Flag `debug` no contrato de `connect` / `connectCdp`
- Overlay do diagnóstico junto ao mouse (CDP inject / página lab)
- README atualizado (uso + rollback)

## Fora de escopo
- UI de configuração persistente / preferência global
- Substituir o trilho fixo do bot-lab no layout normal (só modo debug flutuante)
- Debug de páginas arbitrárias com a suíte completa de checks do lab (salvo reuso mínimo documentado)

## Relacionados
- Lib humana: https://trello.com/c/5tt5ZTeN · `screen-robot/pocs/chrome-cdp/human-cdp/`
- Lab: https://trello.com/c/XcjfqioO · `screen-robot/pocs/bot-lab/` (`feedback-rail`)
- CRUD CDPs: https://trello.com/c/hoLSkLko
