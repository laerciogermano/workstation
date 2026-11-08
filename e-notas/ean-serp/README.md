# ean-serp — EAN via descritivo (SERP + catálogos)

Serviço **à parte** do app (`:4173`): dada a descrição da NFC-e, busca candidatos de **EAN/GTIN** com a estratégia `EAN` + nome na web e catálogos BR.

Não grava no Postgres do e-notas; só resolve e devolve JSON.

## Fontes

| Ordem | Fonte | O que entrega |
|-------|--------|----------------|
| 1 | **SI5** HTML (`global.si5.com.br/?q=`) | EAN + link; enrich na ficha → nome + foto |
| 1b | **SI5 API** (`SI5_TOKEN`) | opcional; mesma base com JSON |
| 2 | **DuckDuckGo HTML** `EAN {descricao}` | links Cosmos / SI5 / Systax / atacados com EAN na URL |
| 3 | **Google CDP** (`GOOGLE_CDP=1` ou `?google_cdp=1`) | opcional; Chrome `--remote-debugging-port` |

Google HTML puro costuma vir ofuscado; DDG cobre o padrão SERP sem CDP. Cosmos API/HTML costuma cair em Cloudflare — o EAN já vem na URL do SERP.

## Subir

```bash
cd e-notas/ean-serp
cp .env.example .env   # opcional
npm install
npm start
```

`http://127.0.0.1:4180` · `PORT=4180`.

## API

| Método | Rota | Params |
|--------|------|--------|
| `GET`/`POST` | `/ean` ou `/api/ean` | `descricao` (ou `q`), `limit` (default 8), `enrich` (default 1), `google_cdp` |

Exemplo:

```bash
curl -sS 'http://127.0.0.1:4180/ean?descricao=PAO%20DE%20FORMA%20VISCONTI%20TRAD.400G'
```

Resposta:

```json
{
  "ok": true,
  "descricao": "PAO DE FORMA VISCONTI TRAD.400G",
  "descricao_norm": "PAO FORMA VISCONTI TRAD 400G",
  "candidatos": [
    {
      "ean": "7891962051338",
      "score": 0.95,
      "fonte": "si5-html",
      "fontes": ["si5-html", "ddg:cosmos", "si5-produto"],
      "nome_canonico": "Pao De Forma Tradicional 400g Visconti",
      "image_url": "https://cdn3.si5.com.br/img/.../7891962051338.webp",
      "url": "https://global.si5.com.br/produtos/7891962051338"
    }
  ],
  "providers": [{ "id": "si5-html", "n": 2 }, { "id": "ddg-serp", "n": 2 }]
}
```

CLI:

```bash
npm run resolve -- "PAO DE FORMA VISCONTI TRAD.400G"
```

## Integração com o app

O app chama este serviço em `enrichment.js` (`EAN_SERP_URL`, default `http://127.0.0.1:4180`) ao resolver `/api/enrichment/ean`. Produto **sem EAN** (vitrine / detalhe) mostra as sugestões; toque vincula com `origem=sugestao`.

## Reverter

Parar o processo `:4180` e remover a pasta `e-notas/ean-serp/`. Nada no schema `enotas`.
