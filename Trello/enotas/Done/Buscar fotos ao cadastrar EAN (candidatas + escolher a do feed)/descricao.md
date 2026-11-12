## Problema
Hoje a foto do produto no feed depende de arquivo manual em `public/ean-fotos/{ean}.jpg` + coluna `codigos_barras.foto_url` (REQ-026). Ao cadastrar/vincular um EAN (scan na vitrine, modal `#modal-ean`), **não há busca automática** de imagens — o card fica sem foto até alguém colocar o arquivo na pasta.

## Objetivo
Sempre que um código de barras for **cadastrado/vinculado a um produto**, o backend dispara um serviço que **busca fotos desse EAN**, guarda **várias candidatas** e permite **escolher a melhor** para representar o produto no feed (aba Produtos, vitrine da loja, detalhe).

Não é votação comunitária nesta entrega: é **seleção da imagem representativa** (automática na 1ª importação + override manual depois).

## Contexto atual
- Tabela `enotas.codigos_barras` (`empresa_id` + `codigo_unidade` → EAN + `foto_url` única)
- POST `/api/codigos-barras` faz upsert; só preenche `foto_url` se o arquivo já existir em `ean-fotos/`
- Fontes já usadas offline no README de `ean-fotos/`: Open Food Facts → Open Beauty Facts → Open Products Facts → UPCitemdb → catálogos BR
- UI: modal EAN na vitrine (REQ-031); feed usa `foto_url` nos cards

## Proposta de solução

### 1. Gatilho
No sucesso do `POST /api/codigos-barras` (EAN novo ou ainda sem imagens), enfileirar/buscar fotos para aquele EAN (idempotente: se já houver candidatas, não rebaixar em massa sem flag).

### 2. Fontes (preferir API estável; Google Images só como fallback)
Ordem sugerida:
1. Open Food Facts / Open Beauty / Open Products (API pública por barcode)
2. UPCitemdb / catálogos BR se já estiverem no pipeline offline
3. Fallback: busca por imagens com o EAN (ex. Google Images / Custom Search / SerpAPI) — **só se** as APIs de produto falharem; documentar ToS/chave e limite de rate

Baixar até **~5 imagens** candidatas por EAN (dedupe por URL/hash).

### 3. Modelo de dados — tabela de imagens
Nova tabela, ex. `enotas.ean_imagens`:
- `id`
- `codigo_barras` (EAN, index)
- `url_origem` / `fonte` (openfoodfacts, upcitemdb, google, …)
- `path_local` (ex. `ean-fotos/789…/01.jpg`) — arquivo salvo no disco do app
- `ordem` (posição na busca)
- `selecionada` (bool) **ou** apontar a escolhida em `codigos_barras.foto_url` / `imagem_id`
- `criado_em`

Regra: **uma imagem selecionada por EAN** alimenta o feed (`foto_url` continua sendo o contrato do front, ou passa a resolver via join).

### 4. Escolha da melhor (não voto)
- Na 1ª importação: auto-selecionar a 1ª candidata válida (ou heurística simples: preferir fonte OFF > catálogo > busca genérica; preferir imagem “front” se a API marcar)
- UI no detalhe do produto (ou modal pós-cadastro EAN): grade das candidatas → toque **define a foto do feed**
- Trocar seleção atualiza `foto_url` / flag `selecionada` sem rebaixar

### 5. APIs sugeridas
- Interno: ao upsert EAN → job `buscarImagensEan(ean)`
- `GET /api/ean-imagens?codigo_barras=` — lista candidatas
- `POST /api/ean-imagens/:id/selecionar` — marca a do feed
- Opcional: `POST /api/ean-imagens/buscar` — re-disparar busca

### 6. Fora de escopo (agora)
- Votação multi-usuário / ranking social
- Upload manual de foto pelo usuário (pode ser card futuro)
- OCR/visão para validar se a imagem é o produto certo

## Critérios de aceite
- [ ] Ao cadastrar/vincular EAN sem imagens, o serviço busca e persiste até 5 candidatas (com arquivos locais)
- [ ] Existe tabela (ou equivalente) de imagens por código de barras + metadados de fonte
- [ ] Uma imagem fica marcada como representativa e aparece no feed / vitrine / detalhe
- [ ] Dá para trocar a imagem representativa entre as candidatas na UI
- [ ] Busca é idempotente (re-cadastrar o mesmo EAN não duplica à toa)
- [ ] Preferência por APIs de produto (OFF etc.); fallback de busca genérica documentado
- [ ] REQ + README do app atualizados; rollback descrito (DROP tabela / flag off)

## Notas de implementação
- Rodar busca **assíncrona** se possível (não travar o POST do modal EAN); UI pode mostrar placeholder até chegar foto
- Respeitar rate limits e User-Agent das APIs; não scrapear HTML frágil como caminho principal
- Relacionado: REQ-026 (foto por EAN), REQ-031 (EAN na vitrine)