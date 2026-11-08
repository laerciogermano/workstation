# ean-serp — EAN via descritivo (SERP + catálogos)

Serviço **à parte** do app (`:4173`): dada a descrição da NFC-e, busca candidatos de **EAN/GTIN**.

Não grava no Postgres do e-notas; só resolve e devolve JSON.

## APIs (separadas)

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET`/`POST` | `/ean/si5` | **Só SI5** JSON final. Todas as variantes; top `n`/`limit` (máx 100) |
| `GET` | `/ean/si5/stream` | **SSE** SI5: `meta` → `batch` (por variante) → `done` (+ `enrich` se `enrich=1`) |
| `GET`/`POST` | `/ean/google-cdp` | **Só Google** via Chrome CDP (`EAN {descricao}`). Precisa `CDP_URL` (default `:9223`) |
| `GET`/`POST` | `/ean` | Orquestra SI5 + DDG (+ Google se `google_cdp=1`) — legado |

Params comuns: `descricao` (ou `q`), `n` / `limit` (default 8). JSON: `enrich` default 1. Stream: `enrich` default 0.

```bash
curl -sS 'http://127.0.0.1:4180/ean/si5?descricao=BATATA%20PRINGLES%20QUEIJO%20109G&n=8'
curl -N 'http://127.0.0.1:4180/ean/si5/stream?descricao=BATATA%20PRINGLES%20QUEIJO%20109G&n=100'
```

App: front usa `GET /api/enrichment/ean/si5/stream` (proxy SSE). JSON permanece em `/api/enrichment/ean/si5`.

## Subir

```bash
cd e-notas/ean-serp
cp .env.example .env   # opcional
npm install
npm start
```

`http://127.0.0.1:4180` · `PORT=4180`.

## Reverter

Parar o processo `:4180` e remover a pasta `e-notas/ean-serp/`. Nada no schema `enotas`.
