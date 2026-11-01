# e-notas — app (scan QR)

Front: escaneia o QR e envia a URL. Backend consulta a DANFE na **Fazenda PR**, cadastra **empresa** (se nova), **nota** e **uma linha de item por produto da nota** (histórico).

Persistência: **Postgres Contabo** (`connectmax`), schema `enotas` (via `.env`).

HTTPS autoassinado em `certs/`.

## Subir

```bash
cd e-notas/app
cp .env.example .env   # se ainda não tiver .env
npm install
npm start
```

`https://<ip-lan>:4173` · `PORT=4173`.

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

## API

`POST /api/nota` `{ "url": "http://www.fazenda.pr.gov.br/nfce/qrcode?p=..." }`

1. Busca HTML da consulta pública  
2. Extrai empresa / nota / itens  
3. `enotas.empresas`: insert se CNPJ novo  
4. `enotas.notas`: insert por `chave_acesso` (se já existir, não duplica)  
5. `enotas.itens`: **novas linhas** por produto da nota (histórico)

Resposta: `{ ok, created, empresaCriada, url, empresa, nota, itens }`.

## Reverter

Parar `:4173`. `DROP SCHEMA enotas CASCADE;` no Postgres. Voltar `db.js`/`.env` ao commit anterior (SQLite local, se houver).
