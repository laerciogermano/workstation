# Análise — feedback pós-protótipo (2026-11-18)

**Fontes:** 4 áudios WhatsApp ([`input/`](../input/README.md) · PTTs 05.58 / 05.59 / 06.00 / 06.02) + decisões de escopo registradas na sessão.

**Antes:** visão v3.6 focada no app do evento mundial 125 anos.  
**Depois desta análise:** plataforma GOB multi-evento, perfil maçônico enriquecido, módulos plugáveis (incl. museu/acervo e gestão de riscos), visibilidade por papel.

---

## 1. O que foi dito (por áudio)

### 05.58 — Reação ao protótipo + escopo

- Visual/estilo aprovado (“ficou bom”, alinhado ao imaginado)
- Dúvida de arquitetura: o app serve **qualquer evento do GOB** ou só os **125 anos**?
- Vai enviar a **logomarca do GOB**

### 05.59 — Identidade do irmão e organização

- No perfil/referência do irmão: além de **nome** e **cidade**, incluir **loja** e **potência**
- Maçonaria organizada por **potências**; comemoram **125 anos do GOB**
- Analogia: GOB ≈ país; grão-mestre ≈ presidente; grandes secretários ≈ ministros; **loja** ≈ cidade

### 06.00 — Evento + CIM

- Em contexto de evento: sempre referenciar **potência** e **loja** do irmão
- Se o irmão for do GOB: incluir **CIM** (cadastro interno maçônico que identifica o irmão nos controles)
- Reforço de aprovação (“ficando ótimo”)

### 06.02 — Arquitetura plugável + museu/acervo

- App com **componentes opcionais** (habilita ou não) — estilo **Lego / plugável**
- Preferência por entrega tipo **app web**, sem mudar muito o visual
- Demanda paralela: app / módulo de **museu maçônico**
- Acervo: **documentos, imóveis, joias, selos** — valor total **> R$ 6 milhões**; hoje **não centralizado**
- Estão **montando um museu**; exposição exige **segurança**, **temperatura** e **regras**
- Há **orçamento** e estão **captando** recursos
- Gestão do acervo precisa de **um sistema**
- Visão: **administração central** + liberar/montar componentes por app

---

## 2. Decisões (respostas ao que foi dito)

| Ponto do áudio | Decisão |
|----------------|---------|
| Serve qualquer evento GOB ou só 125 anos? | **Sim — serve para qualquer evento** do GOB (125 anos é o primeiro/caso âncora, não o limite do produto) |
| Componentes opcionais (Lego) | Componentes **habilitáveis**; divisão também **por papéis** — mostrar ou ocultar funcionalidade conforme o papel |
| Gestão além do evento/museu | **Gestão de riscos** entra como componente **plugável** |
| Loja + potência no perfil | **Mantido** como requisito de cadastro/referência do irmão |
| CIM se irmão GOB | **Mantido** (campo/identificador quando aplicável) |
| Logomarca GOB | Aguardando envio do cliente |

---

## 3. Leitura estruturada

### 3.1 Produto

- De “app do evento 125 anos” → **plataforma de eventos GOB**, com o mundial de Curitiba como primeiro uso.
- Identidade visual: estilo do protótipo ok; falta **logo GOB** oficial.

### 3.2 Dados do participante (irmão)

Campos citados além do cadastro genérico:

- Nome  
- Cidade  
- **Loja**  
- **Potência**  
- **CIM** (quando irmão do GOB)

No evento, potência e loja devem aparecer como referência de quem está participando.

### 3.3 Arquitetura (Lego)

- Núcleo + **módulos plugáveis** ligados a uma **admin central**
- Visibilidade de funcionalidade **por papel** (organizador, participante, outros a definir)
- Módulos já nomeados nesta rodada:
  - **Eventos** (núcleo / qualquer evento GOB)
  - **Museu / acervo** (documentos, imóveis, joias, selos; regras de exposição)
  - **Gestão de riscos** (plugável)

### 3.4 Museu / acervo (demanda adjacente)

- Motivação: patrimônio (~R$ 6M+) sem empilhamento/gestão central; museu físico em preparação (segurança, temperatura, normas)
- No software: gestão do acervo + possível app/módulo de museu, plugado na mesma base administrativa

---

## 4. Impacto na visão atual (v3.6)

| Área da visão | Impacto |
|---------------|---------|
| Contexto / objetivo | Ampliar de “evento mundial 125 anos” para **plataforma multi-evento GOB** (125 anos permanece marco e caso âncora) |
| Personas | Manter Organizador / Participante; prever **papéis** que ligam/desligam módulos e telas |
| Funcionalidades | Incluir loja, potência, CIM; módulos museu/acervo e gestão de riscos como **fora do núcleo do evento** ou fase posterior, mas na arquitetura |
| Escopo por tela | Perfil (CU-21/22) precisa de loja/potência/CIM; organização passa a pensar em **habilitar módulos** e **permissões por papel** |
| Referências visuais | Manter GOP como estilo; incorporar **logo GOB** quando chegar |

---

## 5. Itens em aberto

- Conteúdo e formato do **CIM** (validação, obrigatoriedade, origem do dado)
- Lista completa de **papéis** e o que cada um vê
- Detalhamento do módulo **gestão de riscos** (escopo funcional)
- Prioridade / fase: núcleo eventos vs museu/acervo vs riscos
- Recebimento da **logomarca GOB**

---

## 6. Fontes

| Arquivo | Papel |
|---------|--------|
| [`../input/WhatsApp Ptt 2026-11-18 at 05.58.09.transcricao.txt`](../input/WhatsApp%20Ptt%202026-11-18%20at%2005.58.09.transcricao.txt) | Estilo + dúvida multi-evento + logo |
| [`../input/WhatsApp Ptt 2026-11-18 at 05.59.55.transcricao.txt`](../input/WhatsApp%20Ptt%202026-11-18%20at%2005.59.55.transcricao.txt) | Loja, potência, analogia GOB |
| [`../input/WhatsApp Ptt 2026-11-18 at 06.00.31.transcricao.txt`](../input/WhatsApp%20Ptt%202026-11-18%20at%2006.00.31.transcricao.txt) | Potência/loja no evento + CIM |
| [`../input/WhatsApp Ptt 2026-11-18 at 06.02.34.transcricao.txt`](../input/WhatsApp%20Ptt%202026-11-18%20at%2006.02.34.transcricao.txt) | Lego, museu/acervo, admin central |
| Decisões da sessão (2026-11-18) | Multi-evento = sim; papéis; gestão de riscos plugável |

**Rollback:** remover este arquivo e o link em [`README.md`](README.md); visão v3.6 permanece válida até nova revisão.
