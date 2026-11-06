# Portal API — ConectMax

API local: login no [Portal do Franqueado](https://franqueado.conectmax.com/) + GETs de busca.

- Mapa completo: [`GETS.md`](GETS.md)
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
| `/catalog` | catálogo |
| `/health` | liveness |
| `/faturas` | `contasareceber` |
| `/orcamentos` | `orcamentos` |
| `/pedidos` | `pedidos` |
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

`/fluxo-previsto`: `data=YYYY-MM`.

### Exemplos

```bash
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

## Caminho inverso

- Parar: matar processo `:4175`
- Sessão: `rm ~/.config/conectmax-franqueado/cookies.txt`
- Remover: apagar `conectmax/portal-api/` + linha em [`../README.md`](../README.md)
- Antes: só `/faturas`; demais telas só no HTML do portal
