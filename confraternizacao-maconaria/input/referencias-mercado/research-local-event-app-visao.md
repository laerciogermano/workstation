# Síntese local — visão + apps de evento (2025–2026)

Data da coleta: 2026-11-13.  
Visão do projeto: [`../../README.md`](../../README.md).

## Documento de visão (mercado)

| Fonte | Pegar | Descartar / cuidado |
|-------|-------|---------------------|
| Pichler Vision Board | 5 blocos + máx. 5 capacidades; needs outcome-based | Lista longa de features |
| Moore elevator pitch | Posicionamento em 1 frase | Virar slogan vazio |
| SVPG / Cagan | Horizonte 2–5 anos; visiontype; vision ≠ roadmap | Visão de 6–12 meses; abandonar cedo |
| Skills PLAID / product-vision / vision-forge | Pipeline Vision → PRD; checklist inspiring/concrete/durable | Inventar stack no doc de visão |

**Implicação para este projeto:** a visão já existente (evento mundial / 125 anos / multi-local Curitiba) está no nível certo — reforçar com Board (Needs prioritizados + 3–5 standouts) e Moore pitch; não expandir para rede social eterna.

## Quatro jobs do app de evento (Event Tech Live)

1. **Agenda + wayfinding** — commodity; offline real importa em multi-venue
2. **Check-in / credenciamento** — QR/NFC; um tap
3. **Networking / matchmaking** — AI claims altos; medir *reuniões realizadas*
4. **Engagement** — polls/Q&A; secundário para confraternização maçônica v1

**v1 deste produto (visão atual + LIDE):** jobs 1 + 2 (check-in/carteirinha) + pedaço de 3 (mensagem 1:1) + cadastro. Gamificação / matchmaking AI / passport de sponsor = candidatos ou fora.

## Features que o mercado prioriza (EventBookings / EventTechnology / Slash)

| Necessidade do participante | Prática de mercado | No escopo v1? |
|----------------------------|--------------------|---------------|
| O que / quando / onde | Agenda filtrável, updates live, offline | Sim |
| Onde fica | Mapa / endereço por local | Sim (locais cadastrados; GPS avançado = depois) |
| Quem está | Diretório opt-in | Sim (lista + privacidade no discovery) |
| Falar com alguém | Mensagem + (ideal) meeting request | Mensagem simples v1 |
| Entrar / presença | Check-in QR; carteirinha digital | Sim (paridade LIDE) |
| Confiança | Opt-in visibility; papéis | Sim (organização vs participante) |
| Adoção | Launch 14 dias antes; onboarding &lt; 2 min | Operacional / lançamento |
| Rede fraca no local | Cache agenda/mapa; fila offline | Prática de build (ver `praticas-dev/`) |

## Vendors de referência (pegar / descartar)

| Vendor | Pegar | Descartar para v1 |
|--------|-------|-------------------|
| **Whova** | Agenda tracks, community seed, launch 14d, push parcimonioso | Gamification passport, AI matchmaking pesado |
| **Swapcard** | Agenda personalizada + networking com controle | AI Smart Meeting Generator enterprise |
| **Brella / Grip** | Gated networking; medir meetings held | Pre-scheduled hosted-buyer |
| **Cvent Attendee Hub** | Pré / durante / pós; agenda + messaging | Suite enterprise completa, hotel blocks |
| **Guidebook / EventMobi / Bizzabo** | App como companion multi-sessão | Features de expo/lead capture |
| **Luma** | Simplicidade check-in/comunidade | Sem agenda multi-sessão — **não** é o job deste evento |
| **LIDE** (prints do cliente) | Agenda do dia, check-in, perfil/carteirinha | Ingressos/pagamento (fora de escopo v1) |

## Práticas de desenvolvimento (insumos baixados + pacote local)

| Tema | Onde |
|------|------|
| Offline / PWA | `praticas-dev/web-dev-offline.html` · `mdn-progressive-web-apps.html` |
| 12-Factor | `praticas-dev/12factor-app.html` |
| Stack Node/TS/React/Postgres/segurança | [`core/definir-projeto-moderno/`](../../../core/definir-projeto-moderno/README.md) |
| App networking real (checklist stores, consent, offline) | `texto-extraido/slash-digital-event-networking-app.md` |

## Checklist acionável (fazer / não fazer)

**Fazer**

1. Home = “próximo no meu dia” (hora + local + 1 ação)
2. Toda atividade com data/hora + local cadastrado
3. Diretório / mensagem com opt-in e papéis
4. Offline mínimo: agenda + locais
5. Push só para mudança crítica (sala/horário)
6. Onboarding curto; identidade conhecida pela organização

**Não fazer (v1)**

1. Rede social permanente / feed aberto
2. Matchmaking AI como núcleo
3. Gamification / passport de sponsor
4. Pagamento / ingresso como gate
5. Multi-evento marketplace
6. Dependência de WhatsApp para mensagem do evento

## Próximo uso

→ `docs/benchmark.md` (pegar/descartar por vendor)  
→ `docs/praticas.md` (checklist acima formalizado)  
→ manter [`../../README.md`](../../README.md) como visão canônica
