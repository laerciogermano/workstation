# ean-serp — EAN via descritivo (SERP + catálogos)

Serviço **à parte** do app (`:4173`): dada a descrição da NFC-e, busca candidatos de **EAN/GTIN**.

Não grava no Postgres do e-notas; só resolve e devolve JSON.

## APIs (separadas)

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET`/`POST` | `/ean/si5` | **Só SI5** (HTML + API opcional). Todas as variantes; top `n`/`limit` por score (máx 100; front usa 100) |
| `GET`/`POST` | `/ean/google-cdp` | **Só Google** via Chrome CDP (`EAN {descricao}`). Precisa `CDP_URL` (default `:9223`) |
| `GET`/`POST` | `/ean` | Orquestra SI5 + DDG (+ Google se `google_cdp=1`) — legado |

Params comuns: `descricao` (ou `q`), `n` / `limit` (default 8), `enrich` (default 1).

```bash
curl -sS 'http://127.0.0.1:4180/ean/si5?descricao=BATATA%20PRINGLES%20SABOR%20QUEIJO%20109G&n=8'
curl -sS 'http://127.0.0.1:4180/ean/google-cdp?descricao=BATATA%20PRINGLES%20SABOR%20QUEIJO%20109G&n=8'
```

App e-notas chama `/ean/si5`; com `EAN_SERP_GOOGLE_CDP=1` chama também `/ean/google-cdp`.

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
