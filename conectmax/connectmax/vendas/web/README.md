# vendas/web — lista de profiles

SPA React (Vite) que lista cards paginados de `GET /profiles`, abre `/profiles/:id` (card + `GET /profile-details/:profileId`) e consome insights prontos de `GET /dashboard`.

**API:** [`../api/README.md`](../api/README.md) · **Visão:** [`../README.md`](../README.md)

---

## Antes → depois

| Antes | Depois |
|-------|--------|
| Só `curl` / JSON na API | UI em `http://localhost:5173` com grid + busca |
| Detalhe só em state React | URL `/profiles/:id` (History API); refresh serve SPA via bypass do proxy |
| Detalhe com capa/avatar/card/OCR | Detalhe com **Avatar** + campos (sem card/OCR na UI) |
| Card/perfil só com valores soltos | Cada campo com rótulo (Nome, Cargo, Nível, Conexão, Cidade/Local, Atual/Empresa, Em comum, Extraído, LinkedIn); seções About→Sobre, Experience→Experiência, Education→Formação, Skills→Competências |
| Sem visão agregada | Rota SPA `/dashboard` + `GET /dashboard` na API (KPIs/barras/tabelas) |
| Lista carrega todos os perfis | Infinite scroll (`page`/`limit=100`/`q`) acumulando no front |
| UI genérica (Segoe / tons soltos) | Tokens e tipografia da identidade v1: **Hero Noite** (default) e **Hero Dia** (`data-theme` + toggle; `localStorage` `cx-theme`) |
| Barras CSS no dashboard | **Recharts**: barras diárias de extração (30d), area/line, radar, pie/donut, barras empilhadas e horizontais |
| Funil comercial só nas planilhas xlsx | Rota **`/executivo`**: faturamento por vendedor (ranking, participação, evolução), funil orçamentos → aprovados → pedidos → faturamento por mês/ano, barras de cada vendedor por mês, conversão, sazonalidade, leitura executiva automática e tabela por vendedor ([card Trello](../../tasks/6ad9f22cf14c52879b6b565a/README.md)) |
| Mensagens só via curl/API | Rota SPA **`/mensagens`**: lista conexões (`/linkedin-base/connections`), ao clicar carrega o fio (`/linkedin-base/messages`) e envia via robot `POST :3099/message` |
| Funil LinkedIn só no todo | Rota SPA **`/funil`**: board Candidatos → Convidados → Conectados → Abordados → Respondidos; cada coluna lista cards da API correspondente |
| Empresas só nas planilhas/portal | Rota SPA **`/empresas`**: lista `GET /empresas` (CNPJ, razão, pedidos/orçamentos) |
| Servidores / AVDs / Contas LI separados | Só **`/agentes`**: host + ADB + LinkedIn na mesma linha; gestores com `agentes:write` cadastram |
| Nav por página + filtro “Buscar nome, cargo, cidade” | Menu transversal `AppNav` (Funil · Mensagens · Empresas · Agentes · Gestores · Dashboards); home `/` redireciona ao funil |
| Nav só texto / SVG manual | Ícones **Phosphor** (`@phosphor-icons/react`, peso `thin`) no `AppNav` + `ExtractIcon` |
| `AppNav` horizontal no topo de cada página | Sidebar vertical à esquerda (`app-shell` + `.app-nav` sticky); páginas só no `.app-main` |
| Logo no `BrandBar` de cada página | Logo `conect` no topo do menu esquerdo (`BrandLogo` em `AppNav`); `BrandBar` só eyebrow |
| Hero Dia/Noite no `BrandBar` | `ThemeToggle` no rodapé do menu esquerdo (`margin-top: auto`) |
| API aberta sem login | SPA `/login` + JWT no `fetch`; nav filtra por permission; botão Sair |
| Usuários só via curl `/users` | Rota SPA **`/usuarios`**: listar, criar, editar role/senha, ativar/desativar (admin) |
| Vendedor como entidade CRM | Removido: **vendedor = agente** (host+device+LI em `/agentes`) |
| Gestor / multi-role / infra | Users `roles[]`; SPA **`/gestores`**; **`/agentes`** = host+device+LI |

**Rollback (auth):** remova `src/login.jsx` / `src/auth.js`; volte `main.jsx` sem gate; tire `/auth` `/users` `/login` do vite/nginx. Detalhe na API: [`../api/README.md`](../api/README.md#auth-jwt--rbac).

**Rollback (usuários UI):** remova `src/usuarios.jsx`, rota/nav `/usuarios` e CSS `.usr-*`; API `/users` permanece.

**Rollback (gestores/agentes/roles):** remova `gestores.jsx`/`agentes.jsx`; restaure nav/módulos legados no git; `DROP TABLE gestor_agentes, agentes;`; restaure coluna `users.role`.

**Rollback (rótulos de campo):** remova `Field` em `App.jsx` e volte os valores soltos / tags; remova CSS `.field*`. Seções em inglês: About / Experience / Education / Skills.

**Rollback:** pare o Vite (`Ctrl+C`); remova a pasta `web/` se não precisar mais. Na API, remova `app.enableCors()`, `GET /profiles/:id`, paginação e `DashboardModule` se não houver outro cliente. Voltar ao detalhe sem rota: state `selected` sem `pushState`. Remover `OcrSection` / CSS `.ocr-*` se não quiser OCR na UI. Remover `src/dashboard.jsx` + rota `/dashboard` / nav / proxy. Remover `src/brand.jsx`, fontes no `index.html` e tokens `--cx-*` / toggle de tema no CSS se quiser a UI anterior. Remover `recharts` / `react-is` do `package.json` e voltar às barras CSS. Visão executiva: remover `src/executivo.jsx`, `src/data/funil.json`, `scripts/build-funil.py`, a rota `/executivo` + links de nav e o bloco CSS `visão executiva`; `src/chart-kit.jsx` pode voltar para dentro de `dashboard.jsx`. Funil LinkedIn: remover `src/funil.jsx`, rota `/funil` / nav / proxy SPA e CSS `.funil-*`. Empresas: remover `src/empresas.jsx`, rota/nav/proxy `/empresas` e CSS `.emp-*`; na API `EmpresasModule` + `DROP TABLE empresas`. Servidores: remover `src/servidores.jsx`, rota/nav/proxy `/servidores` e CSS `.srv-*`; na API `ServidoresModule` + `DROP TABLE servidores`. AVDs: remover `src/avds.jsx`, rota/nav/proxy `/avds` e CSS `.avd-*`; na API `AvdsModule` + `DROP TABLE avds`. Contas LinkedIn: remover `src/contas-linkedin.jsx`, rota/nav/proxy `/contas-linkedin` e CSS `.cl-*`; na API `ContasLinkedinModule` + `DROP TABLE contas_linkedin`.
---

## Subir

```bash
# API (outra terminal) — ver ../api/README.md
cd ../api && npm run start:dev

# Web
cd ../web
npm install
npm run dev
```

Abre `http://localhost:5173`. Em dev, Vite faz proxy de `/profiles`, `/dashboard`, `/profile-details`, `/extract`, `/linkedin-base`, `/empresas`, `/agentes`, `/gestores` → `http://localhost:3000` (HTML em `/mensagens`, `/funil`, `/empresas`, `/agentes` e `/dashboard` cai no SPA). Em `/profiles`, SPA só no detalhe `/profiles/:uuid`; `GET /profiles?page=` (navegação no browser) vai para a API.

**Antes → depois (`/profiles` proxy):** qualquer `Accept: text/html` em `/profiles` → SPA; agora lista com query → API. **Rollback:** bypass antigo (`if accept text/html → index.html`) em `vite.config.js`.

**Prod nginx:** [`deploy/nginx-connectmax.conf`](deploy/nginx-connectmax.conf) — rotas compartilhadas proxyam a API; SPA só com `Accept: text/html`. Detalhe/rollback: [`../api/README.md`](../api/README.md#produção-contabo).

URL direta (sem proxy):

```bash
VITE_PROFILES_URL=http://localhost:3000/profiles \
VITE_PROFILE_DETAILS_URL=http://localhost:3000/profile-details \
VITE_DASHBOARD_URL=http://localhost:3000/dashboard \
npm run dev
```

---

## Uso

- Menu transversal (`src/app-nav.jsx`): sidebar vertical à esquerda (`app-shell`) com **logo conect** no topo, links (**Funil** · **Mensagens** · **Empresas** · **Agentes** · **Gestores** · **Dashboards**) e **Hero Dia/Noite** no rodapé (`ThemeToggle`). `BrandBar` só eyebrow. **Antes → depois:** item **Candidatos** (`/`) removido; `/` → `/funil`. **Rollback:** recolocar link `perfis` no `LINKS` + grid em `App.jsx`.
- Agentes (`/agentes`): vendedor operacional = host + device + LinkedIn; Sync Docker; Ping / Dormir / Acordar / Backup / Remover; gestores cadastram. API: [`../api/README.md`](../api/README.md#agentes-agentes).
- Perfil (`/profiles/:id`): abre a partir do funil; **Voltar** → `history.back()` (fallback `/funil`); **Extrair informações** → `GET /extract/by-url/start?url=`; **Remover** → `DELETE /profiles/:id` (volta ao funil). Conectado → **Enviar mensagem** (`/mensagens?profileId=`); não conectado → **Conectar** (`POST /linkedin-robot/connect`).
- Sem detalhe / sem URL → omite o link
- Executivo (SPA `/executivo`): filtros Ano / Mês / Vendedor; KPIs com Δ vs mesmo período do ano anterior; funil em quantidade e valor; ranking e evolução do faturamento por vendedor; “Vendedor por mês” (um gráfico de barras por vendedor, mesma escala, métrica selecionável: faturamento, valor em pedidos, pedidos, orçamentos); conversão mensal; sazonalidade ano × ano; desempenho por vendedor (taxa de aprovação, ticket médio, dias orç → pedido); maiores clientes; notas de qualidade dos dados. Não depende da API.
- Dashboard (SPA `/dashboard`): `GET /dashboard` — KPIs (% conectados/pendentes/sem convite, aceites, hoje), gráficos (atividade diária extract/convite/aceite, pie de status, grau, top cargos/cidades/empresas) e tabelas; **sem** OCR/foto/cobertura; poll **5s**.
**Antes → depois (dashboard foco):** cobertura/OCR/foto/experience/radar/outreach → status de conexão + volume diário + cargos/cidades. **Rollback:** restaurar painéis `coverage`/`Radar` no `dashboard.jsx` + payload antigo na API.
**Antes → depois (dashboard poll):** carregava uma vez → `setInterval` 5s sem spinner nas seguintes. **Rollback:** remova o `setInterval` em `dashboard.jsx`.
- Mensagens (SPA `/mensagens`): lista **só conectados** (`GET /linkedin-base/connections?status=2` ∪ peers com mensagem, dedupe por `profileUrl`, filtro final `status === 2`); avatar (`cliente_linkedin.photoBase64` ou iniciais); clique abre o histórico; **poll do fio a cada 5s** (só a 1ª carga / troca de peer mostra spinner); envio via `VITE_LINKEDIN_ROBOT_URL` (default proxy `/linkedin-robot` → `:3099`) **somente se `status === 2` (Conectado)** — compose desabilitado caso contrário. Label: `cliente.nome` → headline → slug.

**Antes → depois (lista mensagens):** todas as conexões (0/1/2) → só `status === 2`. **Rollback:** `CONNECTIONS_URL?limit=100` sem `status` e remova o `rows.filter(...STATUS_CONNECTED)`.

**Antes → depois (poll mensagens):** fio só ao clicar / Recarregar → `setInterval` 5s silencioso no peer selecionado. **Rollback:** remova o `setInterval` em `mensagens.jsx` (volte ao `useEffect` que só chama `loadMessages(selected)`).

- Funil (SPA `/funil`): board **por agente** (select no header; `?agent=` + `localStorage` `cx-funil-agent`); todas as colunas filtram `agentId`; fontes:
  | Coluna | API | Cards |
  |--------|-----|-------|
  | Candidatos | `GET /profiles?agentId=` | fila do agente (paginado) |
  | Convidados | `GET /linkedin-base/connections?status=1&agentId=` | convites do agente |
  | Conectados | `GET /linkedin-base/connections?status=2&agentId=` | aceites do agente |
  | Abordados | `GET /linkedin-base/messages?direction=sent&agentId=` | 1 por peer |
  | Respondidos | `GET /linkedin-base/messages?direction=received&agentId=` | 1 por peer |
  | Descartados | `GET /linkedin-base/connections?status=3&agentId=` | descartes do agente |

**Antes → depois (funil por agente):** board misturava todos os agentes (`VITE_FUNIL_AGENT_ID` só em Candidatos) → select + `agentId` em todas as colunas. **Rollback:** tire o select e as query `agentId`; volte `FUNIL_AGENT_ID` só em candidatos.  
**Antes → depois (sem tela Candidatos):** grid `/` + Extrair em massa → removidos; leads só na coluna Candidatos do funil. Extract em massa via API/`curl`. **Rollback:** restaure o item nav + home em `App.jsx`.  
**Antes → depois (funil):** etapas só no todo Screen Robot → board em `/funil` lendo as APIs acima.  
**Antes → depois (sem Perfil Extraído):** coluna `GET /profile-details?hasUrl=1` no board → removida (Candidatos já cobre extract).  
**Antes → depois (abrir perfil no funil):** só Candidatos tinham “Abrir” → clique em qualquer card (com `profileId` ou URL) abre `/profiles/:id` (ensure via `GET /profiles/ensure?url=` se preciso); lá há **Extrair informações**.  
**Antes → depois (avatar Convidados):** cards sem foto porque `cliente_linkedin.photoBase64` vinha null → API de conexões enriquece avatar a partir dos profiles.

**Antes → depois (extract unificado):** `/profiles` e `/profile-details` leem/gravam `cliente_linkedin` (não há mais `linkedin_profiles`). Label do funil: se `cliente.nome` parecer slug com hífen, usa Title Case da URL. Rollback: commit anterior.

**Antes → depois (funil dedupe):** mesma pessoa em Candidatos+Convidados / Conectados+Abordados → board mostra só a etapa mais à direita (`dedupeBoardColumns`). Candidatos na API também exclui status 1|2. Rollback: remover dedupe e o `NOT EXISTS` em `buildActiveLinkedinQuery`.

**Antes → depois (label conexão):** status só implícito na coluna → badge colorido **Conectado** (verde) / **Pendente** (âmbar) / **Não conectado** (vermelho) no funil, conexões e perfil (`connection-status.jsx`). Rollback: remover badge + CSS `.conn-badge-*`.  
**Rollback:** remover `src/funil.jsx` + rota/nav/proxy/CSS; ou recolocar a coluna `perfil-extraido` se precisar. No card, volte a exigir só `card.profileId` e o botão Abrir.

**Antes → depois (mensagens):** fallback só se `connections` vazio → merge sempre; `reverse()` bagunçava o fio → `sortMessagesChronological`.  
**Antes → depois (envio):** compose sempre liberado → só com conexão aceita (`status: 2`); API e robot reforçam a mesma regra. Peer só com chat (sem row de conexão) conta como conectado na UI; lote/`received` na API promove a conexão.  
**Antes → depois (avatar mensagens):** só texto → `ConnAvatar` com `photoBase64`. Rollback: remova `ConnAvatar` / CSS `.msg-avatar*`.  
**Rollback:** `reverse()`; `if (!rows.length)` só-mensagens; ou remover rota/CSS/proxy; reverter gate `canSend` em `mensagens.jsx`.

**Antes → depois (extrações diárias):** só área/linha “Extrações no tempo” → + painel `BarChart` “Extrações por dia (barras · 30d)” com `byDay.profiles`. Remover o primeiro `ChartPanel` de barras em `dashboard.jsx` para voltar.

**Antes → depois (atividade 30d):** `ComposedChart` (barras Extrações/Convites + linha Conectados) → `LineChart` com três linhas (Extrações, Convites, Conectados). **Rollback:** restaurar `ComposedChart` + `Bar` para extracts/invited e `Line` só em connected.

**Antes → depois (lista):** botões Anterior/Próxima → infinite scroll acumulando páginas.  
**Antes → depois (dashboard):** agregação client-side → `GET /dashboard`.  
**Antes → depois (gráficos):** barras CSS → Recharts (`ComposedChart`/`Pie`/`Radar`/`Bar`).  
**Rollback:** voltar `Pagination` no `App.jsx`; API de `page`/`limit` permanece. Remover `recharts` e restaurar `.bar-chart` no CSS.
---

## Dados da visão executiva

`src/data/funil.json` é gerado a partir dos xlsx em [`../../docs/planilhas-funil/`](../../docs/planilhas-funil/README.md) (snapshot do Portal Franqueado):

```bash
python3 scripts/build-funil.py            # padrão: ../../docs/planilhas-funil
python3 scripts/build-funil.py <pasta>    # outra pasta com os 3 xlsx
```

Requer `openpyxl`. O script lê as **abas mensais** linha a linha, não as abas *Resumo*:

- **Faturamento:** o *Resumo* soma a linha `Total: R$ …` junto com as linhas por vendedor em 12 meses (R$ 4,27 mi); o valor por vendedor é R$ 2,44 mi. Abas de meses futuros (só zeros) são descartadas.
- **Vendedor no faturamento:** extraído de `#N - Nome R$ …`; `DEVOLUÇÃO` é ignorado.
- **Orç → pedido:** pedido liga ao orçamento pelo nº (`Cliente` do orçamento começa com `Nº …`).
