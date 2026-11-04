# PRD — Cupido

| Campo | Valor |
|---|---|
| Produto | **Cupido** — agente de IA que encontra a pessoa melhor pra você |
| Código / pasta | `works/cupido` |
| Versão do documento | 1.0 (2026-11-04) |
| Release alvo | **Docs + marca + protótipo alta fidelidade** (sem implementação de app) |
| No escopo agora | PRD · identidade visual · benchmarking · protótipo navegável · board local |
| Fora agora | Backend, app, APIs reais de chat, pagamentos, lojas nativas |
| Fontes | [Visão](../README.md) · [Identidade](../identidade-visual.md) · [Marca](../marca/README.md) · [Protótipo](prototipos/index.html) · Board [`Trello/Cupido/`](../../Trello/Cupido/) |

---

## 1. Resumo

O **Cupido** é um produto de matching em que **você não precisa “fazer o dating” sozinho**. Um **agente de IA**:

1. **Te conhece** — conversa com você e, com consentimento, **ingere sua base de histórico de chats** (WhatsApp, Instagram, Tinder, etc.).
2. **Opera no escuro** — conversa com outras pessoas / agentes **sem que os lados saibam quem são**.
3. **Mede fit** — as combinações com **mais matches / sinais fortes** sobem no funil.
4. **Fecha o ciclo** — **dá o match**, manda o **contexto** do porquê, e/ou **marca o encontro**; depois disso vocês podem conversar diretamente.

Não é um clone de Tinder com IA colada: o diferencial é o **agente intermediário anônimo** alimentado pelo histórico real, até o encontro.

## 2. Problema

1. Swipe e chat manual consomem tempo e não usam o que você já revelou em anos de mensagens.
2. Openers e follow-ups genéricos (inclusive “IA wingman” de frase pronta) não carregam identidade.
3. Revelação precoce (foto/nome) ou ausência total de contexto no match estragam a chance de encontro.
4. Não existe um produto claro no BR que una: **histórico → agente → conversa anônima → match com contexto → agenda**.

## 3. Objetivos (fase docs / protótipo)

| # | Objetivo | Como sabemos |
|---|---|---|
| O1 | Descrever o loop completo no PRD | Este documento cobre ingestão → agente → match → encontro |
| O2 | Validar visual e jornada | Protótipo alta fidelidade navegável com fluxos críticos |
| O3 | Posicionar a marca | Identidade v1 + benchmarking de dating / wingman / blind match |
| O4 | Operar no lab | Board local `Trello/Cupido/` com cards de marca/protótipo |

**North Star (produto, hipótese futura):** *encontros marcados por semana com contexto de match aceito pelos dois lados*.

### Não-objetivos (agora)
- Implementar app, API, workers ou integrações reais.
- Monetização.
- App nativo / publicação em lojas.
- Moderação automática em produção (só esboço no PRD/protótipo).

## 4. Personas

| Persona | Papel | No protótipo |
|---|---|---|
| **Buscador** | Conecta histórico, fala com o Cupido, recebe matches/encontros | Sim |
| **Candidato** | Do outro lado (pessoa ou agente espelho); anônimo até o match | Sim (como “outro lado”) |
| **Admin / ops** | Consentimento, denúncia, pausa de agente | Tela mínima / depois |

## 5. Loop do produto (canônico)

```text
Conta → consentimento → importar histórico → calibrar com Cupido
    → Cupido conversa com candidatos (identidades ocultas)
    → score / sinais de match
    → limiar atingido → revelar match + contexto
    → marcar encontro  e/ou  abrir chat humano
```

### 5.1 Capacidades-alvo (MoSCoW do produto — para o protótipo representar)

| ID | Requisito | Prio |
|---|---|---|
| RF-01 | Criar conta / entrar; aceitar Termos e Privacidade | M |
| RF-02 | Onboarding: o que busca (relação, intenção, limites) | M |
| RF-03 | **Importar / conectar histórico de chats** com opt-in explícito e escopo visível | M |
| RF-04 | Feedback de análise do histórico (“o Cupido está te conhecendo”) | M |
| RF-05 | **Chat com o Cupido** (seu agente) para calibrar e perguntar status | M |
| RF-06 | Fila / home de **candidatos anônimos** em andamento (sem nome/foto reais) | M |
| RF-07 | Cupido **conversa com o outro lado** em nome do usuário (modo intermediário) | M |
| RF-08 | Sinais / score de compatibilidade ao longo da conversa intermediária | M |
| RF-09 | **Match**: revelação mútua + **contexto** (por que deu match, trechos resumidos) | M |
| RF-10 | **Marcar encontro** (proposta de data/local/modo; confirmação dos dois) | M |
| RF-11 | Após match: **chat humano** opcional com a pessoa | S |
| RF-12 | Pausar agente / revogar histórico / excluir conta (LGPD) | M |
| RF-13 | Denunciar / bloquear | S |
| RF-14 | Pagamento / premium | W (fora) |

## 6. Regras de negócio-chave

| ID | Regra |
|---|---|
| RN-01 | Identidade (nome, fotos, handles) **não** é revelada ao outro lado antes do match |
| RN-02 | Histórico de chats só entra com consentimento granular; pode ser revogado |
| RN-03 | O agente não inventa fatos biográficos sem base no histórico ou no que o usuário confirmou |
| RN-04 | Match exige limiar de sinais **dos dois lados** (não basta um gostar) |
| RN-05 | Contexto do match é um **resumo** — não dump integral do histórico |
| RN-06 | Encontro só agenda com aceite explícito dos dois |
| RN-07 | Usuário pode pausar o agente a qualquer momento; conversas intermediárias param |

## 7. Jornadas principais (protótipo)

1. **Primeiro uso:** Splash → conta → o que busca → conectar histórico → análise → chat com Cupido.
2. **Agente trabalhando:** Home com candidatos anônimos → detalhe de progresso → preview do que o Cupido está falando.
3. **Match:** Notificação → revelação + contexto → escolher “marcar encontro” ou “conversar agora”.
4. **Encontro:** Proposta → confirmação → card do encontro.
5. **Privacidade:** Perfil → pausar agente / gerenciar histórico / excluir.

## 8. Requisitos não funcionais (diretrizes)

| ID | Categoria | Diretriz |
|---|---|---|
| RNF-01 | Privacidade | Dados de chat = sensíveis; retenção e exclusão documentadas antes de qualquer ingestão real |
| RNF-02 | Plataforma (futuro) | PWA mobile-first; protótipo é HTML estático |
| RNF-03 | Transparência | UI deixa claro quando quem fala é o **agente** vs a **pessoa** |
| RNF-04 | Segurança | Sem implementação agora; ADR futuros cobrem auth, criptografia em repouso, etc. |

## 9. Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Ingestão de chat vista como invasiva | Alta | Alto | Opt-in claro, escopo, exclusão, protótipo educa o valor |
| Agente “alucina” personalidade | Média | Alto | RN-03; calibração contínua com o usuário |
| Mercado confunde com clone de Tinder | Média | Médio | Marca e copy: agente + anonimato + encontro |
| Assédio via agente | Média | Alto | Limites no onboarding, denúncia, pausa |
| Dependência de export de chats frágeis | Alta | Médio | Começar com upload/cola + formatos comuns |

## 10. Perguntas em aberto

| # | Pergunta | Proposta padrão |
|---|---|---|
| Q1 | O “outro lado” é sempre humano+agente ou também agente↔agente? | **Humano com agente** no v1; agente↔agente depois |
| Q2 | Histórico: quais fontes no MVP? | WhatsApp export + cola manual; outras depois |
| Q3 | Revelação parcial (primeira letra, cidade) antes do match? | **Não** no v1 — binário oculto / revelado |
| Q4 | Encontro online (video) conta? | **Sim**, como modo de encontro |
| Q5 | Nome público da marca fica “Cupido”? | **Sim** até pesquisa de marca jurídica |

## 11. Critérios desta entrega (lab)

- [x] Visão + PRD com o loop do agente
- [x] Identidade visual v1 + benchmarking
- [x] Protótipo alta fidelidade navegável
- [x] Board local com cards
- [ ] App / API — **fora**

## 12. Fora / próximas fases

| Fase | Conteúdo |
|---|---|
| Agora | Docs, marca, protótipo, board |
| Seguinte | Discovery (US/EP/roadmap) + ADRs |
| Depois | Implementação (auth, ingestão, agente, match, agenda) |
