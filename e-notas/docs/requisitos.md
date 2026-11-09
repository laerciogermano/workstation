# e-notas — Requisitos e regras

**Por quê:** fonte canônica das regras de produto/técnicas pedidas no chat ou na esteira.  
**Importante:** todo requisito novo descrito deve entrar **aqui** no mesmo turno da implementação.  
**No fluxo:** complementar à [visão](../README.md); não substitui BDD. Regra operacional: [`../config/config-ia.md`](../config/config-ia.md) · Cursor: [`.cursor/rules/e-notas-requisitos.mdc`](../../.cursor/rules/e-notas-requisitos.mdc).

App: [`../app/README.md`](../app/README.md).

---

## Como usar este documento

1. Novo requisito / regra descrita → acrescentar seção ou item numerado abaixo (com data).
2. Implementar o comportamento.
3. Se a regra mudar, atualizar o item (não apagar histórico sem marcar *revogado*).

---

## REQ-001 — Front de scan do QR (2026-11-01)

- Existe um front com **uma única tela** que abre a câmera para escanear o QR Code da nota.
- A URL lida do QR é impressa no **console** do browser.
- O front é acessível via **web na rede local** (não só localhost do desktop).
- *Complementado por REQ-030 (foto / imagem além do scan ao vivo).*

## REQ-030 — Scan do QR também por foto (2026-11-03)

- Em `scan.html`, além da câmera ao vivo: ações **Tirar foto** (`capture=environment`) e **Escolher imagem** (galeria / arquivo).
- A imagem é decodificada (Html5Qrcode `scanFile`) e segue o mesmo pipeline (`POST /api/nota`).
- Se não houver QR legível: feedback de erro e o scan ao vivo volta.
- Antes: só câmera contínua. Depois: ao vivo **ou** foto/imagem.
- Rollback: remover `.scan-alt` / inputs de arquivo em `scan.html` + lógica em `app.js`; CSS `.scan-alt` / `.btn-ghost`.

## REQ-002 — HTTPS obrigatório (2026-11-01)

- O app deve ser servido em **HTTPS** (câmera em rede / origem segura).
- Certificado autoassinado é aceitável em lab; o usuário precisa confiar no aviso do browser.

## REQ-003 — Backend recebe URL e processa (2026-11-01)

- O backend recebe a URL escaneada (`POST /api/nota`).
- Imprime a URL (e demais resultados do processamento) no **terminal** do servidor.

## REQ-004 — Extração de itens Fazenda PR (2026-11-01)

- A URL deve ser da consulta pública NFC-e da **Fazenda PR** (`fazenda.pr.gov.br/nfce/qrcode`).
- O backend busca a DANFE no site e **extrai todos os itens** (nome, código, quantidade, unidade, valor unitário, valor total).
- Também extrai dados disponíveis da **empresa** e da **nota** (CNPJ, endereço, chave, número, série, emissão, totais, etc.).

## REQ-005 — Cadastro empresa / nota / itens com histórico (2026-11-01)

- Ao receber URL válida processada:
  1. **Cadastrar a empresa** se ainda não existir (dados do site; chave natural = CNPJ).
  2. **Cadastrar a nota** (chave de acesso; não duplicar a mesma nota).
  3. **Cadastrar cada item** da nota.
- Cada **nova nota** gera **novas tuplas de item** (histórico de preço entre notas distintas).
- *Complementado por REQ-009:* dentro da mesma nota o item não duplica.

## REQ-009 — Item único por nota (2026-11-01)

- Itens **não podem ser duplicados** na mesma nota.
- Chave natural do item: **`(nota_id, codigo)`** — só pode haver **um registro de item por código em cada nota**.
- Constraint UNIQUE no Postgres; insert com `ON CONFLICT DO NOTHING`; dedupe na ingestão.
- O mesmo código em **notas diferentes** continua permitido (histórico).

## REQ-006 — Persistência Postgres Contabo (2026-11-01)

- Usar o **Postgres da Contabo** (credenciais em `credenciais.md` / `.env` do app).
- Schema dedicado: **`enotas`** (tabelas `empresas`, `notas`, `itens`) no banco `connectmax`.
- `.env` não versionado; `.env.example` sem senha.

## REQ-007 — Documento de requisitos sempre atualizado (2026-11-01)

- Existe este documento de requisitos/regras no projeto.
- **Sempre que um requisito ou regra nova for descrita**, ela deve ser **adicionada neste arquivo** no mesmo trabalho.
- A obrigação fica escrita em `config/config-ia.md` e em `.cursor/rules/e-notas-requisitos.mdc`.

## REQ-008 — Página de listagem (2026-11-01)

- Existe uma página web (`/lista.html`) que lista **todas as empresas**, **todas as notas** e **todos os itens** cadastrados.
- Na listagem, **Empresas**, **Notas** e **Itens** ficam em **abas** distintas.
- Ao **clicar numa nota**, abre a aba **Itens** filtrada só com os itens daquela nota (`?nota=` + `#itens`).
- APIs de leitura: `GET /api/empresas`, `GET /api/notas`, `GET /api/itens`.
- Navegação entre a tela de scan (`/`) e a listagem.
- Na listagem de notas, exibir também: **data** (emissão formatada `dd/mm/aaaa às HH:mm`), **qtd. total de itens**, **valor total R$**, **descontos R$** e **outras despesas R$**.
- Notas ordenadas da **mais nova para a mais antiga** (data de emissão; empate por id).
- Na listagem de itens, existe um campo **Pesquisar** (filtro no front por código, nome, empresa e demais colunas).

## REQ-010 — Publicação Contabo (2026-11-01)

- Front + API do e-notas na Contabo **em HTTPS**, **sem substituir** o conect tec:
  - conect tec: `http://144.126.154.90/`
  - e-notas: `https://144.126.154.90/enotas/` e `https://144.126.154.90:4173/`
- HTTP `/enotas/` redireciona para HTTPS. Node `127.0.0.1:4174`; TLS no nginx (`:443` path + `:4173` SSL).
- Alias `/e-notas/` → `/enotas/`.
- Lab local continua HTTPS autoassinado (`USE_HTTP` desligado).

## REQ-011 — Código de barras por empresa / unidade (2026-11-01)

- Na aba **Itens** existe a opção **Códigos de barras** para cadastrar o mapeamento:
  - **empresa** + **código da unidade** (código interno do item na nota) + **código de barras (EAN)**.
- Finalidade: o EAN é o identificador comum entre empresas; cada loja usa códigos de unidade diferentes e a NFC-e / DANFE **não traz** o código de barras — o vínculo é populado **manualmente / em colaboração** (scan ou digitação).
- Copy/visão/PRD **não** devem afirmar que a nota “já traz EAN”.
- Chave natural: **`(empresa_id, codigo_unidade)`** — um EAN por código de unidade em cada empresa; reenvio atualiza o EAN (`UPSERT`).
- Tabela `enotas.codigos_barras`. APIs: `GET` / `POST` `/api/codigos-barras`.
- Na lista de itens: coluna **EAN** (quando já vinculado) e ação **Cadastrar EAN** / **Editar EAN**.
- Ao clicar em cadastrar/editar EAN, abre **modal na mesma tela** (sem mudar de aba): câmera para ler o código + input com botão **Adicionar** (manual).

## REQ-012 — Data da nota na lista de itens (2026-11-01)

- A lista de itens exibe a coluna **Data da nota** (emissão da NFC-e: `notas.emissao` → `nota_emissao` na API).
- Não usar `itens.created_at` (quando a tupla foi inserida) como data visível no front.

## REQ-013 — Mapa de empresas (2026-11-01)

- Na aba **Empresas**, exibir um **mapa com pins** de cada empresa (Leaflet + tiles OpenStreetMap).
- Coordenadas (`lat`/`lng`) gravadas em `enotas.empresas`, preenchidas por geocoding Nominatim a partir do `endereco` (cache; `POST /api/empresas/geocode` dispara pendentes).
- Antes de consultar o Nominatim, normalizar o endereço: remover segmentos vazios e complemento-lixo da DANFE (ex. `, 0,`), senão o pin falha (ex. Stilo Central Atacadista).

## REQ-014 — Capacidades-alvo pós-benchmarking (2026-11-01)

Insumos do card [Benchmarking soluções similares](https://trello.com/c/1fMjqGdR) e do [PRD](prd.md) — capacidades a considerar no notinhas.shop / e-notas (ainda sem implementação obrigatória neste REQ):

- **Comparação de preços** — mesmo produto (EAN) entre estabelecimentos; menor preço com loja e data.
- **Histórico de preços** — evolução do preço por produto e por mercado ao longo do tempo.
- **Montagem apartada** — cesta/lista cotada por mercado e sugestão de divisão entre 2+ estabelecimentos para reduzir o custo total.
- **Pontos / contribuição** — conta acumula pontos; NFC-e + vínculo EAN são as contribuições principais e “pagam” o uso contínuo; opt-in de visibilidade/bonificação na loja (ver [PRD](prd.md) §5.11 · REQ-052).
- **Tela da loja (vitrine e-commerce)** — página do estabelecimento com itens observados (catálogo read-only, sem checkout); **visibilidade pública** do sortimento local, inclusive itens que **não estão na internet**.
- **Busca geo / onde comprar perto** — pesquisar um item e ver lojas físicas próximas (GPS ou região, ex. centro), com distância, preço e data.
- **Ranking de estabelecimentos perto** — listar lojas no raio ordenadas pelas que **menos cobram** ou **mais cobram** (nível de preço agregado da loja a partir das notas; distinto da busca por item).
- **Destaques / concorrência de preços** — observação ou publicação **abaixo** do preço de referência do item → entra no feed de destaques (selo na vitrine / home / perto).
- **Integrações via API para empresas** — API B2B para estabelecimentos/parceiros consultarem ou alimentarem o índice.
- **Centro de distribuição** — cada estabelecimento vira **estoque de vendas online** (CD local) a partir da vitrine/cesta; sem margem de marketplace (ver [PRD](prd.md) §5.9).
- **Minhas notas / gestão de compras** — histórico das notas lidas (fingerprint ou conta): o que / quando / onde; gasto por mês (ver [PRD](prd.md) §5.10 · REQ-051).
- **Minhas listas** — várias listas; cotação sem split (por loja) e com split (mais barato + redução) (ver [PRD](prd.md) §5.3 · REQ-051).
- **Fonte do preço** — observações do índice são NFC-e (balcão). Preços de apps/marketplaces, se exibidos no futuro, devem vir com **rótulo de canal** e não misturar na mesma série histórica sem aviso.
- **Posicionamento vs delivery** — o diferencial “preço de balcão” contrasta com **iFood / 99Food / Rappi / Keeta** (e similares); não usar o mesmo argumento como diferencial vs índices NFC-e peers (insumo: [`../marca/comparacao-precos-apps/`](../marca/comparacao-precos-apps/README.md)).

Curadoria: [`../marca/benchmarking-solucoes/README.md`](../marca/benchmarking-solucoes/README.md).

## REQ-015 — Identidade visual notinhas.shop (2026-11-01)

- Marca pública consumer: **notinhas.shop** (não usar “e-notas” como wordmark na UI).
- Paleta: azul `#0069B4` / `#014380` + verde `#00984B` (referência Nota Paraná / Menor Preço).
- Tipografia: Plus Jakarta Sans; menor preço sempre em verde com loja + data.
- Manual: [`../marca/identidade-visual-notinhas-v1.html`](../marca/identidade-visual-notinhas-v1.html) · tokens [`../identidade-visual.md`](../identidade-visual.md).
- Card: [Criar identidade visual](https://trello.com/c/qUI3Rb9a).

## REQ-016 — Design system notinhas.shop (2026-11-01)

- Tokens de UI herdam `--nt-*` da identidade; espaço 4–32, radius 8/14, controles 40 px.
- Componentes v1: botão, chip, busca/input, card de preço, lista, nav/tabs, tabela, empty/error/loading, scan.
- Menor preço sempre verde + chip; loja + data em toda ocorrência; wordmark **notinhas.shop** na UI.
- Manual: [`../marca/design-system-notinhas-v1.html`](../marca/design-system-notinhas-v1.html) · mapa [`../design-system.md`](../design-system.md).
- Card: [Criar design system](https://trello.com/c/qdH95gZX).
- App (`app/public/`): tema light com tokens `--nt-*`, wordmark notinhas.shop; scan permanece viewport escuro.

## REQ-017 — FAB adicionar nota (2026-11-01)

- Home = listagem (`/`), abas **Produtos** (inicial) / **Estabelecimentos**. Abas **Itens** e **Notas** removidas da home. FAB **Nota** continua para escanear.
- Botão fixo inferior direito (**FAB**) “Nota” abre `scan.html` (QR).
- `/lista.html` redireciona para `/`. Após scan ok, volta à home.

## REQ-018 — Vitrine das lojas (2026-11-01)

- Aba **Estabelecimentos**: mapa + cards de mercado; clique abre detalhe + catálogo (preço mais recente por produto).
- Detalhe da loja: **vitrine em grade** (mesmo card da aba Produtos / ref. iFood: foto + nome + preço + data; chip **menor** se o preço da loja for o menor global); clique → detalhe do produto (REQ-028).
- Aba **Produtos** (separada, inicial): título **Menores preços**; grade com foto + preço + chip menor + loja/data; clique → detalhe do produto (REQ-028).
- URL loja: `?loja=<id>` / `#loja-<id>`. UI enxuta (sem textos explicativos redundantes).
- Ao **entrar** no estabelecimento (card, timeline do produto, popup ou deep-link), o mapa **foca no pin** daquela loja (zoom + popup). Ao voltar à lista, restaura o enquadramento de todos os pins.
- Antes: catálogo da loja em tabela (EAN/cód./preço/data). Depois: grade de cards; Itens/Notas fora da home.

## REQ-019 — Viewport app-like (sem PWA) (2026-11-01)

- Meta viewport: `maximum-scale=1, user-scalable=no, viewport-fit=cover` (sem pinch-zoom).
- Sensação de app: `theme-color`, `apple-mobile-web-app-*`, `overscroll-behavior: none`, `touch-action: manipulation`, safe-area — **sem** manifest/service worker (não é PWA instalável).

## REQ-020 — Preview ao compartilhar (WhatsApp / OG) (2026-11-01)

- Metas Open Graph + Twitter Card nas páginas (`og:title`, `og:description`, `og:image` absoluto HTTPS, `og:url`, dimensões 1200×630).
- Imagem: `public/og-image.png` (WhatsApp / Facebook / similares leem OG, não JS).
- URL canônica de produção: `https://144.126.154.90/enotas/`.

## REQ-021 — Código do produto na lista de itens (2026-11-01)

- Na aba **Itens → Lista**, exibir a coluna **Cód.** com o código interno do produto na nota (`itens.codigo`), além do EAN quando houver.
- Antes: colunas Data / Estabelecimento / EAN / Nome / Preço / ação. Depois: inclui **Cód.** entre EAN e Nome.
- Reverter: remover a coluna no `index.html` / `lista.js` (commit anterior).

## REQ-022 — Domínio notinhas.shop → Contabo (2026-11-01)

- Domínio **notinhas.shop** (Hostinger) aponta para a Contabo (registro A `@`; `www` via CNAME ou A).
- **Atual (2026-11-08):** A `@` / `www` / `mail` → **`185.250.37.82`** (VDS `vmi3645369`). Legado `144.126.154.90` offline.
- Site (**atual 2026-11-09**): Beta em `/opt/notinhas-beta` (nginx `:443`); lab em `/enotas/` → `enotas.service` `:4175`. Protótipo v2 permanece em `/opt/notinhas-v2` só para rollback.
- nginx site `notinhas`: `/` → Beta dist; `/api/` → `127.0.0.1:4174`; `/enotas/` → `127.0.0.1:4175` (REQ-061).
- HTTPS: Certbot LE `notinhas.shop` + `www` (emitido 2026-11-08; renew `certbot.timer`) — ver [`../deploy/README.md`](../deploy/README.md).
- Rollback: ver REQ-061 / [`../notinhas-beta/deploy/README.md`](../notinhas-beta/deploy/README.md); DNS A `@` → parking Hostinger `2.57.91.91`; `certbot delete --cert-name notinhas.shop`.

## REQ-023 — Marca v2 DESIGN.md notinhas.shop (2026-11-01)

- Wordmark/domínio público: **notinhas.shop** (antes: notinhas.org).
- Documento canônico para agentes: [`../marca/notinhas.shop.DESIGN.md`](../marca/notinhas.shop.DESIGN.md) (formato Google Labs DESIGN.md).
- Print: [`../marca/marca-notinhas-shop-v2.html`](../marca/marca-notinhas-shop-v2.html).
- Craft de referência: [`../../core/shadcn-design/README.md`](../../core/shadcn-design/README.md) — regras Stripe/Linear/Vercel; paleta própria azul+verde.
- Rollback: remover os dois arquivos v2; UI/tokens hex da v1 permanecem.

## REQ-024 — App wordmark notinhas.shop (local + Contabo) (2026-11-01)

- UI do app (`app/public/index.html`, `scan.html`, `lista.html`) e OG (`og-image.png`) usam **notinhas.shop** (não `notinhas.org`).
- Contabo `/opt/e-notas/public/` espelha esses arquivos (mesmo Node `:4174` / `/enotas/` / site `notinhas`).
- Antes → depois: título/wordmark/OG `.org` → `.shop`.
- Rollback: restaurar HTML + `og-image.png` do commit anterior; no remoto, `scp` dos arquivos antigos para `/opt/e-notas/public/`.

## REQ-025 — Apresentação no front (`/apresentacao.html`) (2026-11-01)

- Página scrollável no app com o mesmo conteúdo do deck [`../marca/apresentacao-notinhas-v1.html`](../marca/apresentacao-notinhas-v1.html) (o quê / como / mercado / marca).
- Link **Apresentação** no rodapé da home (`index.html`), visível ao rolar até o fim.
- Antes: só HTML print em `marca/`. Depois: também `app/public/apresentacao.html` + CSS em `styles.css`.
- Rollback: remover `apresentacao.html`, link do rodapé e blocos CSS; no remoto apagar o arquivo em `/opt/e-notas/public/`.

## REQ-028 — Visual futurista / canvas escuro (2026-11-01) — *revogado*

- Tentativa de tema escuro futurista rejeitada; **voltar ao light** (tokens `#F5F7FA` / azul `#0069B4` / verde `#00984B`).
- Estado atual: `styles.css` = visual light anterior ao dark (commit pré-`cb9b0d4`).

## REQ-027 — Header gradiente + logo → apresentação (2026-11-01)

- Header do app (`index.html`, `scan.html`) no mesmo estilo do hero da apresentação (gradiente azul→verde, wordmark branco + `.shop` menta).
- Clique na logo (`notinhas.shop`) abre `/apresentacao.html`.
- Botão **O que somos** no banner (`.app-header-cta`) abre `/apresentacao.html`.
- Rodapé: link **Quem somos** + e-mail `contato@notinhas.shop` (`mailto:`).
- Antes: wordmark azul/verde no topo do `main`. Depois: `<header class="app-header">` full-bleed + CTA + rodapé com contato.
- Rollback: restaurar brand dentro do `main` apontando para `./`.

## REQ-029 — Label do CTA do header: O que somos (2026-11-01)

- Texto do botão `.app-header-cta` em `index.html` e `scan.html`: **O que somos** (antes: Quem somos).
- Destino inalterado: `/apresentacao.html`.
- Rollback: voltar o label para **Quem somos**.

## REQ-026 — Loja = centro de distribuição (2026-11-01)

- Posicionamento: o app trata **cada estabelecimento como centro de distribuição** (estoque de vendas online), não como “delivery/Full futuro” nem “depósito de vendas”.
- Atualizar PRD §1/§3/§4/§5.9, apresentação (`marca/` + `app/public/apresentacao.html`) e matriz (coluna **CD** = Alvo).
- Antes: Delivery/Full *future* / depósito. Depois: CD presente no pacote da proposta.
- Rollback: restaurar §5.9 *future* e cards “Delivery / Full” nos decks.

## REQ-026 — Foto do produto por EAN (2026-11-01)

- Coluna `enotas.codigos_barras.foto_url` (URL relativa, ex. `ean-fotos/789….jpg`).
- Arquivos em `public/ean-fotos/`; no boot (`initDb`) e no upsert de EAN, sincroniza `foto_url` se o arquivo existir.
- APIs `GET /api/itens` e `GET /api/codigos-barras` devolvem `foto_url`.
- Front (Notas detalhe, Itens, EAN, vitrine): coluna com thumbnail do produto.
- Clique na **foto** no **detalhe do produto** abre **lightbox** ampliado; no feed (cards Produtos / vitrine) o clique na foto só abre o detalhe.
- Antes: só EAN textual / thumb sem ampliar. Depois: foto vinculada ao EAN + visualização no detalhe.
- Rollback: `ALTER TABLE enotas.codigos_barras DROP COLUMN foto_url;` + remover thumbs/lightbox no front / pasta `ean-fotos/`.

## REQ-028 — Detalhe do produto + timeline de preços (2026-11-01)

- Clique no card (aba **Produtos**) abre **detalhe**: foto, nome, infos (EAN, cód., qtd. de preços/mercados) e **menor preço** destacado.
- Abaixo: **timeline** com todas as observações de preço daquele produto (EAN ou nome), da mais recente à mais antiga — data, preço, mercado, nota.
- Menor preço marcado em verde (chip + ponto da timeline).
- Clique em um item da timeline abre o estabelecimento daquela observação.
- URL: `?produto=<key>` / `#produto-<key>` (`ean:…` ou `nome:…`). Voltar → lista da aba Produtos.
- Antes: clique no produto ia para a loja do menor preço. Depois: detalhe + histórico.
- Rollback: restaurar `data-open-loja` nos cards e remover `#produto-detalhe` / handlers.

## REQ-025 — Tela Notas → itens + EAN (2026-11-01)

- ~~Aba **Notas**~~ removida da home (2026-11-01): UI de cards/detalhe/`?nota=` não fica mais exposta.
- Antes: aba Notas com detalhe + **+ EAN**. Depois: home só Produtos + Estabelecimentos; ingestão de nota continua via FAB/`scan.html`.
- Rollback: restaurar `panel-notas` / `tab-notas` e handlers em `lista.js` (commits anteriores à remoção).

## REQ-031 — EAN na vitrine do estabelecimento (2026-11-03)

- Na vitrine da loja (Estabelecimentos → detalhe), cada produto com **código de unidade** tem botão **Código de barras** / **Editar EAN**.
- Abre o modal `#modal-ean` já usado no vínculo `empresa_id` + `codigo_unidade` → EAN (`POST /api/codigos-barras`).
- No modal: **câmera ao vivo** + **Tirar foto** + **Escolher imagem** + **digitação** do número + Salvar.
- Foto/imagem: Html5Qrcode `scanFile`; se não houver código legível, feedback e a câmera volta.
- Card: [JllifNBV](https://trello.com/c/JllifNBV).
- Antes: vitrine só abria o detalhe do produto; EAN só por fluxos antigos (itens/nota). Depois: cadastro/vínculo a partir do item da loja.
- Rollback: remover `data-vincular-ean` / `.btn-ean` / `.produto-card-hit` na vitrine; remover `.scan-alt` do modal EAN e `decodeEanFromFile` em `lista.js`.

## REQ-032 — Busca automática de fotos ao cadastrar EAN (2026-11-04)

- Ao **cadastrar/vincular** um código de barras (`POST /api/codigos-barras`), dispara busca **assíncrona** de imagens desse EAN (até ~50 candidatas).
- **Regra:** toda imagem de terceiro é **baixada** para disco e gravada com `path_local` no banco (`ean_imagens` / `desc_imagens` / cache Google). Feed e APIs só servem path estático nosso — nunca hotlink.
- Fontes: Open Food Facts → Open Beauty → Open Products → UPCitemdb; **Google Imagens sempre** (REQ-042 CDP, sem API key) — query `EAN + descricao` quando houver nome do item; **default n=50** (máx 100).
- `POST /api/ean-imagens/buscar` e enrichment `/imagens` aceitam `descricao` opcional (UI do detalhe envia o nome do produto).
- Tabela `enotas.ean_imagens`: EAN, `url_origem`, `fonte`, `path_local`, `ordem`, `selecionada`, `sha1`, `criado_em`. Arquivos em `ean-fotos/{ean}/NN.ext`.
- **Uma** imagem `selecionada` propaga `codigos_barras.foto_url` (todos os vínculos daquele EAN) — feed / vitrine / detalhe.
- Escolha (não voto): auto-seleção na 1ª importação; UI **Fotos** no detalhe do produto (+ **Buscar fotos** / force).
- APIs: `GET /api/ean-imagens`, `POST /api/ean-imagens/buscar`, `POST /api/ean-imagens/:id/selecionar`.
- Idempotente sem `force` → devolve **cache** (`ean_imagens` / `cached:true`). UI: **Buscar fotos** = cache; **Atualizar** = `force`.
- Google Imagens também grava `google_imagens_buscas` + `google_imagens_cache` (URLs/paths); 2ª chamada não reabre CDP.
- Legado `{ean}.jpg` vira candidata `local` se ainda não houver linhas.
- Card: [0fVZ8eBE](https://trello.com/c/0fVZ8eBE).
- Antes: foto só se existir arquivo manual em `ean-fotos/` (REQ-026); Google só se as APIs não enchiam o pool; botão Buscar forçava rebusca. Depois: Google sempre no pool + cache em banco + Buscar idempotente.
- Rollback: `DROP TABLE enotas.ean_imagens;` / `google_imagens_cache` / `google_imagens_buscas` + remover `ean-imagens.js` / rotas / seção Fotos; manter `foto_url` legado.

---

## REQ-033 — Seção Protótipo no app (2026-11-04)

- Aba **Protótipo** na home (`#prototipo`) com card + botão **Abrir protótipo**.
- Página estática `app/public/prototipos.html` (cópia do `beta-docs/prototipos/index.html`) servida no mesmo site.
- Links também no header e no rodapé.
- Contabo: arquivo em `/opt/e-notas/public/prototipos.html` (+ `index.html` / `lista.js` / `styles.css`).
- Antes: protótipo só em `beta-docs/` local. Depois: acessível em notinhas.shop / `/enotas/` no mobile web.
- Rollback: remover aba/painel/links; apagar `prototipos.html` do `public/` e do Contabo.

## REQ-034 — UX protótipo: anônimo, destaques, detalhe expandido (2026-11-04)

Card: [BXKZ55Wb](https://trello.com/c/BXKZ55Wb).

- Entrada na **home sem login**; busca, listagem, detalhe e depósito de nota funcionam anônimo.
- Conta só para recursos autenticados (ex.: avaliação).
- **Destaques** = preço bem abaixo da média/mediana do produto; home com busca + filtros/categorias.
- **Localização**: banner opcional (“ative a localização”); não bloquear o app na entrada.
- **Detalhe do produto**: comparação, histórico e “perto” já visíveis (sem accordion).
- **Vincular EAN**: câmera aberta de cara; clique só para foto/galeria ou digitar.
- **Várias cestas** (não uma única).
- Fonte canônica do protótipo: `beta-docs/prototipos/index.html` → copiar para `app/public/prototipos.html` e Contabo.
- Rollback: restaurar HTML anterior do protótipo + `scp` para Contabo.

## REQ-036 — Onboarding sem conta (2026-11-04)

- No protótipo, o onboarding **não** inclui criar conta, entrar nem recuperar senha.
- ~~Splash (`T-01`): só CTA **Explorar preços** → home anônima.~~ *Superseded por REQ-038 (sem splash).*
- Telas de conta (`T-02`/`T-03`/`T-04`) só pelo **Perfil**; fora da galeria de entrada.
- Antes: splash com Criar conta / Já tenho conta e galeria “Conta e onboarding”. Depois: entrada anônima.
- Rollback: restaurar botões no splash e fluxo de conta na galeria.

## REQ-038 — Protótipo sem splash (2026-11-04)

- Sem tela Splash (`T-01`) no protótipo; entrada = **home anônima** (`T-10`).
- Botão “Splash” removido da galeria; CSS/template `T-01` removidos.
- Fonte: `beta-docs/prototipos/index.html` → `app/public/prototipos.html` + Contabo.
- Antes: `T-01` com CTA Explorar → home. Depois: abre direto em `T-10`.
- Rollback: restaurar template/CSS `T-01` e botão da galeria; `scp` Contabo.

## REQ-037 — Galeria: E01 descoberta, E02 contribuição, sem backoffice (2026-11-04)

- Ordem dos épicos na galeria do protótipo: **E01** Descoberta de preços · **E02** Contribuir nota e EAN · **E03** Estabelecimentos · **E04** Cestas e gastos.
- **Sem backoffice** na galeria neste momento (`T-61` / ADM fora dos `FLOWS`).
- RoleGo não alterado neste REQ.
- Antes: E01 conta/contribuição misturados, descoberta como E02, ADM na galeria. Depois: numeração acima, sem ADM.
- Rollback: restaurar `FLOWS` anteriores em `prototipos/index.html` (+ cópia `app/public` / Contabo).

## REQ-035 — Estabelecimentos: entrada nas mais baratas (2026-11-04)

- No protótipo, fluxo E03 chama-se **Estabelecimentos** (antes “Geo, ranking e vitrine”).
- Tela inicial do fluxo / aba **Lojas** = **Mais baratas** (`T-31`), não “Perto de mim” (`T-30`).
- `T-31`: busca de estabelecimento + chips de raio; lista ordenada das mais baratas no raio.
- Sem tabs “Mais baratas / Mais caras”: cada linha mostra **Nª mais barata** e **Mª mais cara da região** (+ desvio e distância).
- `T-30` permanece para **perto por item** (detalhe / busca de produto no raio).
- Fonte: `beta-docs/prototipos/index.html` → `app/public/prototipos.html` + Contabo.
- Antes: entrada em Perto (T-30) + toggle baratas/caras no ranking. Depois: entrada em Mais baratas com ranking duplo na lista.
- Rollback: restaurar HTML/docs anteriores do fluxo E03.

## REQ-039 — Identificar EAN a partir da descrição (2026-11-07)

- Dada a **descrição** textual do produto (nota / busca), o sistema deve **identificar o código de barras** (EAN/GTIN) correspondente.
- Card workstation: `e-notas-t-desc-ean`.
- Implementação: `GET|POST /api/enrichment/ean` (`?descricao=` ou body `{ descricao }`, `force?`) → candidatos `{ ean, score, fonte, nome_canonico, image_url }` (sem auto-vínculo).
- Normalização: abreviações NFC-e (`ABS`→`ABSORVENTE`, etc.).
- Fontes: cache `ean_sugestoes` → local → Open*Facts → **ean-serp** (SI5 + SERP; REQ-044). Google Imagens não sugere EAN.
- `ean_resolve_buscas` evita re-scrape OFF; ean-serp roda se ainda não há fonte SI5/SERP no cache (ou `force`).
- UI chama `GET|POST /api/enrichment/ean?descricao=…` (vitrine / detalhe sem EAN / modal).
- UI: vitrine + **detalhe do produto** + modal EAN; toque vincula (`origem=sugestao`).
- Antes: só scan/digitação. Depois: sugestão pelo descritivo + confirmação humana.
- Rollback: `EAN_SERP_URL=` vazio + remover `fromEanSerp`; ou remover rotas/`enrichment.js`/UI + `DROP TABLE enotas.ean_sugestoes;` / `ean_resolve_buscas`.

## REQ-040 — Identificar imagens a partir do EAN (2026-11-07)

- Dado um **código de barras**, o sistema deve **identificar/buscar as imagens** do produto.
- Relacionado a REQ-032 (busca ao cadastrar EAN); este REQ cobre a capacidade genérica descrição↔mídia por EAN.
- Card workstation: `e-notas-t-ean-imgs`.
- Implementação: `GET|POST /api/enrichment/imagens` (`?ean=` / body) — wrapper estável sobre `buscarImagensEan` (REQ-032).
- Antes: só `/api/ean-imagens/buscar`. Depois: superfície `enrichment` + legado + GET no browser.

## REQ-041 — Identificar imagens a partir da descrição (2026-11-07)

- Dada a **descrição** do produto, o sistema deve **identificar/buscar as imagens** correspondentes (sem exigir EAN prévio).
- Card workstation: `e-notas-t-desc-imgs`.
- Implementação: `GET|POST /api/enrichment/imagens-por-descricao` (`?descricao=` / body).
- Se top EAN com score ≥ 0,72 → pipeline EAN→imagens (`modo: ean`); senão URLs textuais OFF em `imagens_texto` sem gravar vínculo (`modo: texto`).
- Antes: imagens só com EAN conhecido. Depois: orquestração descrição→(EAN?)→imagens.

## REQ-043 — Sugestões EAN na vitrine + origem do vínculo (2026-11-07)

- Todo produto **sem EAN** (vitrine + detalhe `#produto-ean-suggest`) mostra sugestões pelo descritivo; toque **vincula** (`origem=sugestao`).
- Modal EAN: ao abrir sem EAN, busca sugestões automaticamente; toque na sugestão vincula com `origem=sugestao`.
- Scan câmera / foto / imagem → vínculo com `origem=barcode_scan`.
- Digitação manual no campo + Salvar → `origem=manual`.
- Coluna `enotas.codigos_barras.origem` (`sugestao` | `barcode_scan` | `manual`); exposta em `GET /api/itens` como `ean_origem`.
- Chip na vitrine: scan / sugestão / manual.
- Antes: sugestão só no modal e sem gravar origem. Depois: sugestões inline/detalhe + origem persistida.
- Rollback: `ALTER TABLE enotas.codigos_barras DROP COLUMN origem;` + remover UI suggest-inline / `#produto-ean-suggest` / campo origem no POST.

## REQ-044 — Serviço ean-serp: EAN via descritivo (SERP + catálogos) (2026-11-07)

- Serviço **à parte** do app (`e-notas/ean-serp`, porta **4180**): dada a **descrição**, sugerir EAN buscando `EAN` + nome na web e em catálogos BR.
- APIs **separadas**: `GET|POST /ean/si5` (JSON) e `GET /ean/si5/stream` (SSE: batch por variante); `GET|POST /ean/google-cdp`; `/ean` legado.
- Enrich das top fichas SI5: `nome_canonico` + `image_url` (no stream só com `enrich=1`).
- Resposta JSON: `{ candidatos: […] }`. SSE: eventos `meta` / `batch` / `done` / `fail`.
- **Integração app:** front sugestões → `/api/enrichment/ean/si5/stream`; JSON em `/api/enrichment/ean/si5`.
- Demo local sem Postgres: `ALLOW_OFFLINE=1` + `USE_HTTP=1` + ean-serp `:4180` → `/demo-ean-suggest.html`.
- Antes: só enrichment in-process sem SERP. Depois: microserviço + consumo no fluxo de sugestão.
- Rollback: parar `:4180`; no app remover `fromEanSerp` / `EAN_SERP_URL`; apagar `e-notas/ean-serp/` se descontinuar.

## REQ-042 — Google Imagens: descrição ou EAN + N (2026-11-07)

- Um serviço: enviar **descrição** ou **EAN** e **N**; ir ao Google Imagens (web) e baixar as N primeiras.
- **Sem API key** — Chrome CDP abre `google.com/search?tbm=isch&q=…`, lê thumbs/URLs e baixa N.
- Pré-req: Chrome com `--remote-debugging-port` (`CDP_URL`, default `http://127.0.0.1:9223`).
- `GET|POST /api/enrichment/google-imagens` — `descricao` **ou** `ean`, `n` (default **50**, máx 100), `download=0` só lista URLs, `force` ignora cache.
- Persistência disco: `public/google-imagens/{slug}/NN.ext`. DB: `google_imagens_buscas` + `google_imagens_cache` (`cached`/`skipped` se já buscou).
- Também fonte do pipeline EAN→fotos (default n=50).
- Antes: Custom Search / fetch HTML (Google bloqueia sem JS); sem cache em banco. Depois: scrape via CDP + cache.
- Rollback: remover rota/módulo `google-imagens.js`; tirar fallback em `ean-imagens.js`; `DROP TABLE` cache/buscas; apagar `public/google-imagens/`.

## REQ-045 — Listagem de produtos só com código de barras (2026-11-08)

- Na aba **Produtos** (catálogo home), listar **apenas** itens que já tenham `codigo_barras` (EAN) vinculado.
- Itens só com código interno da loja / nome **não** entram no grid de produtos.
- Vitrine do estabelecimento continua mostrando itens sem EAN (vínculo / sugestão — REQ-043).
- Antes: catálogo agrupava também por nome/código sem EAN. Depois: só chave `ean:…`.
- Rollback: remover o filtro `codigo_barras` em `catalogoProdutos()` (`lista.js`).

## REQ-046 — Progresso da loja: notas, itens e EAN (2026-11-08)

- Em cada **card** da lista de estabelecimentos, **popup do mapa** e **cabeçalho/vitrine** da loja: progresso do que já foi concluído vs o que falta.
- Também em **cada nota** (Minhas notas / detalhe / pós-ingestão): progresso dos itens daquela NFC-e com EAN vs faltando.
- Métricas loja: **notas** ingeridas; **itens** distintos; **EAN** vinculados vs pendentes.
- Métricas nota: itens da nota com EAN / sem EAN; CTA vincular pendentes.
- Contagem por SKU interno (`codigo`) da loja: total, com EAN, sem EAN.
- **Verde** = com EAN; **vermelho** = faltam EAN; texto `N com EAN (X%) · M faltam · T itens · N notas`.
- Protótipo: T-22 / T-31 / T-32 / T-33 / T-50 / T-55. PRD §5.4 / §5.10 · RF-E03-17.
- Antes: só chip “N itens” / progresso só de EAN implícito. Depois: barra + notas/itens/faltantes na UI e no PRD.
- Rollback: remover `eanProgressLoja` / `htmlEanProgress` / blocos do protótipo e bullets do PRD.

## REQ-047 — Catálogo canônico `produtos_ean` (2026-11-08)

- Tabela `enotas.produtos_ean` = **fonte da verdade** por EAN: `codigo_barras` (PK), `titulo`, `categorias` (text[]), `foto_url`, `marca`, `fonte`.
- Com EAN vinculado, listagens/detalhe usam **título e foto canônicos** (`COALESCE(produtos_ean.*, …)`), não o texto cru da DANFE (`nome_nota` permanece disponível).
- Ao vincular EAN (`POST /api/codigos-barras`), upsert em `produtos_ean` com `titulo`/`nome_canonico` (sugestão SI5) ou descrição; foto selecionada propaga para a ficha.
- APIs: `GET` / `POST` `/api/produtos-ean` (edição manual da ficha; `forceTitulo` no POST).
- Backfill inicial a partir dos vínculos `codigos_barras` + nome do item.
- Antes: só vínculo empresa/unidade→EAN + `foto_url` em `codigos_barras`. Depois: ficha normalizada reutilizada em todas as lojas do mesmo EAN.
- Rollback: `DROP TABLE enotas.produtos_ean;` + remover JOIN/overlay em `listItens` e rotas `/api/produtos-ean`.

## REQ-048 — Enrich automático da ficha EAN (2026-11-08)

- Dado um **código de barras**, serviço consulta fontes abertas/grátis e atualiza `produtos_ean` com o que for útil: título, marca, descrição, categorias, NCM, CEST, quantidade, nutriscore, foto local, `fontes[]`, `extras` JSON.
- Ordem: **PreçoMelhor** → Open Food/Beauty/Products Facts → UPCitemdb. Foto remota baixada para `ean-fotos/`.
- Se nenhuma fonte externa achar o EAN: **humaniza** o título DANFE (CAPS → Title Case, limpa `#*+`) e infere marca/categoria básica (ex. Monster → Bebidas energéticas).
- APIs: `GET|POST /api/produtos-ean/:ean/enrich` e `/api/enrichment/produto-ean` (`force` ignora cache de 7 dias); `POST /api/produtos-ean/enrich-all` processa todos os EANs vinculados.
- Feed (Produtos), vitrine e detalhe exibem **título/marca/categorias/foto** da ficha canônica (`displayProduto`), não o texto cru da nota.
- Ao vincular EAN (`POST /api/codigos-barras`), dispara enrich em background.
- Módulo: `produto-ean-enrich.js`. Colunas extras: `descricao`, `ncm`, `cest`, `quantidade`, `quantidade_unidade`, `nutriscore`, `fontes`, `extras`, `enriquecido_em`.
- Antes: ficha só com backfill/sugestão local. Depois: enriquecimento multi-fonte sob demanda e no vínculo.
- Rollback: remover rotas/módulo; `ALTER TABLE … DROP COLUMN` das novas colunas (ficha básica REQ-047 permanece).

## REQ-049 — Categorias canônicas de produto (2026-11-08)

- Lista fechada de **~18 categorias nível 1** (afinidade de uso / árvore mercadológica BR) + subcategorias opcionais nível 2.
- Doc canônico: [`categorias-produtos.md`](categorias-produtos.md). Constantes + normalização: `app/categorias-produtos.js`.
- Enrich (`produto-ean-enrich`) mapeia PreçoMelhor/OFF/heurística → nomes canônicos antes de gravar `produtos_ean.categorias`.
- Não usar tags OFF cruas nem NCM/CEST como categoria de UI.
- Antes: categorias livres/heurísticas soltas (“Bebidas energéticas”). Depois: taxonomia única documentada + normalização no enrich.
- Rollback: remover doc/módulo; voltar categorias texto livre no enrich.

## REQ-050 — Identidade anônima por fingerprint (2026-11-08)

- Uso do notinhas **sem login**: a pessoa entra e opera (busca, depósito, cestas etc. no escopo anônimo já previsto em REQ-034 / REQ-036).
- Em **toda operação** que grave dado do visitante, o cliente envia o **fingerprint do navegador** como identificador temporário (contrato único de transporte, ex. header `X-Client-Fingerprint`).
- Em **toda operação** (anônima ou autenticada), o servidor **cadastra o IP público** do cliente (proxy confiável / remoto); não confiar em IP enviado pelo front.
- Fonte de verdade dos dados do visitante é a **base** (associados ao fingerprint / `visitante_id`), não o localStorage.
- Ao **criar conta** (ou login no mesmo browser com dados anônimos pendentes): **vincular** no banco tudo que estava sob aquele fingerprint ao `usuario_id`; daí em diante a posse é da conta.
- Índice público de preços permanece anonimizado; fingerprint e IP não vazam no catálogo.
- Doc canônico: [`identidade-anonima-fingerprint.md`](identidade-anonima-fingerprint.md). Schema detalhado na implementação (beta-docs modelo de dados / auth).
- Antes: anônimo só na UX / eventual localStorage. Depois: id de visitante no server + merge na conta.
- Rollback: remover este REQ e o doc; reverter posse anônima no server.

## REQ-051 — Minhas notas + Minhas listas (várias) com split (2026-11-08)

- Seções de produto: **Minhas notas** (minhas compras) e **Minha(s) lista(s)**.
- **Minhas notas:** toda nota lida/depositada fica no histórico pessoal (fingerprint ou `usuario_id`); listagem + detalhe do cupom.
- **Minhas listas:** várias listas para comparar preços da cesta.
  - **Sem split:** totais por loja, cobertura e comparação entre estabelecimentos.
  - **Com split:** cenário mais barato + **redução** (R$ / %) vs melhor loja única; itens por loja.
- PRD: [`prd.md`](prd.md) §5.3 / §5.10 · Beta: [`../beta-docs/01-prd.md`](../beta-docs/01-prd.md) RF-E04-01..12 · identidade: REQ-050.
- Antes: extrato só logado / cesta única implícita. Depois: histórico e listas multiplas sem login obrigatório + UX split vs sem split.
- Rollback: reverter bullets do PRD e este REQ.

## REQ-052 — Pontos, gamificação e contribuição (NFC-e + EAN) (2026-11-08)

- Conta cadastrada **acumula pontos** por contribuir.
- Contribuições principais: (1) **depositar/ler NFC-e**, (2) **vincular EAN** — o restante o sistema faz.
- Pontos/crédito = **pagamento cooperativo**: uso sustentado de listas, cotação, split e menor preço depende de ter contribuído (quota/saldo); quem não contribui é solicitado a cadastrar notas e códigos de barras.
- Com opt-in: estabelecimento vê compras do cliente na loja + pontos → base para **bonificação**/fidelidade (acordo B2B; não é dinheiro fiduciário).
- PRD: [`prd.md`](prd.md) §5.11 · Beta: [`../beta-docs/01-prd.md`](../beta-docs/01-prd.md) RF-E01-19..21.
- Antes: contribuição só altruísta / sem gate de uso. Depois: economia de contribuição + gamificação loja.
- Rollback: remover §5.11 / RFs / este REQ.

## REQ-053 — Protótipo alinhado ao PRD (listas, notas, pontos) (2026-11-08)

- Galeria [`beta-docs/prototipos/index.html`](../beta-docs/prototipos/index.html) (+ `app/public/prototipos.html`) contempla REQ-050..052: Minhas listas (T-40/42/41), Minhas notas (T-50/55), gastos (T-52), pontos/gate (T-53/54), perfil fingerprint+IP (T-51), merge na criar conta (T-02).
- Tab **Listas**; inventário em [`12-prototipos.md`](../beta-docs/12-prototipos.md).
- Antes: cestas/extrato genéricos. Depois: telas acima na galeria E04.
- Rollback: restaurar HTML anterior do protótipo + inventário.

## Próximos passos

→ Manter este arquivo alinhado a cada pedido novo · esteira de docs em [`README.md`](README.md) quando avançar funcionalidades/BDD.

## REQ-054 — Protótipo v2.0 com estado e rastreio (2026-11-08)

- Novo protótipo em [`beta-docs/prototipos/v2/`](../beta-docs/prototipos/v2/index.html), sem build (HTML + CSS + JS clássico), consolidando app do lab, docs do Beta e protótipo v1.
- Estado único: busca, filtros, listas (stepper/remoção), split, vínculo de EAN, pontos e merge de conta recalculam a partir das observações (RN-10, RN-11, RN-13 aplicadas no cálculo, não desenhadas).
- Cobertura: 40 telas — E01–E04 do v1 + E02 processando/duplicada/falha (T-25/26/27), item de vitrine sem EAN (T-34), excluir conta LGPD (T-56), E06 estados (T-70..73) e ADM desktop (T-61..63).
- Cada tela declara `us` / `rn` / `req`; a página calcula a cobertura (34/34 US, 15/15 RN) e gera a matriz de rastreabilidade. IDs de história seguem `beta-docs/02-historias/`.
- Cenários no painel: visitante/conta, resultado do scan (sucesso, duplicada, SEFAZ lenta, link inválido), câmera negada, offline, sem GPS, crédito esgotado, movimento reduzido.
- Design: tokens `--nt-*` da marca; motion conforme `core/definir-projeto-moderno/03-design-ui-motion` (View Transitions entre telas com elemento compartilhado na foto do produto, spring só em feedback, sheet/toast, skeleton, `prefers-reduced-motion`). Logo V9 no wordmark e favicon.
- Dados: lojas, descrições de DANFE e fotos da base `enotas` (2026-11-08); preços cruzados entre lojas e EANs marcados “exemplo” são conteúdo de protótipo.
- v1 permanece em `beta-docs/prototipos/index.html` e `app/public/prototipos.html`.
- Rollback: remover `beta-docs/prototipos/v2/` e os links em `12-prototipos.md`, `beta-docs/README.md` e `README.md`.

## REQ-055 — Temas de cor para escolha da paleta (2026-11-08)

- Protótipo v2.0 oferece **6 temas** comparáveis: Institucional (DESIGN.md v2, atual), Escuro, Petróleo + lima, Grafite + esmeralda, Feira (laranja + verde) e Papel de nota.
- Todos mantêm a gramática da marca: **uma** cor de ação (`--nt-blue*`), **uma** cor só para menor preço (`--nt-green*`), texto, fundo e hairline; câmera continua escura.
- Tema aplicado por `data-theme` (no `html` ou em qualquer bloco), então a seção “Temas para escolher” renderiza as mesmas telas em cada paleta lado a lado.
- Seletor no topo da página, nos cenários e **ao lado do celular no modo navegável** (atalho `T`, troca com fade); escolha salva no `localStorage` do navegador (só conveniência).
- **Escuro:** fundo sempre preto (`#000`), superfícies em cinza neutro; **azul nunca como fundo** (só ação, texto e ícone); estados ativos em branco/preto.
- Decisão de paleta final fica com produto; até lá o DESIGN.md v2 (Institucional) segue canônico.
- Rollback: remover o bloco “temas” de `styles.css`, a seção `#temas` do `index.html` e o bloco “temas” de `js/app.js`.

## REQ-056 — Home em seções da altura da tela com rolagem horizontal (2026-11-08)

- Home (T-10) é uma sequência vertical de seções, **cada uma com a altura da tela**, encaixando uma por vez ao arrastar para baixo.
- Ordem: **Promoções** (destaques = menores preços / maior queda vs mediana 14 d — RN-11) → **Mais comprados** (frequência nas notas) → **uma seção por categoria** canônica com produtos (REQ-049).
- Dentro de cada seção, cards no tamanho normal de produto em **grade de 2 linhas com rolagem horizontal** (mais cards na tela). Mais comprados carrega mais cards ao chegar no fim da lateral (infinite scroll).
- Cabeçalho fixo (logo, mapa, perfil, busca) + chips das seções: tocar pula para a seção; rolar atualiza o chip ativo.
- Card: foto, % vs mediana, nome, preço menor (verde), loja · data · distância e botão “+” para adicionar à lista. Só produtos com EAN (REQ-045).
- Rollback: restaurar a T-10 anterior (carrossel de destaques + grade de menores preços) em `beta-docs/prototipos/v2/js/screens.js`.

## REQ-057 — Web desktop no mesmo modelo do celular (2026-11-08)

- Protótipo v2.0 ganha a versão **web desktop** (telas `D-xx`, navegador 1440×900) com os mesmos dados, estado, regras (RN), temas e cenários do celular.
- Navegação no topo (Produtos, Lojas, Listas, Notas, busca, pontos/entrar, **Depositar nota**, perfil).
- Home no mesmo modelo de REQ-056: seções da altura da janela (Promoções → Mais comprados → categorias), 2 linhas de cards com rolagem horizontal, chips e setas ‹ ›.
- Layout de desktop onde ajuda: busca com filtros laterais; produto em duas colunas (gráfico de histórico acima da comparação em tabela); lojas = ranking + mapa grande; vitrine com tabela de itens sem EAN; lista + cotação (uma loja / dividir) lado a lado; notas em mestre-detalhe; gastos em painel; perfil em três colunas; entrar/criar conta em abas.
- Depositar nota no desktop: arrastar foto do cupom, colar link do QR ou webcam; mesmo pipeline (processando → recebida → vincular EAN → foto) e avisos (duplicada, SEFAZ lenta, link inválido) numa tela.
- Alternância celular ↔ desktop na mesma tela (botão e tecla `D`).
- Rollback: remover `js/desktop.js`, o `<script>` em `index.html`, o bloco “web desktop” de `styles.css` e os ajustes `web` em `js/app.js`.

## REQ-058 — Mapa na página de produto (2026-11-08)

- Origem: prompt 041.
- T-14 (detalhe do produto): mapa na seção **Perto de você** — um pino por loja com o preço; menor preço em verde; raio conforme o filtro.
- **Atual (2026-11-09):** `MapBanner` em “Perto de você” (abaixo da comparação); toque abre `/produto/:gtin/mapa` (T-30). Abaixo do mapa, as 2 lojas mais próximas.
- Rollback: `MapView` estático sem rota de expansão (commit anterior).

## REQ-059 — Projeto Beta front + back (`notinhas-beta/`) (2026-11-09)

- Origem: prompt 042.
- Implementação nova e separada do lab, em `notinhas-beta/`, seguindo `core/definir-projeto-moderno` (lean C4 + ADR, TypeScript `strict`, Postgres por convenção, UI/motion) e `beta-docs/` (PRD, contratos, regras RN-01..15).
- Todas as telas do protótipo v2 (T-02…T-73, T-61..63) implementadas; desktop pelo mesmo componente com layout responsivo (REQ-057).
- Regras de preço (RN-10, RN-11, RN-13), GTIN e chave NFC-e em funções puras compartilhadas por API e web, com testes.
- Banco: schema próprio `notinhas` (bigint + uuid público, centavos, `timestamptz`), item único por linha da nota, posse da nota fora do índice público (RN-06); importador idempotente da base do lab.
- Identidade: fingerprint guardado só como HMAC + IP do servidor; merge ao criar conta/entrar (REQ-050); JWT 60 min + refresh 30 dias (REQ-071); reuso fora da janela de graça revoga a família.
- Nota com falha na SEFAZ guarda o dono e entra em Minhas notas quando a nova tentativa der certo.
- Fora deste corte: sugestão via `ean-serp`/Google Imagens (REQ-042/044), alertas por e-mail, 4 dos 6 temas (REQ-055).
- Rollback: remover a pasta `notinhas-beta/` e o schema `notinhas` (`DROP SCHEMA notinhas CASCADE` — só com confirmação humana).

## REQ-060 — Seletor de tema por bolinha no app (2026-11-09)

- Origem: prompt 043.
- App `notinhas-beta`: botão em forma de bolinha (metade cor de ação, metade cor de menor preço) abre a lista dos 6 temas do protótipo v2 (REQ-055): Institucional, Escuro, Petróleo + lima, Grafite + esmeralda, Feira, Papel de nota.
- Fica no topo da home (celular), na barra lateral (desktop) e no Perfil.
- Escolha salva no aparelho; **sem escolha, padrão = Petróleo + lima** (`petroleo`) — antes: Grafite + esmeralda (`grafite`); antes disso: sistema (institucional / escuro).
- Troca animada, sem animação com movimento reduzido.
- Rollback: `return 'grafite'` + `data-theme="grafite"` em `lib/theme.ts` / `index.html`.

## REQ-065 — Foto do produto sempre inteira no quadro (2026-11-09)

- Em cards, detalhe e miniaturas (`.ph`), a imagem usa `object-fit: contain` com padding — o produto inteiro aparece (ex.: garrafa Coca alta), sem corte pelas bordas.
- Rollback: `.ph img { width/height: 86%; }` sem padding no container.

## REQ-064 — Teclado ao abrir a busca (2026-11-09)

- Toque em “Buscar” na home abre `/busca` e **já mostra o teclado** (sem segundo toque no campo).
- Busca no bundle inicial; home usa `<input>` (não botão); `navigate('/busca', { flushSync: true })` + `focus()` no mesmo gesto (iOS / React Router 7).
- Antes: `ReactDOM.flushSync` em volta do `navigate` — o RR7 ainda podia adiar o mount e o teclado não abria.
- Rollback: botão + `Link`/`viewTransition` na home; `lazy` da SearchPage.

## REQ-063 — Viewport / PWA app-like no mobile web (2026-11-09)

- Espelhar o RoleGo Beta em `notinhas.shop`: experiência de app no mobile web.
- Viewport: `minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content`.
- Metas: `mobile-web-app-capable`, `apple-mobile-web-app-*` (standalone, status bar `black-translucent`), `format-detection` off, `apple-touch-fullscreen`.
- Gestos JS (`installAppGestures`): bloqueia pinch, double-tap zoom, Ctrl+scroll e Ctrl+/−/0; exceção de pinch no Leaflet.
- CSS: `html`/`body`/`#root` `overflow: hidden` + `overscroll-behavior: none` + `touch-action: manipulation`; scroll no `.shell`; inputs ≥16px; sem seleção “web” fora de campos.
- Manifest PWA: `standalone` + `display_override` + `orientation: portrait-primary`.
- Rollback: commits anteriores de `index.html`, `app-gestures.ts`, `app.css`, `vite.config.ts` (ver [`../notinhas-beta/deploy/README.md`](../notinhas-beta/deploy/README.md)).

## REQ-062 — Mapa no topo: produtos (pins) e estabelecimentos (2026-11-09)

- Home Produtos (`/`): faixa de mapa no topo com **pins de produto** (preço); vários pins no mesmo estabelecimento ficam espalhados; toque abre `/mapa`.
- Mapa cheio `/mapa` (T-15): mesmo critério — pin = produto, não agregado por loja.
- Estabelecimentos (`/lojas`, T-31): faixa de mapa no topo com **1 pin por estabelecimento** (posição no ranking); toque abre `/lojas/mapa`.
- Mapa `/lojas/mapa` (T-32): só estabelecimentos (não pins de produto).
- Vitrine da loja (`/lojas/:id`, T-33): faixa de mapa no topo com **pin do estabelecimento** + **pins de produto** (preço nesta loja, espalhados); toque abre `/lojas/mapa`.
- Detalhe do produto (`/produto/:gtin`, T-14): `MapBanner` **no topo da página, antes da foto** (prompt 047), um pin de preço por loja (menor em verde); **toque expande** para `/produto/:gtin/mapa` (T-30). “Perto de você” mantém as 2 lojas mais próximas.
- O mapa da faixa usa a classe `inbanner` (não `banner`, que é o estilo de aviso e encolhia o mapa).
- Rollback: remover `MapBanner` das páginas e voltar `ProductsMapPage` ao agregado por loja.

## REQ-061 — Publicar Beta em notinhas.shop (Contabo) (2026-11-09)

- Publicar `notinhas-beta/` na Contabo (`185.250.37.82`) e servir em **https://notinhas.shop/** (e `www`).
- Path `/opt/notinhas-beta`; unit `notinhas-api` em `127.0.0.1:4174`; schema Postgres `notinhas`; nginx: `/` → `apps/web/dist`, `/api/` → API.
- Lab permanece em **https://notinhas.shop/enotas/** na porta `:4175` (antes `:4174`).
- Seed demo aplicado na primeira publicação; SMTP pode ficar vazio até a caixa Mailcow estar no mesmo host.
- Docs: [`../notinhas-beta/deploy/README.md`](../notinhas-beta/deploy/README.md) · [`../deploy/README.md`](../deploy/README.md).
- Rollback: restaurar nginx root `/opt/notinhas-v2` + lab `:4174`; `systemctl disable --now notinhas-api` (detalhe no deploy do Beta).


## REQ-066 — Pelo menos 50 sugestões de EAN no vínculo (2026-11-09)

- `GET /codigos-barras/sugestoes` devolve **até 50** candidatos (antes: 8).
- Fonte SI5: `n` até 100 no ean-serp; filtro de score mínimo 0.2 (antes 0.35) para não esvaziar a lista.
- ean-serp `/ean/si5` percorre **páginas** do HTML SI5 (`?page=`) além das variantes — página 1 sozinha ~30 itens.
- Catálogo local: `LIMIT 50` (antes 12).
- Antes → depois: sheet com poucas opções → lista longa rolável (≥50 quando o SI5/catálogo tiver).
- Rollback: `slice(0, 8)` + `byDescription(…, 8)` + cap `n≤24` + score `≥0.35`; em `si5.js` voltar a uma URL sem `page`.

## REQ-070 — Data do histórico = emissão da NFC-e (2026-11-09)

- Preço/histórico/comparação usam `receipts.issued_at` (data da nota), via `v_price_observations.observed_at = coalesce(issued_at, created_at)`.
- UI: histórico do produto mostra **emissão** (`dateTime` em Brasília); gráfico agrupa por dia civil SP (não `slice` UTC).
- Antes: relativo/`dateShort` sem deixar explícito; gráfico podia mudar o dia por fuso UTC.
- Rollback: voltar `observedAt.slice(0,10)` no chart e `dateShort · when` no histórico.

## REQ-069 — Escolher foto: confirmar no topo + imagens quebradas (2026-11-09)

- No sheet de foto (T-24): barra **fixa no topo** com miniatura + **Pular** / **Usar esta** — não precisa rolar a grade para confirmar.
- Imagens que falham no proxy/`onError` saem da grade; se era a selecionada, passa à próxima.
- Proxy: URL até 8k; timeout 12s; tenta Referer Google → Bing → sem Referer.
- Antes: botões só no fim; URLs longas/CDN falhavam em silêncio na grade.
- Rollback: duo no rodapé do sheet; proxy `max 2000` / um único fetch.

## REQ-068 — Vínculo EAN por código interno (propagação) (2026-11-09)

- Chave do vínculo: **`(loja, código interno)` → EAN** (`barcode_links`), nunca por linha de nota.
- Ao vincular/alterar, **todas** as linhas históricas e futuras daquela loja com o mesmo cód. interno herdam o EAN (`v_price_observations` / join — RF-E01-12 / RN-12).
- UI: fila da nota deduplica por cód. interno; toasts e textos deixam a regra explícita.
- Antes → depois: usuário podia achar que vinculava só a linha da nota; copy + fila reforçam a propagação.
- Rollback: reverter copy/toasts/dedupe na web; o schema já era por `(store_id, store_code)`.

## REQ-067 — Alterar código de barras na ficha do produto (2026-11-09)

- Na página do produto (T-14): botão **Alterar código** (mesmo fluxo da nota: câmera / digitar / sugestões com `replace`).
- `GET /produtos/:gtin` inclui `links[]` (`barcode_links` deste EAN: loja, cód. interno, descrição).
- 1 vínculo → abre `LinkEanSheet` direto; vários → sheet para escolher qual corrigir; nenhum → atalho **Trocar foto**.
- Também **Trocar foto** (PhotoPickerSheet) na ficha.
- Após substituir o EAN, navega para a ficha do novo código.
- Antes: Alterar só na nota/vitrine. Depois: também no detalhe do produto.
- Rollback: remover `links` da API/DTO e os botões em `ProductPage.tsx`.

## REQ-071 — Sessão longa + menu mobile (2026-11-09)

- Sessão logada permanece **30 dias** (faixa 15–30): cookie `nt_rt` HttpOnly com `REFRESH_TTL_DAYS=30`, renovado (sliding) a cada refresh bem-sucedido.
- Access JWT em memória: **60 min** (antes 15); boot/visibility sem token tenta refresh pelo cookie.
- Reuso de refresh **nos primeiros 15 s** após rotação = corrida (abas/SW) → 401 sem revogar a família; reuso depois disso continua revogando (roubo).
- Tabbar: FAB “adicionar nota” não pode ficar cortado (`overflow-x` só na row interna + padding-top); itens do menu um pouco menores; rótulos curtos (Nota / Gastos).
- Home: sem ícone de Perfil no topo — Perfil só no menu de baixo (e sidenav).
- Rollback: `ACCESS_TTL_S=15*60`; reuso sempre `REFRESH_REUSED`; tabbar com overflow no container; ícone user de volta no `HomePage`.
