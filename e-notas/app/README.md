# e-notas — app (scan QR)

Front **notinhas.shop** ([`notinhas.shop.DESIGN.md`](../marca/notinhas.shop.DESIGN.md): mist canvas, CTA azul, verde só menor preço, Plus Jakarta Sans). Home `/`: abas **Produtos** (inicial, título Menores preços + grade foto/preço) e **Estabelecimentos** (mapa + mercados); FAB **Nota** → `/scan.html`. Shell light (gradiente só na apresentação). Backend consulta a DANFE na **Fazenda PR**, cadastra **empresa** (se nova), **nota** e **itens** (histórico).

Tema: [`../design-system.md`](../design-system.md) · tokens em `public/styles.css`.  
Share/WhatsApp: metas OG em `index.html` / `scan.html` + `public/og-image.png`.

Persistência: **Postgres Contabo** (`connectmax`), schema `enotas` (via `.env`) — tabelas `empresas`, `notas`, `itens`, `codigos_barras`, `ean_imagens`, `ean_sugestoes`.

HTTPS autoassinado em `certs/`.

## Subir

```bash
cd e-notas/app
cp .env.example .env   # se ainda não tiver .env
npm install
npm start
```

`https://<ip-lan>:4173` · `PORT=4173`.

Produção Contabo (HTTPS, convive com conect tec): `https://144.126.154.90/enotas/` ou `https://144.126.154.90:4173/` — ver [`../deploy/README.md`](../deploy/README.md).

## `.env`

| Var | Exemplo |
|-----|---------|
| `DB_HOST` | `144.126.154.90` |
| `DB_PORT` | `5432` |
| `DB_USER` | `connectmax` |
| `DB_PASSWORD` | (ver `credenciais.md`) |
| `DB_NAME` | `connectmax` |
| `DB_SCHEMA` | `enotas` |

Credenciais não vão no git (`.env` ignorado).

## Páginas

| Rota | Função |
|------|--------|
| `/` | Listagem: Estabelecimentos / **Notas** (detalhe → itens + EAN) / Itens; FAB → adicionar nota; rodapé → Apresentação |
| `/apresentacao.html` | Deck produto (o quê / como / mercado / marca) — espelho web de [`../marca/apresentacao-notinhas-v1.html`](../marca/apresentacao-notinhas-v1.html) |
| `/scan.html` | Scan do QR da nota (câmera ao vivo + tirar foto / escolher imagem) |
| `/lista.html` | Redirect → `/` |

## API

`POST /api/nota` `{ "url": "http://www.fazenda.pr.gov.br/nfce/qrcode?p=..." }`

1. Busca HTML da consulta pública  
2. Extrai empresa / nota / itens  
3. `enotas.empresas`: insert se CNPJ novo  
4. `enotas.notas`: insert por `chave_acesso` (se já existir, não duplica)  
5. `enotas.itens`: **uma linha por `(nota, codigo)`**; notas diferentes do mesmo código = histórico

Resposta: `{ ok, created, empresaCriada, url, empresa, nota, itens }`.

| Método | Rota | Resposta |
|--------|------|----------|
| `GET` | `/api/empresas` | `{ ok, empresas }` (inclui `lat`/`lng` quando geocodificado) |
| `POST` | `/api/empresas/geocode` | dispara geocode Nominatim das pendentes; `{ ok, started, empresas }` (endereço normalizado: remove `, 0,` / segmentos vazios da DANFE) |
| `GET` | `/api/notas` | `{ ok, notas }` (com `empresa_nome` / `empresa_cnpj`; ordem emissão DESC) |
| `GET` | `/api/itens` | `{ ok, itens }` (com `empresa_nome`, `nota_numero`, `nota_emissao`, `chave_acesso`, `codigo_barras`, `foto_url` se mapeado) |
| `GET` | `/api/codigos-barras` | `{ ok, codigosBarras }` (inclui `foto_url`) |
| `POST` | `/api/codigos-barras` | body `{ empresa_id, codigo_unidade, codigo_barras, foto_url?, origem?, descricao? }` → upsert; `origem`: `sugestao` \| `barcode_scan` \| `manual` (REQ-043); dispara fotos (REQ-032) |
| `GET` | `/api/ean-imagens?codigo_barras=` | `{ ok, imagens }` candidatas do EAN |
| `POST` | `/api/ean-imagens/buscar` | body `{ codigo_barras, force? }` → busca síncrona (idempotente sem `force`) |
| `POST` | `/api/ean-imagens/:id/selecionar` | marca a foto do feed e atualiza `codigos_barras.foto_url` |
| `GET`/`POST` | `/api/enrichment/ean` | query/body `descricao` → candidatos EAN (REQ-039; sem auto-vínculo) |
| `GET`/`POST` | `/api/enrichment/imagens` | query/body `ean` ou `codigo_barras`, `force?` → imagens (REQ-040) |
| `GET`/`POST` | `/api/enrichment/imagens-por-descricao` | query/body `descricao`, `force?` → `modo: ean\|texto` + imagens (REQ-041) |
| `GET`/`POST` | `/api/enrichment/google-imagens` | `descricao` **ou** `ean` + `n` (1–100) → scraping Google Imagens + download (REQ-042); `download=0` só lista URLs |

Abrir no browser (GET): `https://127.0.0.1:4173/api/enrichment/ean?descricao=COCA%20COLA%202L%20PET`  
Google Imagens (CDP): `https://127.0.0.1:4173/api/enrichment/google-imagens?descricao=COCA%20COLA%202L&n=20`  
Sem API key: Chrome CDP (`CDP_URL`, default `:9223`) abre `tbm=isch` e baixa. Arquivos em `public/google-imagens/`.

UI: na **vitrine do estabelecimento**, botão **Código de barras** / **Editar EAN** no item (câmera, tirar foto / escolher imagem, digitação, **Sugerir EAN pela descrição**) → modal `#modal-ean` → `POST` acima (REQ-031/039). No **detalhe do produto**, grade **Fotos** para escolher a representativa.

Módulo: [`enrichment.js`](enrichment.js) (normalização + match local/OFF + orquestração). Cache: `ean_sugestoes`.

Fotos: `public/ean-fotos/{ean}.jpg` (legado) e `public/ean-fotos/{ean}/NN.ext` (candidatas) · ver [`public/ean-fotos/README.md`](public/ean-fotos/README.md).

## Reverter

Parar `:4173`. Origem EAN (REQ-043): `ALTER TABLE enotas.codigos_barras DROP COLUMN origem;` + UI suggest-inline. Enrichment: `DROP TABLE enotas.ean_sugestoes;` + remover `enrichment.js` / rotas `/api/enrichment/*` / bloco `.ean-suggest`. Fotos: `DROP TABLE enotas.ean_imagens;` + `ean-imagens.js`. `DROP SCHEMA enotas CASCADE;` apaga tudo.
