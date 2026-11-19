# 001 — Criar lib LinkedIn Human CDP

| Campo | Valor |
|-------|--------|
| Número | 001 |
| Data | 2026-11-19 |
| Origem | Chat no Cursor (workstation) |
| Título | Criar lib LinkedIn Human CDP |

## Prompt original

```
Crie dois projetos diferentes. O primeiro projeto é o LinkedIn API, LinkedIn Human CDP API, que vai servir pra ser tipo uma espécie de API pra você conseguir, é... abrir o pra você executar comandos de buscar últimas visualizações, todo todos os comandos que o worker utiliza hoje. Só que precisa ser uma uma API. No caso, no caso uma lib, que se conecta ao CDP e executa operações pra todas as operações do work que existem. Então basicamente é o LinkedIn Human CDP, é o nome da lib, e ela vai ter todos os métodos ali pra, pra fazer as operações do LinkedIn, então seguir, buscar. E o segundo projeto. Não, eu queria só esse primeiro.
```

## Interpretação

Criar **só** o projeto/lib **LinkedIn Human CDP**: fachada Node que conecta ao CDP (human-cdp) e expõe métodos para todas as operações LinkedIn que o worker usa hoje (connect, conexões recentes, mensagem, unread, mensagens de perfil, extract/search leads). Não criar o segundo projeto mencionado. Preferir lib a servidor HTTP.

## O que foi feito

- Pasta `linkedin-human-cdp/` com visão, docs, config IA, prompts, `package.json` (dep `human-cdp`).
- `src/`: `createLinkedInHumanCdp`, sessão, ponte para `screen-robot/src/lib/cdp/`.
- Example smoke + registro no workstation (`README`, `boards/data.json`, card `index.html`).
- Ponte documentada; `notifyApi` default false.
