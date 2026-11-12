## Objetivo
Criar um **worker ConnectMax** que rode as mesmas operações LinkedIn do worker AVD, mas via **Chrome CDP** (`human-cdp` + `screen-robot/src/lib/cdp/`), em vez de ADB/AVD.

## Contexto
- Worker atual (AVD): `conectmax/connectmax/vendas/worker/` — claim na API → handlers → `SERIAL` + scripts AVD
- Libs de ação **já existem** no CDP (mesmo contrato): `connectByLinkedInUrl`, `extractRecentConnections`, `sendLinkedInMessage`, `listUnreadMessages`, `listProfileMessages`, `extractLeads` — ver `screen-robot/src/lib/cdp/README.md` e API POC `:3098`
- Contas CDP: `contas-linkedin-clozzy.csv` / registry `CDP_ID` (ex.: `daniela-hoffmann` :9255)

## Escopo
1. Processo worker (single; host/slots se couber depois) que enroll/claim/complete/fail igual ao AVD
2. Handlers dos mesmos `type`s, apontando para libs/scripts CDP (`CDP_ID` / `CDP_URL` no lugar de `SERIAL`):
   - `extrair_leads`
   - `conectar`
   - `verificar_conexoes`
   - `enviar_prospeccao`
   - `ler_mensagens` (com `--sync` / persistência como no AVD)
3. Script `start-worker-*-cdp.sh` (ou equivalente) com `API_URL` Contabo + `AGENT_ID` + `CDP_ID`
4. Docs: uso + caminho inverso (voltar ao worker AVD / `SERIAL`)
5. Aceite: agente com conta CDP claima job real (ex. `extrair_leads`) e completa na API sem AVD

## Fora de escopo
- Reimplementar as libs CDP (já feitas)
- Dashboard de frota / CRUD de CDPs (cards existentes)
- Troca automática AVD↔CDP no mesmo slot sem desenho explícito

## Relacionados
- Worker AVD: `conectmax/connectmax/vendas/worker/README.md`
- Libs CDP: `screen-robot/src/lib/cdp/README.md`
- Dashboard bots: https://trello.com/c/A1h6DvaX
- CRUD CDPs: https://trello.com/c/hoLSkLko