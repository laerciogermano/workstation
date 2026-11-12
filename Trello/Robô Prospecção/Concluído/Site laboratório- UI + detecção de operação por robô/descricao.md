## Objetivo
Criar um **site simples de laboratório** com botões, textos e componentes de interface que **identifique se está sendo operado por um robô ou por humano** — para validar, depois, navegação com **mouse real** (não só cliques via CDP).

O site deve cobrir **os mesmos tipos de sinais** que o site público famoso de detecção de bots ([bot.sannysoft.com](https://bot.sannysoft.com/)) usa para marcar automação/headless/CDP — além das heurísticas de interação (mouse/teclado).

## Contexto
Para o robô (screen-robot / Chrome CDP) precisamos evoluir além de `Input.dispatchMouseEvent`/cliques sintéticos: um sistema que use o **mouse** de forma mais humana. Antes disso, falta um alvo controlado onde possamos medir se a operação “parece robô”.

Já usamos o sannysoft no fluxo CDP (`screen-robot/pocs/chrome-cdp/` · `sannysoft-points.mjs`). O lab próprio precisa **reproduzir/espelhar** essa bateria de checks + UI interativa.

## Escopo
- Página(s) mínima(s) com UI típica: botões, inputs, links, selects, scroll, hover, drag (se fizer sentido)
- **Paridade com sannysoft (e refs públicas equivalentes):** painel de checks no mesmo espírito — webdriver/`navigator.webdriver`, Chrome headless, CDP/automation flags, plugins, languages, WebGL/vendor, permissions, iframe/chrome artifacts, user-agent inconsistente, etc. Resultado por check (pass/fail) comparável ao site público
- Sinais de **comportamento** (heurísticas no front), por exemplo:
  - timing/ritmo de cliques e digitação
  - trajetória e jitter do ponteiro (movimento contínuo vs jump)
  - eventos `isTrusted` / ausência de movimento antes do click
  - padrão de foco/tab vs click direto
  - scroll e hover sem mouseover prévio
- Painel/resultado claro: **humano** vs **suspeito/robô** + score, motivos e lista de checks (estilo sannysoft)
- Rodar local (estático ou servidor mínimo) para testes manuais e via automação

## Entrega
- Código do site no repositório (ex. POC em `screen-robot/pocs/…`)
- README: como subir; mapeamento dos checks vs sannysoft; o que cada sinal mede; como interpretar o score
- Critério de aceite:
  - operação humana “passa” nos checks comportamentais e nos de ambiente
  - automação só-CDP (clique sem trajetória / flags de automation) “falha”/marca robô
  - lado a lado com [bot.sannysoft.com](https://bot.sannysoft.com/): mesmos pontos críticos acendem no lab quando acendem no sannysoft

## Fora de escopo (neste card)
- Implementar o driver de mouse humano do robô
- Bypass de anti-bot de sites reais (LinkedIn etc.)