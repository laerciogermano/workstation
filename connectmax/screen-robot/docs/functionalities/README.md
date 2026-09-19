# Funcionalidades — screen-robot

**Por quê:** capacidades observáveis do robô, todas expostas via **código Node**.
**Origem:** [visão](../../README.md).
**Agente LinkedIn:** [`../../../linkedin-agent/`](../../../linkedin-agent/README.md).
**Negócio:** [`../../../vendas/`](../../../vendas/README.md).
**Estimativas (min):** [`../tasks.md`](../tasks.md).  
**Vision:** [`../vision.md`](../vision.md).

**IDs:** **US-** = história · **SC-XX** = cenário sequencial (toda US tem ≥1 SC).
Cada pasta abaixo é uma estória.

| ID | Funcionalidade | Pasta |
|----|----------------|-------|
| US-01 | Provisionar um agente | [`US-01-provisionar-um-agente/`](US-01-provisionar-um-agente/README.md) |
| US-02 | Evento de boot | [`US-02-evento-de-boot/`](US-02-evento-de-boot/README.md) |
| US-03 | Evento de app aberta | [`US-03-evento-de-app-aberta/`](US-03-evento-de-app-aberta/README.md) |
| US-04 | Evento de tela estável | [`US-04-evento-de-tela-estavel/`](US-04-evento-de-tela-estavel/README.md) |
| US-05 | Evento de mudança de dump | [`US-05-evento-de-mudanca-de-dump/`](US-05-evento-de-mudanca-de-dump/README.md) |
| US-06 | Instalar APKs | [`US-06-instalar-apks/`](US-06-instalar-apks/README.md) |
| US-07 | Abrir aplicativo | [`US-07-abrir-aplicativo/`](US-07-abrir-aplicativo/README.md) |
| US-08 | tap | [`US-08-tap/`](US-08-tap/README.md) |
| US-09 | type | [`US-09-type/`](US-09-type/README.md) |
| US-10 | scroll | [`US-10-scroll/`](US-10-scroll/README.md) |
| US-11 | screenshot | [`US-11-screenshot/`](US-11-screenshot/README.md) |
| US-12 | Resgatar coordenadas x,y a partir de uma imagem | [`US-12-resgatar-coordenadas-x-y/`](US-12-resgatar-coordenadas-x-y/README.md) |
| US-13 | Extrair elementos e guardar sessão | [`US-13-extrair-elementos-e-guardar-sessao/`](US-13-extrair-elementos-e-guardar-sessao/README.md) |

## Aceite de integração

[`../bdd-linkedin-login.md`](../bdd-linkedin-login.md) · script [`../../sources/android-control/scripts/linkedin-login.js`](../../sources/android-control/scripts/linkedin-login.js)

BDD consolidado (legado): [`../bdd-nos.md`](../bdd-nos.md).

## Fora do escopo

- Cadência LinkedIn, fila de leads, faturamento, papéis de venda.
- Bypass de autenticação / scraping ilegítimo.

## Próximos passos

→ [`../tasks.md`](../tasks.md) · [`core/tasks`](../../../../core/tasks/README.md#p1--connectmax--screen-robot)
→ Implementação em [`../../sources/android-control`](../../sources/android-control/README.md)
