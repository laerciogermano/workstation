# screen-robot — Documento de visão

**Por quê:** fixar o *quê* do robô de tela antes de código ou goals de negócio.  
**Importante:** este projeto **só** vê e manipula a tela; não implementa cadência comercial nem fila de leads.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → implementação em [`sources/`](sources/README.md).  
**Umbrella:** [`../README.md`](../README.md).  
**Consumidor de negócio:** [`../vendas/`](../vendas/README.md).

---

## Visão

O **screen-robot** é um robô genérico de UI por **imagem**: captura o frame da tela, extrai uma lista de elementos (textos, ícones, botões, cards), decide a próxima ação e manipula o device (clicar, digitar, rolar, copiar).

Contrato: **frame in → action out**. O mesmo motor roda no redroid e depois em hardware.

## Problema

Automatizar apps móveis sem depender de uiautomator/acessibilidade em produção exige um caminho estável: ver o PNG, entender o que está na tela e agir com coordenadas/gestos confiáveis.

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Agente / desenvolvedor** | API e CLIs para perceive + actuate sem acoplar a um app de negócio |
| **Projeto vendas (ConnectMax)** | Usar o robô como infra para prospecção no LinkedIn |

## Objetivo

Entregar Capture → Perceive → Decide → Actuate com **agent como único transporte de device neste momento**, goals JSON sem coordenadas hardcoded, e operação por listas de elementos (tap, type, swipe, wait, scroll).

## Capacidades (v1)

- Capturar frame (PNG + width/height) **via agent**.
- Identificar textos (OCR), ícones/botões/cards (vision) e mesclar em `Element[]`.
- Listar e selecionar elementos por label, kind ou índice.
- Clicar, digitar, rolar, aguardar elemento, copiar texto / região **via agent**.
- Decidir ação via matcher determinístico ou LLM opcional.
- Calibrar resolução frame ↔ actuator.
- **Premissa atual:** todos os devices são agents (sem dual ADB/agent neste momento).

## Fora de escopo

- Regras de prospecção, fila de leads, faturamento ou papéis de vendedor.
- Fechar venda ou conversar comercialmente.
- Bypass de autenticação / scraping fora do uso legítimo do device.

## Código, épicos e planos

| Artefato | Caminho |
|----------|---------|
| Épicos (Capture · Perceive · Decide · Actuate) | [`epics/`](epics/README.md) |
| Sources (redroid, android-studio, android-control) | [`sources/`](sources/README.md) |
| Plano produto (WBS + Gantt) | [`docs/plano-percepcao-imagem-hardware.md`](docs/plano-percepcao-imagem-hardware.md) |
| Plano implementação | [`docs/plano-implementacao-percepcao.md`](docs/plano-implementacao-percepcao.md) |
| Funcionalidades | [`docs/functionalities.md`](docs/functionalities.md) |

## Próximos passos

→ [`epics/`](epics/README.md) → implementar **EP-01 Capture** + **EP-04 Actuate** (smoke) em `sources/android-control`