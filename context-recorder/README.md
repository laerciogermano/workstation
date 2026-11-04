# Context Recorder — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* antes de PRD, arquitetura ou código.  
**Importante:** não é só “voice recorder” — é **memória contínua** de áudio (mic + desktop) **e** de tela (screenshot + OCR em mudança).  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → app / agents / harness.

Derivados: [`docs/`](docs/README.md).  
PRD: [`docs/prd.md`](docs/prd.md).  
Arquitetura: [`docs/arquitetura.md`](docs/arquitetura.md).  
Plano: [`docs/plano-implementacao.md`](docs/plano-implementacao.md).  
Regras IA: [`config/config-ia.md`](config/config-ia.md).  
Board: [Context Recorder](https://trello.com/b/lH0lCxXE/context-recorder).

---

## Visão

O **Context Recorder** captura o que acontece no ambiente do operador — **fala** (microfone e áudio do desktop, em trilhas separadas) e **tela** (snapshots + OCR sempre que a UI muda) — com horário, indexa tudo e expõe como **memória pesquisável** e **contexto para IA / harness**, sem precisar reescrever ou falar de novo.

## Problema

Ideias, feedbacks e o estado da tela **somem**. O operador olha um protótipo (ex. Notinhas.shop), fala o que mudar e isso se perde. Em reuniões, o que os outros falam some. O que estava na tela no instante T também some — a menos que alguém tire print e digite.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Fala sem rastro** | Comentários orais sobre UI/produto não viram contexto |
| **Só o mic** | Ditado ignora desktop / interlocutores em call |
| **Tela sem memória** | Mudou a UI → sumiu o texto visível; sem OCR temporal |
| **Reescrever / refalar** | Para a IA agir, digita de novo o que já foi dito ou visto |
| **Contexto disperso** | Áudio, prints e notas em silos, sem API para harness |

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Operador / builder** | Gravar pensamentos + tela enquanto trabalha; depois buscar e injetar na IA |
| **Participante de reunião** | Guardar o que eu e os outros falaram (`mic` ≠ `desktop`) |
| **Harness / agente** | Consultar segmentos áudio/OCR por tempo/query e montar contexto |

## Objetivo

Ser a **memória multimodal do lab**: capturar → transcrever / OCR → buscar → servir contexto — áudio e tela alinhados no tempo.

## Proposta de valor

| Necessidade | O que o Context Recorder faz |
|-------------|------------------------------|
| Não perder o que falo | Captura mic com timestamp + STT |
| Saber o que os outros falaram | Trilha **desktop** + STT; linhas distintas de `mic` |
| Não perder o que estava na tela | Screenshot + OCR em **mudança de tela** (e opção periódica) |
| Achar depois | Busca full-text (depois semântica) por texto / hora / sessão / fonte |
| Usar na IA sem redigitar | API/CLI/MCP de retrieval para harness / Cursor |

### Exemplos canônicos

**Notinhas.shop** — Operador fala o que alterar no protótipo. Sem o sistema, perde-se. Com o Context Recorder: áudio + horário + (opcional) OCR da tela do protótipo → a IA aplica as mudanças sem redigitar.

**Reunião** — Desktop captura a call; mic captura o operador; linhas separadas permitem “o que eu disse” vs “o que falaram”.

**Mudança de UI** — Tela muda → novo snapshot OCR na base → dá para perguntar “o que estava escrito no modal às 9h12”.

## Princípios

1. **Multimodal no tempo** — áudio e tela compartilham a mesma linha do tempo.
2. **Duas fontes de áudio, duas trilhas** — `mic` ≠ `desktop`.
3. **OCR em mudança** — novo frame relevante quando a tela muda (diff), não só timer cego.
4. **Texto é a interface** — áudio/imagem guardam; STT + OCR + busca são o produto.
5. **Local-first (v1)** — dados no Mac/lab; cloud opcional depois.
6. **Contexto para agentes** — retrieval é feature de primeira classe.
7. **Privacidade** — pausa, exclusão, retenção; reunião = responsabilidade do operador.

## Escopo da visão (v1)

### Inclui
- Captura **mic** + **loopback desktop** (macOS primeiro)
- Captura de **tela** + **OCR** em mudança (e toggle periódico)
- Segmentação áudio (VAD) e eventos de tela (diff / hash)
- Persistência: áudio, frames, texto STT/OCR, metadados
- Busca por texto e intervalo de tempo (todas as fontes)
- API/CLI de retrieval para harness

### Fora (por enquanto)
- Diarização multi-speaker fina no desktop (v1.1+)
- Mobile nativo como capturador principal
- Edição estilo DAW / editor de vídeo
- Compartilhamento público de gravações

## Sucesso

- Feedback oral + tela do protótipo viram contexto acionável pela IA.
- Em call, lista o que o outro lado disse via trilha desktop.
- Histórico OCR responde “o que a tela mostrava em T”.
- Harness consulta `query` + `from`/`to` + `sources` e recebe trechos utilizáveis.

## Antes → depois

Sem produto → `context-recorder/` + board Trello + PRD/arquitetura/plano.  
**Rollback:** arquivar board; apagar `context-recorder/`; remover linha no README da workstation.
