# Portal API — ConectMax

API local: login no [Portal do Franqueado](https://franqueado.conectmax.com/) + GETs de busca.

- **Dashboard financeiro (funil):** `http://127.0.0.1:4175/dashboard` — Orçamento → Pedido → NF → Contas a receber → Atrasados
- **Swagger / OpenAPI:** [`openapi.yaml`](openapi.yaml) · UI `http://127.0.0.1:4175/docs` · JSON `/openapi.json`
- Mapa portal: [`GETS.md`](GETS.md)
- Segurança / isolamento franquias: [`SEGURANCA-ISOLAMENTO-FRANQUIAS.md`](SEGURANCA-ISOLAMENTO-FRANQUIAS.md)
- Réplica Postgres (Campinas → Contabo): [`SCHEMA-REPLICA.md`](SCHEMA-REPLICA.md) · `node scripts/sync-campinas-postgres.mjs`
- Dashboard + modelo normalizado Contabo: `GET /db/*` — ver [`SCHEMA-REPLICA.md`](SCHEMA-REPLICA.md)
- Painel: [`../connectmax/docs/portal-franqueado.md`](../connectmax/docs/portal-franqueado.md)

## Pré-requisito

`~/.config/conectmax-franqueado/credentials.env` com `CONECTMAX_FRANQUEADO_USER` / `PASS`.

## Subir

```bash
cd /Users/laerciogermano/Documents/works/conectmax/portal-api
npm start
# http://127.0.0.1:4175
```

## Endpoints

| GET | Fonte portal |
|-----|----------------|
| `/dashboard` (`/financeiro`) | UI funil financeiro (consome GETs abaixo) |
| `/docs` | Swagger UI |
| `/openapi.json` / `/openapi.yaml` | spec OpenAPI 3 |
| `/catalog` | catálogo |
| `/health` | liveness |
| `/faturas` | `contasareceber` (`contato=1` → email/telefone) |
| `/orcamentos` | `orcamentos` |
| `/pedidos` | `pedidos` (lista; `itens=1` carrega linhas) |
| `/pedidos/:id` | detalhe + contato + **itens** (`produtos.php`) |
| `/notas-fiscais` | `notas_fiscais` |
| `/faturamento` | `faturamento` + Excel detalhe |
| `/fluxo-previsto` | `fluxo_previsto` |
| `/chamados` | `chamados` |
| `/notificacoes` | `notificacoes` |

### Query comum

| Param | Default | Nota |
|-------|---------|------|
| `data_inicial` / `from` | `01/01/2025` | |
| `data_final` / `to` | `31/12/2026` | |
| `status` | — | filtro local no JSON |
| `id_vendedor` | — | filtro do portal |
| `current_page` | — | só aquela página |
| `all` | `1` (se sem `current_page`) | varre paginação |
| `refresh` | — | `1` força login |
| `contato` | — | só `/faturas`: `1` busca email/telefone no pedido |
| `itens` | — | só `/pedidos`: `1` inclui linhas de produto |
| `limit` | — | com `itens=1`: máx. de pedidos a enriquecer |

`/fluxo-previsto`: `data=YYYY-MM`.

### Exemplos

```bash
curl -sS 'http://127.0.0.1:4175/pedidos/17050'
curl -sS 'http://127.0.0.1:4175/pedidos?data_inicial=01/11/2026&data_final=06/11/2026&itens=1&limit=5&all=0'
curl -sS 'http://127.0.0.1:4175/faturas?status=Vencida&contato=1'
curl -sS 'http://127.0.0.1:4175/catalog'
curl -sS 'http://127.0.0.1:4175/faturas?status=Aberta'
curl -sS 'http://127.0.0.1:4175/orcamentos?data_inicial=01/11/2026&data_final=06/11/2026&all=0'
curl -sS 'http://127.0.0.1:4175/pedidos?current_page=1'
curl -sS 'http://127.0.0.1:4175/notas-fiscais?all=0'
curl -sS 'http://127.0.0.1:4175/faturamento?data_inicial=01/01/2026&data_final=06/11/2026'
curl -sS 'http://127.0.0.1:4175/fluxo-previsto?data=2026-11'
curl -sS 'http://127.0.0.1:4175/chamados'
curl -sS 'http://127.0.0.1:4175/notificacoes'
```

## Dashboard financeiro

UI estática [`dashboard.html`](dashboard.html) servida em `/dashboard`. Lista franquias via `/db/health` e filtra com `franquia_id` (default **9**; também `?franquia_id=` na URL). Carrega em paralelo `/db/orcamentos`, `/db/pedidos`, `/db/notas-fiscais`, `/db/faturas` e `/db/atrasados`. Clique no estágio filtra a lista.

## Caminho inverso

- Parar: matar processo `:4175`
- Remover seletor de franquia: tirar `#franquia` + `loadFranquias` / `franquia_id` em `qs()` no `dashboard.html` (volta ao default fixo 9 no backend)
- Remover dashboard: apagar `dashboard.html` + rotas `/dashboard` `/financeiro` em `src/index.js` + linhas neste README
- Sessão: `rm ~/.config/conectmax-franqueado/cookies.txt`
- Remover API: apagar `conectmax/portal-api/` + linha em [`../README.md`](../README.md)
- Antes: só `/faturas`; demais telas só no HTML do portal
