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
- **Tela da loja (vitrine e-commerce)** — página do estabelecimento com itens observados (catálogo read-only, sem checkout); **visibilidade pública** do sortimento local, inclusive itens que **não estão na internet**.
- **Busca geo / onde comprar perto** — pesquisar um item e ver lojas físicas próximas (GPS ou região, ex. centro), com distância, preço e data.
- **Ranking de estabelecimentos perto** — listar lojas no raio ordenadas pelas que **menos cobram** ou **mais cobram** (nível de preço agregado da loja a partir das notas; distinto da busca por item).
- **Destaques / concorrência de preços** — observação ou publicação **abaixo** do preço de referência do item → entra no feed de destaques (selo na vitrine / home / perto).
- **Integrações via API para empresas** — API B2B para estabelecimentos/parceiros consultarem ou alimentarem o índice.
- **Centro de distribuição** — cada estabelecimento vira **estoque de vendas online** (CD local) a partir da vitrine/cesta; sem margem de marketplace (ver [PRD](prd.md) §5.9).
- **Gestão de compras e análise financeira** — extrato das notas do usuário: o que / quando / onde comprou; gasto por mês; rankings e tendência (ver [PRD](prd.md) §5.10).
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

- Domínio **notinhas.shop** (Hostinger) aponta para a Contabo `144.126.154.90` (registro A `@`; `www` via CNAME).
- nginx site `notinhas` faz proxy de `/` para o app Node `127.0.0.1:4174` (mesmo processo de `/enotas/`).
- HTTPS no domínio via Certbot quando o DNS público propagar (ver [`../deploy/README.md`](../deploy/README.md)).
- Rollback: desabilitar site `notinhas`; DNS A `@` → parking Hostinger `2.57.91.91`.

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

- Ao **cadastrar/vincular** um código de barras (`POST /api/codigos-barras`), dispara busca **assíncrona** de imagens desse EAN (até ~5 candidatas).
- Fontes: Open Food Facts → Open Beauty → Open Products → UPCitemdb; **Google Imagens** via scraping (REQ-042, sem API key).
- Tabela `enotas.ean_imagens`: EAN, `url_origem`, `fonte`, `path_local`, `ordem`, `selecionada`, `sha1`, `criado_em`. Arquivos em `ean-fotos/{ean}/NN.ext`.
- **Uma** imagem `selecionada` propaga `codigos_barras.foto_url` (todos os vínculos daquele EAN) — feed / vitrine / detalhe.
- Escolha (não voto): auto-seleção na 1ª importação; UI **Fotos** no detalhe do produto (+ **Buscar fotos** / force).
- APIs: `GET /api/ean-imagens`, `POST /api/ean-imagens/buscar`, `POST /api/ean-imagens/:id/selecionar`.
- Idempotente sem `force`; legado `{ean}.jpg` vira candidata `local` se ainda não houver linhas.
- Card: [0fVZ8eBE](https://trello.com/c/0fVZ8eBE).
- Antes: foto só se existir arquivo manual em `ean-fotos/` (REQ-026). Depois: busca automática de candidatas + seleção da do feed.
- Rollback: `DROP TABLE enotas.ean_imagens;` + remover `ean-imagens.js` / rotas / seção Fotos no detalhe; manter `foto_url` legado.

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
- Implementação: `GET|POST /api/enrichment/ean` (`?descricao=` ou body `{ descricao }`) → candidatos ranqueados `{ ean, score, fonte, nome_canonico, image_url }` (sem auto-vínculo).
- `image_url`: foto local (`ean-fotos` / `ean_imagens`) ou Open Food Facts por EAN quando faltar.
- Fontes: cache `ean_sugestoes` → pares locais `itens.nome`+`codigos_barras` → Open Food/Beauty/Products Facts (search).
- UI: modal EAN → **Sugerir EAN pela descrição** → toque preenche o campo; **Salvar** confirma (`descricao` no POST de vínculo incrementa `confirmacoes`).
- Antes: só scan/digitação. Depois: sugestão + confirmação humana.
- Rollback: remover rotas `/api/enrichment/*`, `enrichment.js`, UI suggest, `DROP TABLE enotas.ean_sugestoes;`.

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

- Todo produto **sem EAN** na vitrine do estabelecimento mostra sugestões (enrichment/ean) com foto quando houver; toque **vincula** na hora (`origem=sugestao`).
- Modal EAN: ao abrir sem EAN, busca sugestões automaticamente; toque na sugestão vincula com `origem=sugestao`.
- Scan câmera / foto / imagem → vínculo com `origem=barcode_scan`.
- Digitação manual no campo + Salvar → `origem=manual`.
- Coluna `enotas.codigos_barras.origem` (`sugestao` | `barcode_scan` | `manual`); exposta em `GET /api/itens` como `ean_origem`.
- Chip na vitrine: scan / sugestão / manual.
- Antes: sugestão só no modal e sem gravar origem. Depois: sugestões inline + origem persistida.
- Rollback: `ALTER TABLE enotas.codigos_barras DROP COLUMN origem;` + remover UI suggest-inline / campo origem no POST.

## REQ-042 — Google Imagens: descrição ou EAN + N (2026-11-07)

- Um serviço: enviar **descrição** ou **EAN** e **N**; ir ao Google Imagens (web) e baixar as N primeiras.
- **Sem API key** — Chrome CDP abre `google.com/search?tbm=isch&q=…`, lê thumbs/URLs e baixa N.
- Pré-req: Chrome com `--remote-debugging-port` (`CDP_URL`, default `http://127.0.0.1:9223`).
- `GET|POST /api/enrichment/google-imagens` — `descricao` **ou** `ean`, `n` (default 10, máx 100), `download=0` só lista URLs.
- Persistência: `public/google-imagens/{slug}/NN.ext`.
- Também fallback do pipeline EAN→fotos (N=5).
- Antes: Custom Search / fetch HTML (Google bloqueia sem JS). Depois: scrape via CDP.
- Rollback: remover rota/módulo `google-imagens.js`; tirar fallback em `ean-imagens.js`; apagar `public/google-imagens/`.

## Próximos passos

→ Manter este arquivo alinhado a cada pedido novo · esteira de docs em [`README.md`](README.md) quando avançar funcionalidades/BDD.
