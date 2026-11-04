## Objetivo
Adicionar **modo Mapa** na descoberta do RoleGo (Explorar), para ver rolês no raio por geografia — **ainda não implementar**; este card só registra o pedido e as decisões pendentes.

## Contexto
- Visão (`role-go/README.md` §4–5.6): Feed / Swipe / **Mapa** / Lista; mapa previsto como premium/patrocinado.
- Beta (`role-go/beta/`): Feed / Swipe / Lista já existem; **mapa fora do escopo** (RF-E02-28, Q2 no PRD — risco de “virar Google”, depende E08/E09).
- Criativo de marca já tem tela `mapa` em `role-go/marca/identidade-visual-rolego-v1.html`.
- Arquitetura (`docs/03` §6): extensão futura `discovery.mapBbox` (`ST_MakeEnvelope`) + promoção.

## Decisões a fechar antes de codar

### 1. Onde entra
- **A)** 4º modo no Segmented de Explorar: Feed / Swipe / Lista / **Mapa** (`/explorar/mapa`)
- **B)** Mapa embutido no próprio Feed (widget acima/entre cards)

### 2. Quais eventos
- **A)** Todos do raio (público + privado descobertável); pin exato só com endereço liberado (RN-03); senão aproximado
- **B)** Só públicos
- **C)** Só patrocinados / premium (visão 5.6 — ads ainda não existem no beta)

## Escopo técnico (quando for implementar)
- Contracts: coords no card (respeitando `canSeeExactAddress`) e/ou `GET /discovery/map` com bbox
- API: query geo por envelope + origem/raio/filtros atuais
- Web: 4º modo (ou widget), tiles OSM/Leaflet (sem Mapbox pago no beta), pin ciano, card flutuante ao selecionar → página do evento
- Docs: PRD Q2 / RF-E02-28, US nova, protótipo T-xx, CLAUDE.md

## Fora deste card
- Implementação de código
- Ads / premium / impulsionamento (E08/E09)
- App nativo

## Insumos
- `role-go/beta/apps/web/src/features/discovery/routes.tsx`
- `role-go/beta/apps/api/src/modules/discovery/`
- `role-go/beta/packages/contracts/src/discovery.ts` · `events.ts` (EventCard sem `location` hoje)
- `role-go/beta/docs/01-prd.md` (Q2, RF-E02-28)
- Criativo mapa: `role-go/marca/identidade-visual-rolego-v1.html` (screen `mapa`)
