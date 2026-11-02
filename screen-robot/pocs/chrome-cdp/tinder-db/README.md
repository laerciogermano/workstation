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

## Dump CDP: só sequencial (1 aba)

O Tinder web **não tolera** dump em várias abas em paralelo (chat não carrega / 0 msgs). Usar **uma** aba no Chrome Germano (`:9230`) e o script serial. Detalhe: [`../../postmortem.md`](../../postmortem.md) (lição 7).

```bash
# 1 aba Tinder no Germano; resume pelo state
python3 -u /tmp/tinder-dump-pendentes.py   # ou o caminho canônico do script de dump
```

**Antes → depois:** tentativa com 10 workers/abas → sequencial 1 aba. Rollback do paralelo: não usar `dump-pendentes-parallel.py`.

**Foco macOS:** o dump sequencial não usa `Page.bringToFront`; mantém a aba “active” via CDP (`Page.setWebLifecycleState` + `Emulation.setFocusEmulationEnabled`) para rodar com a janela atrás. Extração por DOM (sem depender de layout visível).
