# screen-robot — Documento de visão

**Por quê:** fixar o *quê* do robô de tela antes de goals de negócio.  
**Importante:** este projeto **só** opera o device/tela via **Node**; não implementa cadência comercial nem fila de leads.  
**No fluxo:** **este documento** → vision / scenarios / bdds / tasks → implementação em [`sources/`](sources/README.md).  
**Umbrella:** [`../README.md`](../README.md).  
**Consumidor LinkedIn:** [`../linkedin-agent/`](../linkedin-agent/README.md).  
**Negócio (fila/faturamento):** [`../vendas/`](../vendas/README.md).  
**Config IA:** [`config/config-ia.md`](config/config-ia.md).  
**Prompts:** [`../prompts/timeline.md`](../prompts/timeline.md).

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

Expor via Node: **provisionar · instalar APKs · eventos · operar · extrair · sessão**. Cenário piloto: login LinkedIn ([`bdds.md`](bdds.md)).

## Capacidades (v1)

Ver [`scenarios.md`](scenarios.md).

## Fora de escopo

- Operações de domínio LinkedIn (login de negócio, busca, conexão) — isso é [`linkedin-agent`](../linkedin-agent/README.md).
- Regras de prospecção, fila de leads, faturamento ou papéis de vendedor — isso é [`vendas`](../vendas/README.md).
- Bypass de autenticação / scraping fora do uso legítimo do device.

## Artefatos

| Artefato | Arquivo | Status |
|----------|---------|--------|
| Vision — US título + descrição | [`vision.md`](vision.md) | Feito |
| Épicos | [`epics.md`](epics.md) | Feito |
| Cenários (US + SC) | [`scenarios.md`](scenarios.md) | Feito |
| Tasks (Gantt) | [`tasks.md`](tasks.md) | Feito |
| Roadmap (Gantt) | [`roadmap.md`](roadmap.md) | Feito |
| BDDs (US/SC + piloto LinkedIn) | [`bdds.md`](bdds.md) | Feito |
| Sources | [`sources/`](sources/README.md) | Em curso |
| android-control | [`sources/android-control/`](sources/android-control/README.md) | Em curso |

## Próximos passos

→ [`bdds.md`](bdds.md) · `LINKEDIN_USER` / `LINKEDIN_PASSWORD` + `npm run linkedin-login` em `sources/android-control`
