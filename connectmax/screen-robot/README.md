# screen-robot — Documento de visão

**Por quê:** fixar o *quê* do robô de tela antes de goals de negócio.  
**Importante:** este projeto **só** opera o device/tela via **Node**; não implementa cadência comercial nem fila de leads.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → implementação em [`sources/`](sources/README.md).  
**Umbrella:** [`../README.md`](../README.md).  
**Consumidor LinkedIn:** [`../linkedin-agent/`](../linkedin-agent/README.md).  
**Negócio (fila/faturamento):** [`../vendas/`](../vendas/README.md).

---

## Visão

O **screen-robot** é um agent Android controlado por código Node: provisiona o device, instala APKs, recebe eventos de UI, extrai elementos/informações da tela, executa operações e guarda estado de sessão.

## Problema

Automatizar apps móveis exige um caminho estável em código: agent pronto, apps na versão certa, leitura da tela e gestos confiáveis — sem acoplar regras de venda.

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Agente / desenvolvedor** | Libs Node para as seis capacidades sem acoplar a um app de negócio |
| **linkedin-agent** | Usar o robô como infra para operações no LinkedIn |
| **Projeto vendas** | Indireto: consome o linkedin-agent, não o robô |

## Objetivo

Expor via Node: **provisionar · instalar APKs · eventos · operar · extrair · sessão**. Cenário piloto: login LinkedIn ([`docs/bdd-linkedin-login.md`](docs/bdd-linkedin-login.md)).

## Capacidades (v1)

Ver [`docs/functionalities.md`](docs/functionalities.md).

## Fora de escopo

- Operações de domínio LinkedIn (login de negócio, busca, conexão) — isso é [`linkedin-agent`](../linkedin-agent/README.md).
- Regras de prospecção, fila de leads, faturamento ou papéis de vendedor — isso é [`vendas`](../vendas/README.md).
- Bypass de autenticação / scraping fora do uso legítimo do device.

## Código e planos

| Artefato | Caminho |
|----------|---------|
| Vision | [`docs/vision.md`](docs/vision.md) |
| Funcionalidades | [`docs/functionalities.md`](docs/functionalities.md) |
| BDD login LinkedIn | [`docs/bdd-linkedin-login.md`](docs/bdd-linkedin-login.md) |
| Sources (Node + runtimes) | [`sources/`](sources/README.md) |
| android-control | [`sources/android-control/`](sources/android-control/README.md) |

## Próximos passos

→ `LINKEDIN_USER` / `LINKEDIN_PASSWORD` + `npm run linkedin-login` em `sources/android-control`
