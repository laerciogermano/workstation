# Deploy — FOP (fop.laerciogermano.com · flow-oriented-programming.com)

**URL:** https://flow-oriented-programming.com/ · https://www.flow-oriented-programming.com/ · https://fop.laerciogermano.com/ (URL limpa — sem `flow-novo.html` nem `?tema=`)  
**Host:** Contabo `185.250.37.82` · root `/opt/fop` · nginx site `fop` · `index.html` (= editor)  
**DNS Hostinger**
- zona `flow-oriented-programming.com`: A `@` → `185.250.37.82`; CNAME `www` → `flow-oriented-programming.com`
- zona `laerciogermano.com`: A `fop` → `185.250.37.82` (também coberto pelo wildcard `*` → `185.250.37.82`)
**Cert LE:** `fop.laerciogermano.com` (SAN: apex + www)  
**Tema:** default `eternos-black` no host FOP (localStorage / bolinhas; sem query na URL)  
**App / PWA:** metas mobile (viewport-fit, apple-web-app, theme-color) + `manifest.webmanifest` + `sw.js` (instalável / “Adicionar à Tela de Início”). Nginx: HSTS, `nosniff`, Referrer-Policy, Permissions-Policy; `index.html`/`sw.js`/`manifest` com `Cache-Control: no-cache` (mesmo espírito notinhas/rolego).  
**Conteúdo:** [`../example/`](../example/) · marca: logo no header + **Flow** (regra [`.cursor/rules/fop-flow-language.mdc`](../../../.cursor/rules/fop-flow-language.mdc))  
**Projeto padrão:** só o fluxo `main` (raiz vazia). Os samples (11 funções de front) ficam em `fop-samples.json` e na documentação. **Docs:** `/fop-docs.html` (manual) · `/fop-conceitos.html` (os 20 conceitos do livro, um por um, com o editor incorporado; nginx deixa `/flow-novo.html?demo=` passar para `index.html`). Topbar: FOP à esquerda + badge `0.1` (sem Open/Export); badge `prototype` = under development; sob o FOP: "Everything flows, except flow" - Heraclitus. Explorer: `+` em `src` cria **arquivo** (`newFile.ts` + `main`); `+` no arquivo cria **função** (`newFunction`). Nomes de função: lowerCamelCase; no fluxo, dado e função não compartilham nome; abstratas únicas na criação (rename funde referência). Terminal inferior (só Terminal, sem aba TypeScript; default minimizado; ícone terminal no toggle). Persistência automática no `localStorage`. Legenda no footer do site. For = teal (`--fc-loop`), try = esmeralda (`--fc-ok`). Rodapé: legenda + FOP · MIT License (`/LICENSE`) · contact@flow-oriented-programming.com. No mobile (≤980px) o rodapé empilha em duas faixas — legenda em cima; FOP · MIT · contato embaixo (desktop permanece lado a lado).

**Antes → depois (`?fit=w` / conceitos):** `fit` com teto 100% + `figure`/`wrap` com `max-width` → amplia até a largura do iframe (teto 2.5×) e `fop-conceitos.html` usa a coluna inteira. Rollback: `Math.min(1, …)` em `novo/app.ts` + `max-width:1200px`/`920px` no CSS da página.

**Antes → depois (padding do plano):** SVG do plano colava o último estado na borda → `PLAN_PAD_BOTTOM` (28) em `planHeight`. Rollback: tirar o termo em `novo/view.ts`.

**Antes → depois (losango sN):** chips tinham losango → sem losango; `vg` encosta nos quadros; `bot=rowY+32` (folga sob o conteúdo), base `planHeight` `+66`. Rollback: path `.dia` / `bot=rowY+18` / base `+52`.

**Antes → depois (faixa 1ª ordem / leaf):** `bande co` ignorava raiz e folhas → raiz cobre filhos; cada leaf ganha traço na própria linha; `planGutter = (maxDepth+1)×IND` e `x = depth×IND`. Rollback: só composição `!leaf && depth>0`; `x = (depth-1)×IND`; gutter `maxDepth×IND`.

**Antes → depois (cor do traço):** `bande.co` usava `--ink` → agora `--fn` (azul da função); if/else=`--wrn`, for=`--loop`, try=`--okc`, catch=`--fail` (iguais às pills). Rollback: `.bande.co{stroke:color-mix(…var(--ink)…)}`.

**Antes → depois (clique no rótulo do dado):** `text.dn` disparava `renameData`/`renameOut` (inline) → agora `editData` (mesmo modal da marca). Rollback: `data-act=renameData|renameOut` no rótulo.

**Antes → depois (nome = ref):** renomear entrada para nome já usado fazia `renameDatumInFlow` (mudava todos) → agora rebind local + limpa valor; saída pode igualar entrada. Rollback: sempre `renameDatumInFlow` em `renameIo`/`setData`/`renameData`.

**Antes → depois (modal out = in):** saída tinha só nome + Add child top-level → mesmo `dataEditor` da entrada (tipo/valor/objeto); objeto na out vira `outs` = campos. Rollback: `withValue = side === "in"`.

**Antes → depois (reset / storage):** botão reset no Explorer (`src`) → canto direito do **header** (`#resetStorage`); apaga `flow-novo-projeto-v1`, `flow-novo-ui-v2`, `flow-novo-explorer-v1` e recarrega. Rollback: devolver `data-exreset` no `ex-sec-h` e tirar o botão do topbar.

**Antes → depois (nome = referência / init):** entrada com literal (`text = "…"`) não contava como produção → quem usava o mesmo nome ficava vazado e nos estados como “de fora”. Agora init entra em `produced`/`made`/`dataLinks`. Rollback: só `outs` nesses conjuntos.

**Antes → depois (I/O padrão):** abstrata sem I/O mostrava cubo `input_`/`output_` inventado → volta ao fantasma `+` (`addIo`); estados só com dado declarado. Rollback: `showIn/Out = length || !lib` + ramo de cubo vazio em `statesByStep`.

**Antes → depois (saída = uma):** fantasma de out criava o nome na hora; agora abre o editor como a entrada (um dado, ou Add child → objeto). Rollback: `addIo` out com `setData` imediato.

**Antes → depois (nomes / explorer):** `+` em `src` criava `newFlow` (função/arquivo ambíguo); títulos livres (“New flow”, espaços). Agora: `src`+ = arquivo; arquivo+ = função lowerCamelCase; unicidade de abstratas na criação; dado≠função no mesmo fluxo; rename de abstrata funde referência. Rollback: handlers `newFlow`/`rename`/`addChild` e o clique `data-exnew`/`data-exadd` no commit anterior.

**Antes → depois (footer mobile):** rodapé uma faixa (legenda + MIT/contato lado a lado, wrap) → ≤980px duas faixas (legenda / meta com borda). Desktop inalterado. Rollback: tirar as 3 regras `.site-foot*` do `@media (max-width:980px)` em `example/flow-novo.html`.

**Antes → depois (apex 2026-11-20):** apex/`www` caíam no default nginx (HTTP 200 ConnectMax; HTTPS 500 sem SNI) → `server_name` + `certbot --expand` com `flow-oriented-programming.com` + `www` no mesmo site `/opt/fop`. Rollback: tirar os hostnames do `server_name`/cert; A `@` de volta ao parking Hostinger se necessário; `nginx -t && systemctl reload nginx`.

**Antes → depois (UI):** Open/Export na topbar + abas TypeScript/Terminal → só Terminal; projeto grava sozinho no navegador. Rollback: restaurar `proj` Open/Export + tabs em `novo/app.ts`.

**Antes → depois (source objeto):** só libs/arquivos no Source → se o contexto tem um objeto tipado (ex. `Response` do `fetch`), dá para escolher o método (`json`/`text`/…) como source (`obj:<dado>#método`). Rollback: tirar `objectSources`/`objAgent` e o ramo `obj:` em view/codegen/app.

**Dev:** só com `?dev=true` (ou `1`) o markup das abas TypeScript entra no DOM. Sem o param = só Terminal (ícone + clique sobe/desce). Rollback: voltar a renderizar tabs/`#p-ts` sempre em `novo/app.ts`.

**Collapse de blocos:** if/for/try (e catch/else) têm chevron na coluna esquerda, igual às funções compostas; `closed` no layout esconde os filhos. Rollback: tirar `lead`/`closed` de blocos em `layout.ts`/`view.ts`.

**Explorer sem Sources:** removido o ícone/users de cadastrar libs no cabeçalho. Libs padrão seguem em `DEFAULT_AGENTS`. Rollback: restaurar `#agents` + `agentsDialog` em `novo/app.ts`.

**Arquivos no Explorer:** `+` e lixeira sempre visíveis (não só no hover), no mesmo espírito do `src`. Rollback: CSS `.ex-file .ex-tools` de volta a `display:none` + hover.

**Antes → depois:** `/` redirecionava para `/flow-novo.html?tema=eternos-black` → `/` serve `index.html` e `/flow-novo.html` vira 301 `/`. Sample `main`+`example` → só `main`. Sem PWA/headers → metas app + manifest + SW + headers de segurança no nginx. Alça do bloco lia `clientY`/`countForRow` (não crescia ao arrastar pra direita) → de novo `countForStep` no eixo X + guia vertical. Aninhamento fundo engolia o plano (tableWidth curta) → `tableWidth` sobe com `maxDepth` + chrome real; `.gtable` com `overflow:hidden`. Diagrama: `bandl` com largura `IND` + wash suave (estilo trilho) e `planGutter`; tabela segue só `padding-left` (sem trilhos HTML). Seleção da barra (`.fn.sel` / `.sum.sel`) usava `stroke: var(--ink)` → borda branca no `eternos-black`; agora stroke = cor da função (`--f-conc-s` / `--fn`). Função azul; for branco no `eternos-black` (`--fc-loop: #f2f2f2`, preto no `eternos` claro). Pill do for: `↻` ia dentro da etiqueta (desalinhava do if) → ícone `.flp` na linha + pill em `colX+11` como o if. Highlight do código: `esc` antes do regex quebrava `&lt;`/`&gt;` (coloria `lt`/`gt`) → tokeniza o texto cru e só então escapa.  
**Rollback PWA:** remover `manifest.webmanifest` / `sw.js` / ícones do `example/`, tirar metas e registro SW do `flow-novo.html`, voltar `nginx-fop.conf` sem `add_header`/locations PWA, republicar.  
**Rollback alça:** em `novo/app.ts` voltar o handler `pointerdown` da alça para `countForRow` + `guide h` (commit anterior à correção). Mobile: alça com `setPointerCapture` + `planGutter` no eixo X + hit 28×32 sempre visível em `(hover:none)`.  
**Rollback largura:** restaurar `tableWidth` com `138 + need` e tirar `overflow:hidden` do `.gtable`.  
**Rollback lixeira de bloco:** em `toolsFor` voltar a ação `unwrap` no trash dos blocos (devolve filhos em vez de apagar a subárvore).  
**Rollback trilhos do plano:** voltar `bandl` como `<line stroke-width=2>` sem `planGutter` / rect `width=IND`.

> Pedido: **só FOP** em `fop.lesgermano.com`. `lesgermano.com` não está na conta Hostinger Germano. Publicado em `fop.laerciogermano.com`. nginx também lista `fop.lesgermano.com` se o domínio for registrado depois.

### Wildcard DNS

Na zona `laerciogermano.com` há **A `*` → `185.250.37.82`**. Novos subdomínios resolvem sem novo registro no hPanel. Ainda precisa no Contabo: pasta + nginx `server_name` + `certbot -d <sub>.laerciogermano.com`. Apex `@` continua no parking Hostinger (`2.57.91.91`).

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

Local (preview): `python3 -m http.server 8787 --directory example` → http://127.0.0.1:8787/flow-novo.html?tema=eternos-black

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `fop`; DNS `flow-oriented-programming.com` → A `@` de volta ao parking (ou excluir)
2. Contabo: `rm /etc/nginx/sites-enabled/fop /etc/nginx/sites-available/fop; rm -rf /opt/fop; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name fop.laerciogermano.com`

## Antes → depois

Sem site FOP → `example/` (flow-novo) em `/opt/fop` + A `fop` + apex/`www`. `flow-ide.laerciogermano.com` permanece (protótipo Flow.dev).
