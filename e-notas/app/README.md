# e-notas — app (scan QR)

Front: escaneia o QR e envia a URL; página `/lista.html` lista empresas, notas e itens. Em Itens, **Cadastrar EAN** abre modal (câmera + input manual) sem sair da lista; subaba **Códigos de barras** só consulta o mapeamento. Backend consulta a DANFE na **Fazenda PR**, cadastra **empresa** (se nova), **nota** e **uma linha de item por produto da nota** (histórico).

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
| `/` | Scan do QR |
| `/lista.html` | Listagem em abas: Empresas (mapa+pins) / Notas / Itens (EAN; clique na nota → itens) |

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
| `POST` | `/api/empresas/geocode` | dispara geocode Nominatim das pendentes; `{ ok, started, empresas }` |
| `GET` | `/api/notas` | `{ ok, notas }` (com `empresa_nome` / `empresa_cnpj`; ordem emissão DESC) |
| `GET` | `/api/itens` | `{ ok, itens }` (com `empresa_nome`, `nota_numero`, `nota_emissao`, `chave_acesso`, `codigo_barras` se mapeado) |
| `GET` | `/api/codigos-barras` | `{ ok, codigosBarras }` |
| `POST` | `/api/codigos-barras` | body `{ empresa_id, codigo_unidade, codigo_barras }` → upsert; `{ ok, codigoBarras }` |

## Reverter

Parar `:4173`. Remover UI/rotas de códigos de barras (voltar ao commit anterior). Schema: `DROP TABLE enotas.codigos_barras;` se quiser apagar só o mapeamento. `DROP SCHEMA enotas CASCADE;` apaga tudo.
