# Possibilidades — Connect Max API

| # | Direção | Prós | Contras |
|---|---|---|---|
| A | **Monólito Node ESM** espelhando `portal-api` + API key + Contabo | Rápido; reusa parsers; alinhado ao lab | Continua scrape HTML |
| B | NestJS + módulos + JWT app | Stack “moderna” core | Overkill p/ proxy de GETs |
| C | Só publicar `portal-api` sem rename | Zero cópia | Nome/contrato não batem com o pedido |

## Escolha

**A** — Connect Max API como app publicado; código baseado em `portal-api`; auth `API_KEY`; host `connect-max-api.laerciogermano.com` (wildcard Contabo).
