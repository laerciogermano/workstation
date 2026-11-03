# LinkedIn: o que é proibido × o que o lab faz

Fontes baixadas em `2026-11-03` (HTML + extrato `.md`):

| Arquivo | URL |
|---|---|
| [`prohibited-software.md`](prohibited-software.md) | https://www.linkedin.com/help/linkedin/answer/a1341387 |
| [`user-agreement-en.md`](user-agreement-en.md) | https://www.linkedin.com/legal/user-agreement |
| [`professional-community-policies.md`](professional-community-policies.md) | https://www.linkedin.com/legal/professional-community-policies |

Help “fake profiles” (`a1338088`) retornou 404 — a regra de perfil falso está nas Community Policies (“Be Trustworthy”).

## Seção 8.2 (User Agreement) — mapa lab

| # | Proibição | Lab faz? | Evidência |
|---|---|---|---|
| 1 | Identidade falsa / perfil de outra pessoa / não real | **Sim** | Contas inventadas (ex. Daniela Hoffmann); foto Unsplash (não likeness); experiências/empresa fabricadas |
| 2 | Scraping / cópia de dados | **Sim** (workers) | `linkedin-extract-leads.js`, extract-connections, etc. |
| 3 | Bypass de segurança / limites | **Parcial** | Spoof de fingerprint (`Page.addScript…`), máscara WebRTC; CDP |
| 13 | Bots / métodos automatizados | **Sim** | `human-cdp` + scripts signup/perfil/extração |
| 15 | Overlay / modificar aparência da UI | **Sim (quando `debug: true`)** | Painel `debug-overlay` injetado no DOM do LinkedIn |
| 16 | Carga irrazoável / gaming | Risco | Lote de signups no mesmo dia/IP range |

Community Policies (Be Trustworthy): true identity; sem fake profile; foto deve ser a likeness da pessoa; sem se associar a empresa sem vínculo real.

## Caso: Daniela Hoffmann (banida 2026-11-03)

CSV: `daniela.hoffmann@brsupply.email` · CDP `daniela-hoffmann` :9255 · IP `177.30.179.187` · `restrita=sim`.

*(Não há “Amanda Hoffman” no CSV; Amanda Rocha está `restrita=nao`. Banida = Daniela Hoffmann.)*

### O que ocorreu nessa conta

1. **Conta falsa (8.2.1 + Community)** — persona lab, foto de terceiros (Unsplash), vínculo BR Supply inventado, 3 experiências fabricadas. Motivo **estrutural** de restrição, independente de IP.
2. **Automação (8.2.13)** — criação/perfil via Chrome+CDP/`human-cdp`.
3. **Overlay UI (8.2.15)** — na criação (`createdAt` 2026-11-03T16:40Z / ~13:40 BRT) o default era `debug = opts.debug !== false` → **overlay ligado**. Só às 19:30 BRT o commit `e6f5ba1d` desligou o default. Ou seja: signup + montagem de perfil rodaram **com painel injetado** no LinkedIn.
4. **Fingerprint inconsistente** — `cidade=Campinas` vs `timezone=America/Recife` + geo Recife; Mac spoof. Agrava sinal de fraude, sozinho não explica o ban.
5. **IP** — `177.30.179.187` **único** no CSV (não compartilhado com outra conta). Pares do mesmo dia com IPs distintos **não** foram banidos → IP sozinho é hipótese fraca para *este* caso.

### Veredito

Causa mais alinhada às regras oficiais: **perfil falso + automação**, com **overlay de debug** como sinal técnico adicional tipificado na 8.2.15.  
“Só o IP” **não** encaixa bem (IP exclusivo; colegas do lote ok).

### Antes → depois (overlay)

- **Antes:** `createLinkedInCdp` ligava debug por padrão → keeper injetava painel em todas as abas LinkedIn.
- **Depois:** `debug` só com `debug: true` explícito; workers forçam `false`.
- **Rollback:** `connectCdp(id, { debug: true })` / `updateCdp(id, { debug: true })`.
