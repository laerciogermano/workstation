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
| Nav por página + filtro “Buscar nome, cargo, cidade” | Menu transversal `AppNav` (Candidatos · Funil · Mensagens · Empresas · Agentes · Gestores · Dashboards); **Pesquisar + Qtd + Extrair** só em Candidatos; lista sem filtro `q` |
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

- Menu transversal (`src/app-nav.jsx`): sidebar vertical à esquerda (`app-shell`) com **logo conect** no topo, links (**Candidatos** · **Funil** · **Mensagens** · **Empresas** · **Agentes** · **Gestores** · **Dashboards**) e **Hero Dia/Noite** no rodapé (`ThemeToggle`). `BrandBar` só eyebrow. **Antes → depois:** tema no brand-bar → rodapé do menu; label Perfis → Candidatos. **Rollback:** `ThemeToggle` de volta no `BrandBar`; label `Perfis`.
- Agentes (`/agentes`): vendedor operacional = host + device + LinkedIn; Sync Docker; Ping / Dormir / Acordar / Backup / Remover; gestores cadastram. API: [`../api/README.md`](../api/README.md#agentes-agentes).
- Home (`/` · Candidatos): `GET /profiles?page=&limit=100`; **Pesquisar** + **Qtd** + **Extrair** → `GET /extract/start?limit=&q=` (`q` vazio → robô usa `comprador`); infinite scroll; poll `GET /extract/status` ~4s (soft-refresh). Sem filtro “Buscar nome, cargo, cidade”. **Rollback:** filtro com debounce/`q` na lista; extract sem `q`.
- Clique → `/profiles/:id` com Avatar + link LinkedIn; **Voltar** → `history.back()` (fallback `/` se não houver histórico)
- Perfil (`/profiles/:id`): botão **Extrair informações** → `GET /extract/by-url/start?url=` (deep link na URL do detail/`profileUrl`; desabilitado sem URL); poll `GET /extract/status` ~4s enquanto roda; soft-reload do card + detail ao terminar; botão **Remover** → `DELETE /profiles/:id` (exclusão lógica `deleted_at`; confirmação; volta à home e tira o card da lista). Status de conexão via `GET /linkedin-base/connections?clienteLinkedinId=` (+ fallback `inviteStatus`): se **conectado** → **Enviar mensagem** navega para `/mensagens?profileId=:id` (seleciona a conversa); se **não conectado** (`none`) → **Conectar** (`POST /linkedin-robot/connect`). Pendente não mostra Conectar. **Antes → depois:** Voltar → `/` fixo → `history.back()`; compose inline no perfil → `/mensagens?profileId=`. **Rollback:** `onBack={goHome}`; compose `POST /linkedin-robot/message` no perfil; remova `openMessages`/`initialProfileId`.

**Antes → depois (extract no perfil):** `GET /extract/detail/start?id=` → `GET /extract/by-url/start?url=` com a URL LinkedIn do perfil. **Rollback:** volte `startDetailExtract` em `App.jsx` para `detail/start?id=`.
**Antes → depois (remover perfil):** só soft-delete em massa via API → botão Remover no detalhe (`DELETE /profiles/:id`). **Rollback:** remova o botão/`removeProfile`/`onRemoved` em `App.jsx`.
- Re-extrair detalhe (`POST /profile-details`) atualiza campos e avatar na lista (API faz upsert + sync no card pai)

**Antes → depois (botão Extrair):** extract só via curl/`npm run` → em **Candidatos** **Pesquisar** + **Qtd** (default **50**) → `GET /extract/start?limit=&q=`; em `/mensagens` (fio) **Extrair** + Qtd (default **100**) → `POST /linkedin-robot/profile-messages`.  
**Antes → depois (lista ao extrair):** lista só ao recarregar → soft-refresh a cada poll de status + ao terminar.  
**Antes → depois (extract no perfil):** detalhe só via curl/`npm run login-extract-profile-detail` → botão no header de `/profiles/:id`.  
**Rollback:** remover inputs/handlers; home sem `?limit=`; mensagens sem Extrair; tirar `refreshProfilesSoft` do poll; no perfil remover `startDetailExtract` + botão/poll.
- Sem detalhe / sem URL → omite o link
- Executivo (SPA `/executivo`): filtros Ano / Mês / Vendedor; KPIs com Δ vs mesmo período do ano anterior; funil em quantidade e valor; ranking e evolução do faturamento por vendedor; “Vendedor por mês” (um gráfico de barras por vendedor, mesma escala, métrica selecionável: faturamento, valor em pedidos, pedidos, orçamentos); conversão mensal; sazonalidade ano × ano; desempenho por vendedor (taxa de aprovação, ticket médio, dias orç → pedido); maiores clientes; notas de qualidade dos dados. Não depende da API.
- Dashboard (SPA `/dashboard`): `GET /dashboard` — KPIs (% conectados/pendentes/sem convite, aceites, hoje), gráficos (atividade diária extract/convite/aceite, pie de status, grau, top cargos/cidades/empresas) e tabelas; **sem** OCR/foto/cobertura; poll **5s**.
**Antes → depois (dashboard foco):** cobertura/OCR/foto/experience/radar/outreach → status de conexão + volume diário + cargos/cidades. **Rollback:** restaurar painéis `coverage`/`Radar` no `dashboard.jsx` + payload antigo na API.
**Antes → depois (dashboard poll):** carregava uma vez → `setInterval` 5s sem spinner nas seguintes. **Rollback:** remova o `setInterval` em `dashboard.jsx`.
- Mensagens (SPA `/mensagens`): lista **só conectados** (`GET /linkedin-base/connections?status=2` ∪ peers com mensagem, dedupe por `profileUrl`, filtro final `status === 2`); avatar (`cliente_linkedin.photoBase64` ou iniciais); clique abre o histórico; **poll do fio a cada 5s** (só a 1ª carga / troca de peer mostra spinner); envio via `VITE_LINKEDIN_ROBOT_URL` (default proxy `/linkedin-robot` → `:3099`) **somente se `status === 2` (Conectado)** — compose desabilitado caso contrário. Label: `cliente.nome` → headline → slug.

**Antes → depois (lista mensagens):** todas as conexões (0/1/2) → só `status === 2`. **Rollback:** `CONNECTIONS_URL?limit=100` sem `status` e remova o `rows.filter(...STATUS_CONNECTED)`.

**Antes → depois (poll mensagens):** fio só ao clicar / Recarregar → `setInterval` 5s silencioso no peer selecionado. **Rollback:** remova o `setInterval` em `mensagens.jsx` (volte ao `useEffect` que só chama `loadMessages(selected)`).

- Funil (SPA `/funil`): board horizontal L→R; cabeçalho só título + contagem; fontes:
  | Coluna | API | Cards |
  |--------|-----|-------|
  | Candidatos | `GET /profiles` | cards de busca (paginado, “Carregar mais”) |
  | Convidados | `GET /linkedin-base/connections?status=1` | cada convite pendente |
  | Conectados | `GET /linkedin-base/connections?status=2` | cada conexão aceita |
  | Abordados | `GET /linkedin-base/messages?direction=sent` | 1 por peer |
  | Respondidos | `GET /linkedin-base/messages?direction=received` | 1 por peer (dedupe `clienteLinkedinId`) |

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
