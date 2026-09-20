# screen-robot — Documento de visão

**Por quê:** fixar o *quê* do robô de tela antes de goals de negócio.  
**Importante:** este projeto **só** opera o device/tela via **Node**; não implementa cadência comercial nem fila de leads.  
**No fluxo:** **este documento** → stories → epics (prioridade) → roadmap → refinar estória (scenarios → bdds → protótipo se houver) → `7.tasks` / implementation-plan → pasta [`tasks/`](tasks/README.md) (EP/US/SC) → implementação em [`sources/`](sources/README.md).  
**Umbrella:** [`../connectmax/README.md`](../connectmax/README.md).  
**Consumidor LinkedIn:** [`../connectmax/linkedin-agent/`](../connectmax/linkedin-agent/README.md).  
**Negócio (fila/faturamento):** [`../connectmax/vendas/`](../connectmax/vendas/README.md).  
**Config IA:** [`config/config-ia.md`](config/config-ia.md).  
**Prompts:** [`../connectmax/prompts/timeline.md`](../connectmax/prompts/timeline.md).

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

Expor via Node: **provisionar · instalar APKs · eventos · operar · extrair · sessão**. Cenário piloto: login LinkedIn (BDDs em [`5.bdds.md`](5.bdds.md)).

## Capacidades (v1)

Ver stories em [`1.stories.md`](1.stories.md) e cenários em [`4.scenarios.md`](4.scenarios.md).

## Fora de escopo

- Operações de domínio LinkedIn (login de negócio, busca, conexão) — isso é [`linkedin-agent`](../connectmax/linkedin-agent/README.md).
- Regras de prospecção, fila de leads, faturamento ou papéis de vendedor — isso é [`vendas`](../connectmax/vendas/README.md).
- Bypass de autenticação / scraping fora do uso legítimo do device.

## Artefatos

| Artefato | Arquivo | Status |
|----------|---------|--------|
| Stories — US título + descrição | [`1.stories.md`](1.stories.md) | Feito |
| Épicos (prioridade) | [`2.epics.md`](2.epics.md) | Feito |
| Roadmap (Gantt) | [`3.roadmap.md`](3.roadmap.md) | Feito |
| Cenários | [`4.scenarios.md`](4.scenarios.md) | Feito |
| BDDs | [`5.bdds.md`](5.bdds.md) | Feito |
| Implementation plan | por épico em [`implementation-plan/`](implementation-plan/README.md) | Feito |
| Tasks (Gantt) | [`7.tasks.md`](7.tasks.md) | Feito |
| Tasks (EP/US/SC) | [`tasks/`](tasks/README.md) | EP-01 |
| Sources | [`sources/`](sources/README.md) | Em curso |
| sources | [`sources/`](sources/README.md) | Em curso |

## Próximos passos

→ [`4.scenarios.md`](4.scenarios.md) · [`5.bdds.md`](5.bdds.md) · `LINKEDIN_USER` / `LINKEDIN_PASSWORD` + `npm run linkedin-login` em `sources`
