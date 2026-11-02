## Objetivo
Criar **interfaces de CRUD** para gerenciar **CDPs** (instâncias Chrome com remote debugging): cadastro, listagem, edição, exclusão e operação (subir/parar/conectar) — base para todos os fluxos que usam [`human-cdp`](https://trello.com/c/5tt5ZTeN).

## Problema
Hoje CDPs vivem em scripts (`start-*.sh`), CSV (`contas-facebook-chrome.csv`) e portas fixas. Não há UI/API única para criar/editar/remover um perfil CDP, ver status (LISTEN), abrir aba ou apontar a lib humana.

## Escopo
1. **Modelo** de recurso CDP: nome, `user-data-dir`, porta, `start_script`, plataforma/conta, status (up/down), URL padrão, observações
2. **CRUD API** (REST ou equivalente no lab): `POST/GET/PATCH/DELETE /cdps` (+ `POST /cdps/:id/start|stop|connect`)
3. **UI CRUD** mínima: lista + formulário criar/editar + ações start/stop + indicador porta LISTEN
4. Integração com `human-cdp.connect({ cdpUrl })` e CSV/scripts existentes (import/sync inicial)
5. Docs: contrato, como subir, caminho inverso (voltar só aos `start-*.sh`)

## Entrega
- Código no `screen-robot/` (API + UI ou painel POC)
- Seed a partir do CSV de perfis Chrome
- Aceite: criar → start → `connect` human-cdp → listar status → editar → stop → delete

## Fora de escopo
- Orquestração multi-máquina / cloud
- Bypass anti-bot
- Substituir AVD/adb

## Relacionados
- Lib humana: https://trello.com/c/5tt5ZTeN · `screen-robot/pocs/chrome-cdp/human-cdp/`
- Lab: https://trello.com/c/XcjfqioO · `screen-robot/pocs/bot-lab/`
- Registro atual: `screen-robot/pocs/android-studio/contas-facebook-chrome.csv`
