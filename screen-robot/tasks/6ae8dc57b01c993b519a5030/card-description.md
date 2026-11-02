## Objetivo
Montar um **catálogo (lista) de devices + browsers reais** com combinações de fingerprint **coerentes** — cada entrada deve parecer um aparelho/browser de mercado, não um conjunto inventado de campos soltos.

## Problema
Hoje o `fingerprint` no human-cdp (`meta.fingerprint` / `updateCdp`) aceita UA, platform, lang/tz, viewport/screen, cores/mem, Client Hints, geo etc. Sem um catálogo de referência, é fácil montar perfis **inconsistentes** (ex.: MacIntel + viewport mobile, Chrome 140 + brands de outra versão, dpr/cores/mem que não batem com o modelo). Sites e anti-bot cruzam esses sinais; o lab (painel Fingerprint) também. Precisamos de **fontes reais** para preencher e validar.

## Escopo
1. **Lista/catálogo versionado** (CSV, JSON ou MD tabelado) de combinações device + browser reais, cobrindo pelo menos:
   - Desktop: macOS + Windows (Chrome estável recente)
   - Mobile: Android + iOS (Chrome / Safari conforme o OS)
2. Por entrada, campos alinhados ao contrato `fingerprint` da lib:
   - `userAgent` + `userAgentMetadata` (brands, platform, platformVersion, architecture, model, mobile, bitness)
   - `platform`, `lang` / `acceptLanguage`, `timezone`, `locale`
   - `viewport` (width/height, deviceScaleFactor, screenWidth/Height)
   - `hardwareConcurrency`, `deviceMemory`, `maxTouchPoints`, `touch`
   - `colorScheme` / `reducedMotion` (defaults sensatos)
   - `geolocation` opcional (pares lat/long plausíveis com timezone/locale)
3. **Regra de coerência**: cada linha é um “aparelho real” — campos devem bater entre si (UA ↔ CH ↔ screen ↔ cores/mem ↔ touch). Documentar a origem (device real, UA observado, docs Chrome/Apple).
4. Docs: como usar uma entrada com `updateCdp(id, { fingerprint })` / `connectCdp(id, { fingerprint })`; caminho inverso (voltar ao fingerprint null / perfil sem override).
5. Aceite: ≥ N entradas (mín. ~8–12) revisáveis; pelo menos 2 aplicadas em CDPs de lab e conferidas no painel Fingerprint do bot-lab (hash estável e tabela sem contradições óbvias).

## Entrega
- Arquivo(s) do catálogo em `screen-robot/pocs/chrome-cdp/human-cdp/` (ou pasta `fingerprints/` ao lado)
- README: schema da entrada + exemplos + como escolher/aplicar
- Ligação com CRUD CDPs (`hoLSkLko`) e painel do bot-lab

## Fora de escopo
- Spoof avançado (canvas/WebGL/audio/fonts/mediaDevices fakes)
- IP de egress / proxy
- Coletor automático em massa de UAs da web (só referências reais curadas)

## Relacionados
- Lib humana: https://trello.com/c/5tt5ZTeN · `screen-robot/pocs/chrome-cdp/human-cdp/`
- CRUD CDPs: https://trello.com/c/hoLSkLko
- Debug overlay: https://trello.com/c/W4GN946S
- Lab Fingerprint: https://trello.com/c/XcjfqioO · `screen-robot/pocs/bot-lab/`
