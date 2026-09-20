# linkedin-agent — Documento de visão

**Por quê:** fixar o *quê* do agente LinkedIn antes de cadência comercial ou código.  
**Importante:** este projeto **automatiza operações no app LinkedIn** usando o [`screen-robot`](../../screen-robot/README.md); não implementa fila de leads, faturamento nem papéis de vendedor.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → implementação.  
**Umbrella:** [`../README.md`](../README.md).  
**Infra de tela:** [`../../screen-robot/`](../../screen-robot/README.md).  
**Consumidor de negócio:** [`../vendas/`](../vendas/README.md).

---

## Visão

O **linkedin-agent** é o agente que orquestra o **screen-robot** para executar ações no LinkedIn (login, busca, perfil, conexão, mensagem, sessão). Traduz intenções de prospecção em sequências de operações de tela.

## Problema

O screen-robot só vê e manipula a tela genérica. Sem um agente de domínio, cada fluxo LinkedIn (login, abordar, follow-up) ficaria espalhado em scripts ad hoc ou acoplado ao produto de vendas.

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Projeto vendas** | Chamar operações LinkedIn prontas (login, abordar, extrair perfil) sem reimplementar gestos/OCR |
| **Operador / desenvolvedor** | Rodar e depurar fluxos LinkedIn sobre o agent Android via Node |

## Objetivo

Expor, sobre o screen-robot, as **ações LinkedIn** documentadas em [`docs/functionalities.md`](docs/functionalities.md).

## Dependência

```text
screen-robot (provisionar → extrair → operar → sessão)
        ↓
linkedin-agent (operações LinkedIn)
        ↓
vendas (cadência, fila, distribuição, faturamento)
```

## Fora de escopo

- Cadência comercial, fila de leads, distribuição, faturamento, papéis (isso é [`vendas`](../vendas/README.md)).
- Capacidades genéricas de device/tela (isso é [`screen-robot`](../../screen-robot/README.md)).
- Bypass de autenticação / scraping ilegítimo.

## Artefatos

| Artefato | Caminho |
|----------|---------|
| Funcionalidades | [`docs/functionalities.md`](docs/functionalities.md) |
| Docs | [`docs/`](docs/README.md) |
| Config IA | [`config/config-ia.md`](config/config-ia.md) |

## Próximos passos

→ Detalhar e validar [`docs/functionalities.md`](docs/functionalities.md)  
→ Consumir APIs/scripts do [`../../screen-robot/src/`](../../screen-robot/src/README.md)
