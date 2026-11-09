# 0002 — Front em React 19 SPA/PWA

**Data:** 2026-11-09 · **Status:** Aceita · substitui a escolha “Vanilla/SPA” de `beta-docs/03-arquitetura.md` §3 (o restante do ADR-001 do Beta — identidade light, CTA azul, verde só menor preço — continua)

## Contexto
O protótipo v2 tem ~40 telas com estado compartilhado (listas, pontos, merge), View Transitions, sheets e desktop. Em vanilla isso vira um framework caseiro. O pacote `core/03-design-ui-motion` recomenda CSS primeiro + Motion para layout/spring + View Transitions entre rotas.

## Decisão
React 19 + Vite 6 + React Router 7 (`viewTransition`) + TanStack Query 5 (cache de servidor, sem estado global manual) + Motion (só a pílula do segmentado) + Leaflet/OSM + zxing carregado sob demanda. PWA com service worker (NetworkFirst para GET da API → modo offline T-71). Sem SSR/RSC: o conteúdo é por localização/pessoa e o público-alvo é app-like; SEO fica para páginas de produto num passo futuro.

## Consequências
+ Componentes = componentes do DS do protótipo; rastreio T-xx por rota.
+ Bundle inicial ~72 kB gzip; scanner e mapa fora do caminho crítico.
− Sem SSR: páginas públicas de produto não indexam bem (registrar ADR quando SEO entrar).
