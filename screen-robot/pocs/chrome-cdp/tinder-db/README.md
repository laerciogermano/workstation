# Tinder → Postgres Contabo

Schema `tinder` no DB `connectmax` (host Contabo). Conta padrão: `germano`.

## Tabelas

| Tabela | Conteúdo |
|--------|----------|
| `tinder.contas` | Conta Tinder (slug) |
| `tinder.perfis` | Match (nome + `href` `/app/messages/…`) |
| `tinder.conversas` | Última msg / se pendente |
| `tinder.mensagens` | Histórico dumpado (`seq` ordem) |

## Uso

```bash
cd screen-robot/pocs/chrome-cdp/tinder-db
python3 import.py          # schema + xlsx + dumps
python3 import.py dumps    # só JSONs em ../tinder-conversas-nao-respondidas/
python3 import.py xlsx     # só planilha lista
```

Credenciais: [`.env`](.env) (mesmo host/user do e-notas; `DB_SCHEMA=tinder`).

## Antes → depois

- **Antes:** só arquivos locais (`tinder-conversas-germano.xlsx`, dumps).
- **Depois:** dados em `connectmax.tinder.*`.
- **Rollback:** `DROP SCHEMA tinder CASCADE;` e apagar esta pasta/`DB_SCHEMA` se não for mais usar.

## Fonte

- Lista: `../tinder-conversas-germano.xlsx`
- Pendentes: `../tinder-conversas-pendentes.json` / `../tinder-nao-respondidas.md`
- Mensagens: `../tinder-conversas-nao-respondidas/*.json` (dump CDP em andamento)
