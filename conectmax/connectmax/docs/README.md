# ConnectMax — Documentação

**Por quê:** índice dos planos e artefatos transversais (umbrella).  
**Umbrella:** [`../README.md`](../README.md) · **linkedin-agent:** [`../linkedin-agent/docs/README.md`](../linkedin-agent/docs/README.md) · **vendas:** [`../vendas/docs/README.md`](../vendas/docs/README.md)

| Artefato | Arquivo | Papel | Status |
|----------|---------|-------|--------|
| Plano prospecção por scripts | [`plano-implementacao-prospeccao-scripts.md`](plano-implementacao-prospeccao-scripts.md) | Arquitetura 3 camadas, jobs do funil, device pool, ordem de construção (sem IA no crítico) | Feito |
| Plano worker AVD (pull) | [`plano-implementacao-worker-avd.md`](plano-implementacao-worker-avd.md) | Orquestração API + worker; F0–F2 + F4 (slots/rodízio) | Em andamento (F3, F6) |
| Arquitetura API perfis | [`arquitetura.md`](arquitetura.md) | C4, diagramas de classe e sequência (extract → Nest → Postgres) | Feito |
| Arquitetura prospecção CDP | [`arquitetura-prospeccao-cdp.md`](arquitetura-prospeccao-cdp.md) | Desenho alvo: front + API + worker + CDP + roteador 4G (sem AVD) | Feito |
| Portal do Franqueado | [`portal-franqueado.md`](portal-franqueado.md) | Menu, auth PHP/sessão e endpoints ajax do painel oficial | Feito |
| Mapa visual do portal | [`portal-mapa/README.md`](portal-mapa/README.md) | Prints CDP + funcionalidades por tela (listagens e edição) | Feito |
| Portal API (faturas) | [`../../portal-api/README.md`](../../portal-api/README.md) | `GET /faturas` com login automático no portal | Feito |
| Planilhas funil (xlsx) | [`planilhas-funil/`](planilhas-funil/README.md) | Snapshot local Orçamentos / Pedidos / Faturamento 2025–2026 | Feito |
