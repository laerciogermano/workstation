# e-notas — app (scan QR)

Front **notinhas.org** (design system v1: light, azul `#0069B4` + verde `#00984B`, Plus Jakarta Sans). Home `/` lista empresas/itens; FAB inferior direito abre `/scan.html` (QR). Em Itens, **Cadastrar EAN** abre modal; subaba **Códigos de barras** consulta o mapeamento. Backend consulta a DANFE na **Fazenda PR**, cadastra **empresa** (se nova), **nota** e **itens** (histórico).

Tema: [`../design-system.md`](../design-system.md) · tokens em `public/styles.css`.  
Share/WhatsApp: metas OG em `index.html` / `scan.html` + `public/og-image.png`.

Persistência: **Postgres Contabo** (`connectmax`), schema `enotas` (via `.env`) — tabelas `empresas`, `notas`, `itens`, `codigos_barras`.

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
| `/` | Listagem: Empresas (mapa + cards/vitrine) / Itens (EAN, cód. produto); FAB → adicionar nota |
| `/scan.html` | Scan do QR da nota |
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
| `GET` | `/api/itens` | `{ ok, itens }` (com `empresa_nome`, `nota_numero`, `nota_emissao`, `chave_acesso`, `codigo_barras` se mapeado) |
| `GET` | `/api/codigos-barras` | `{ ok, codigosBarras }` |
| `POST` | `/api/codigos-barras` | body `{ empresa_id, codigo_unidade, codigo_barras }` → upsert; `{ ok, codigoBarras }` |

## Reverter

Parar `:4173`. Remover UI/rotas de códigos de barras (voltar ao commit anterior). Schema: `DROP TABLE enotas.codigos_barras;` se quiser apagar só o mapeamento. `DROP SCHEMA enotas CASCADE;` apaga tudo.
