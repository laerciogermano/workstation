# Deploy — fop.laerciogermano.com

**URL:** https://fop.laerciogermano.com/ (URL limpa — sem `flow-novo.html` nem `?tema=`)  
**Host:** Contabo `185.250.37.82` · root `/opt/fop` · nginx site `fop` · `index.html` (= editor)  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `fop` → `185.250.37.82` (também coberto pelo wildcard `*` → `185.250.37.82`)  
**Tema:** default `eternos-black` no host FOP (localStorage / bolinhas; sem query na URL)  
**App / PWA:** metas mobile (viewport-fit, apple-web-app, theme-color) + `manifest.webmanifest` + `sw.js` (instalável / “Adicionar à Tela de Início”). Nginx: HSTS, `nosniff`, Referrer-Policy, Permissions-Policy; `index.html`/`sw.js`/`manifest` com `Cache-Control: no-cache` (mesmo espírito notinhas/rolego).  
**Conteúdo:** [`../example/`](../example/) · marca: logo no header + **Flow** (regra [`.cursor/rules/fop-flow-language.mdc`](../../../.cursor/rules/fop-flow-language.mdc))  
**Projeto padrão:** só o fluxo `main` (raiz vazia). Os samples (11 funções de front) ficam em `fop-samples.json` (abrir com Open) e na documentação. **Docs:** `/fop-docs.html`. Topbar: FOP à esquerda + badge `0.1` ao lado do título, Open/Export à direita (também no mobile, sem `position:fixed`); badge `prototype` = under development; sob o FOP: "Everything flows, except flow" - Heraclitus. Rodapé: FOP · MIT License (`/LICENSE`) · contato@laerciogermano.com. O antigo `example` (demo de libs) saiu do sample — fica em `browserDemoProject()` só para testes.

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

1. hPanel → DNS `laerciogermano.com` → excluir A `fop`
2. Contabo: `rm /etc/nginx/sites-enabled/fop /etc/nginx/sites-available/fop; rm -rf /opt/fop; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name fop.laerciogermano.com`

## Antes → depois

Sem site FOP → `example/` (flow-novo) em `/opt/fop` + A `fop`. `flow-ide.laerciogermano.com` permanece (protótipo Flow.dev).
