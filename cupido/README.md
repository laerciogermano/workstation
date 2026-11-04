# Cupido — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* antes de identidade, protótipo ou código.  
**Importante:** não é swipe clássico — é um **agente de IA** que te conhece pelo histórico, conversa por você com candidatos anônimos e só revela / marca encontro quando o match é forte.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → [`marca/`](marca/README.md) → protótipo → (depois) discovery fino / implementação.

Derivados: [`docs/`](docs/README.md) · PRD: [`docs/prd.md`](docs/prd.md) · Protótipo: [`docs/prototipos/index.html`](docs/prototipos/index.html) · Identidade: [`identidade-visual.md`](identidade-visual.md) · Marca: [`marca/`](marca/README.md) · Regras IA: [`config/config-ia.md`](config/config-ia.md) · Board local: [`../Trello/Cupido/`](../Trello/Cupido/).

---

## Visão

O **Cupido** é o agente de IA que **identifica a pessoa melhor pra você**: importa sua base de histórico de chats, conversa com você para calibrar, **conversa com candidatos sem que vocês saibam quem são**, e — nas combinações com mais matches — **revela o match com contexto** e/ou **marca o encontro**.

## Problema

| Dor | O que acontece hoje |
|-----|---------------------|
| **Swipe sem profundidade** | Apps de dating otimizam volume; pouco contexto real sobre quem você é |
| **Você escreve tudo** | Mensagens, openers e follow-ups caem na sua mão; cansa e desalinha |
| **Histórico desperdiçado** | Anos de WhatsApp/Instagram/Tinder já mostram estilo, humor e valores — ninguém usa isso de verdade |
| **Match cego demais ou cedo demais** | Ou você revela foto/nome cedo demais, ou nunca chega a um encontro com contexto útil |
| **Agente genérico** | Wingmans de IA escrevem “frases prontas”; não operam o funil até o encontro |

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Buscador** | Quer alguém compatível sem gastar noites no chat |
| **Reservado** | Prefere anonimato até haver sinal forte de fit |
| **Operador Cupido (interno)** | Modera abusos, consentimento e qualidade do agente |

## Objetivo

Ser o lugar em que um **agente** cuida do matching e da conversa intermediária, e você só entra em cena (chat humano ou encontro) quando o fit é alto.

## Proposta de valor

| Necessidade | O que o Cupido faz |
|-------------|--------------------|
| Me conhecer de verdade | Ingere histórico de chats (com consentimento) + conversa com você |
| Conversar sem me expor | Agente fala com candidatos; identidades ocultas até o match |
| Saber quem “bate” | Score / sinais de match contínuos |
| Chegar no encontro | Revela contexto + agenda o encontro (ou libera chat humano) |

## Princípios

1. **Agente no centro** — você calibra; o Cupido opera.
2. **Anonimato até o fit** — sem revelação precoce de identidade.
3. **Histórico é combustível** — base de chats com opt-in explícito.
4. **Match = contexto** — revelação vem com resumo do porquê.
5. **Encontro é feature** — não só “deu match”; calendário / proposta de encontro.
6. **Consentimento e LGPD desde v1** — importação, exclusão e pausa do agente.

## Escopo da visão (agora)

### Inclui (docs / marca / protótipo)
- PRD com o loop completo
- Identidade visual v1 + benchmarking de concorrentes
- Protótipo **alta fidelidade** navegável (sem app implementado)

### Fora (por enquanto)
- Backend, app, integrações reais de chat
- Pagamentos / premium
- App nativo nas lojas

## Sucesso (hipótese)

- Usuário conecta histórico e sente que o agente “já sabe” quem ele é.
- Candidatos avançam sem revelação até limiar de match.
- Match entrega contexto acionável + caminho claro para encontro ou chat.

## Antes → depois

Sem produto → `cupido/` + board local + PRD + marca + protótipo.  
**Rollback:** apagar `cupido/` e `Trello/Cupido/`; remover linha no README da workstation.
