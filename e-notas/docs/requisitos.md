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
- Finalidade: o EAN é o identificador comum entre empresas; cada loja usa códigos de unidade diferentes e a nota **não expõe** o código de barras — o vínculo é populado manualmente.
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

## REQ-014 — Capacidades-alvo pós-benchmarking (2026-11-01)

Insumos do card [Benchmarking soluções similares](https://trello.com/c/1fMjqGdR) e do [PRD](prd.md) — capacidades a considerar no notinhas.org / e-notas (ainda sem implementação obrigatória neste REQ):

- **Comparação de preços** — mesmo produto (EAN) entre estabelecimentos; menor preço com loja e data.
- **Histórico de preços** — evolução do preço por produto e por mercado ao longo do tempo.
- **Montagem apartada** — cesta/lista cotada por mercado e sugestão de divisão entre 2+ estabelecimentos para reduzir o custo total.
- **Tela da loja (vitrine e-commerce)** — página do estabelecimento com itens observados (catálogo read-only, sem checkout).
- **Busca geo / onde comprar perto** — pesquisar um item e ver lojas físicas próximas (GPS ou região, ex. centro), com distância, preço e data.
- **Integrações via API para empresas** — API B2B para estabelecimentos/parceiros consultarem ou alimentarem o índice.
- **Sistema de delivery (*future*)** — pedido + entrega a partir da vitrine/cesta; fora da v1 (ver [PRD](prd.md) §4.7).
- **Fonte do preço** — observações do índice são NFC-e (balcão). Preços de apps/marketplaces, se exibidos no futuro, devem vir com **rótulo de canal** e não misturar na mesma série histórica sem aviso (insumo: [`../marca/comparacao-precos-apps/`](../marca/comparacao-precos-apps/README.md)).

Curadoria: [`../marca/benchmarking-solucoes/README.md`](../marca/benchmarking-solucoes/README.md).

## REQ-015 — Identidade visual notinhas.org (2026-11-01)

- Marca pública consumer: **notinhas.org** (não usar “e-notas” como wordmark na UI).
- Paleta: azul `#0069B4` / `#014380` + verde `#00984B` (referência Nota Paraná / Menor Preço).
- Tipografia: Plus Jakarta Sans; menor preço sempre em verde com loja + data.
- Manual: [`../marca/identidade-visual-notinhas-v1.html`](../marca/identidade-visual-notinhas-v1.html) · tokens [`../identidade-visual.md`](../identidade-visual.md).
- Card: [Criar identidade visual](https://trello.com/c/qUI3Rb9a).


---

## Próximos passos

→ Manter este arquivo alinhado a cada pedido novo · esteira de docs em [`README.md`](README.md) quando avançar funcionalidades/BDD.
