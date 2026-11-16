# Síntese — Black Friday / BFCM para B2B tech (2025–2026)

Insumo consolidado para IA desenvolver campanha/PRD da ConectMax. Fontes em `texto-extraido/`, `skills/`, `prompts/`.

## Contexto ConectMax (do brief)

- Vende tecnologia para empresas (B2B)
- Objetivo da campanha: **aumentar faturamento**
- Margem fixa ~**25%** → dá para descontar no catálogo, mas desconto fundo come contribuição rápido
- Sem SKU único obrigatório — todos os produtos podem entrar

## O que o mercado diz (consenso)

### 1. BF no B2B existe — mas não é “varejo com CNPJ”

- 85% dos sellers B2B planejam participar (DHL / Distribution Strategy, 2025); 63% reportaram vendas maiores em 2024.
- BR 2025: e-commerce ~R$ 4,76 bi no dia (+11,2%); primeiras 12h R$ 1,69 bi (+24,5%) — pico antecipado (Agis).
- Revendas de TI: notebooks, monitores, impressoras, kits; ganham com **hardware + serviço** (Agis).
- Ciclo B2B longo (6–7 stakeholders, meses): janela de 24–72h sozinha é fraca para enterprise; funciona melhor em self-serve / poucos decisores / cartão (Core dna).

### 2. Desconto % amplo é a última alavanca, não a primeira

Consenso repetido (Core dna, Cleverbridge, Mercado&Consumo, Symphony, Postali, promotion-plan skill):

| Preferir | Evitar |
|----------|--------|
| Bundles, garantia, instalação, suporte, licenças extras | Sitewide deep discount sem conta de margem |
| Early access a clientes/key accounts | “Acaba hoje” + extensão infinita |
| Condições de pagamento / volume / frete | Treinar base a esperar X% todo novembro |
| Segmentar por conta/região/volume | Uma oferta genérica para todos |

Com margem 25%: cada 5–10 pts de desconto reduz forte a contribuição; exigir **uplift de volume** explícito (fórmula no skill `promotion-plan`).

### 3. Timing e estrutura da campanha

- Anunciar cedo; prazos fixos; janela longa (início Nov → Dez), não só a sexta (Cleverbridge / Shopify checklist).
- Escada típica (skills + prompts BFCM): teaser → VIP early access → pico → weekend bridge → last chance → follow-up.
- B2B: o ouro está no **follow-up pós-evento** (propostas abertas convertem em T+30/T+90).

### 4. Operação > criatividade

- Catálogo, regras de preço start/stop, estoque, checkout/NF, suporte e entrega alinhados (Core dna: “BF optional; operational maturity not”).
- 81% abandonam se a opção de entrega preferida não existe (DHL).
- Shopify founders 2025: oferta **simples**; inventário travado cedo; comunicar mais do que parece confortável.

### 5. Métricas que importam (B2B)

- Faturamento vs baseline; margem de contribuição; AOV; CPA
- Conversão de leads e **conversão pós-evento**
- Retenção / expansão de conta (não só pedido pontual)
- Em paid: break-even ROAS por profundidade de desconto (DTCskills BFCM Command Center)

## Skills / prompts baixados — quando usar

| Artefato | Uso |
|----------|-----|
| `skills/promotion-plan-SKILL.md` | Plano completo com matemática de margem |
| `skills/discount-marketing-SKILL.md` | Estrutura de pricing promocional / BFCM SaaS-like |
| `skills/black-friday-emails-SKILL.md` | Sequência de e-mail por fases |
| `skills/holiday-fomo-marketing-SKILL.md` | Urgência/FOMO e-commerce (adaptar tom B2B) |
| `skills/seasonal-promotion-campaign-builder-SKILL.md` | Brief multi-canal rápido |
| `prompts/bfcm-campaign-planner.md` | Prompt genérico e-com BFCM |
| `prompts/conectmax-bf-b2b-campanha.md` | Prompt calibrado margem 25% + B2B tech |

Referência paga (não baixamos o SKILL.md proprietário): [BFCM Command Center](https://dtcskills.com/skills/bfcm-command-center) — offer math + calendar + readiness + debrief. Resumo em `texto-extraido/dtcskills-bfcm-command-center.md`. Playbook de 16 skills: [type.com](https://type.com/blog/ai-skills-for-bfcm).

## Recomendações acionáveis para o PRD/campanha ConectMax

1. **Objetivo:** Δ faturamento na janela + guardrail de margem mínima pós-desconto.
2. **Oferta:** catálogo elegível, mas escada por segmento; priorizar bundles hardware+serviço; % off moderado vs valor agregado.
3. **Calendário:** early access base → pico público → last call → nurture de propostas.
4. **Canais:** comercial + e-mail/WhatsApp + site; mensagem única e simples.
5. **Ops:** start/stop de preço, estoque, SLA entrega/suporte, capacidade máxima.
6. **Pós:** debrief T+7 e pipeline T+30/90; não medir só o dia da sexta.

## Gaps / o que ainda pedir ao negócio

- Baseline de faturamento e margem real por família
- Capacidade logística e de suporte no pico
- Política de preço com fornecedor (até quanto o custo cai)
- Lista de key accounts para early access
- Canais e CRM disponíveis
