# PRD — Context Recorder

**Produto:** Context Recorder  
**Status:** rascunho v1 (2026-11-04)  
**Visão:** [`../README.md`](../README.md) · **Arquitetura:** [`arquitetura.md`](arquitetura.md) · **Plano:** [`plano-implementacao.md`](plano-implementacao.md)  
**Board:** [Context Recorder](https://trello.com/b/lH0lCxXE/context-recorder)

---

## 1. Definição (o quê)

O **Context Recorder** é um sistema de **memória contínua multimodal**: grava **áudio do microfone** e **áudio do desktop** em trilhas separadas, tira **snapshots da tela**, extrai **OCR** (especialmente quando a tela muda), indexa tudo com horário e oferece **busca + retrieval** para humanos e para **IA / harness** — sem obrigar a redigitar o que já foi falado ou visto.

Não é “só voice recorder”: voz é um dos canais; **tela/OCR** é canal de primeira classe.

## 2. Problema

Ver [`../README.md`](../README.md). Em resumo: fala, interlocutores e estado visual da tela se perdem; o custo de recuperar isso para a IA é reescrever.

## 3. Personas

| Persona | Job |
|---------|-----|
| **Operador** | Liga captura; pausa; busca; pede à IA “usa o que falei / o que estava na tela” |
| **Participante de reunião** | Quer trilha desktop + mic separadas |
| **Agente / harness** | Chama API de retrieval com janela temporal e filtros de fonte |

## 4. Capacidades-alvo (must / should)

### 4.1 Sessão de captura — *must*
- Iniciar / pausar / retomar / parar captura.
- Indicador claro de estado (gravando / pausado / parado).
- Uma sessão tem `id`, `started_at`, `ended_at`, device (ex. Mac).

### 4.2 Áudio — microfone — *must*
- Capturar áudio do mic do dispositivo.
- Segmentar (VAD / silêncio) em **utterances** com timestamps.
- Transcrever (STT) cada segmento; gravar texto + path do áudio.
- Fonte lógica: `source=mic`.

### 4.3 Áudio — desktop / sistema — *must*
- Capturar **loopback** / áudio do desktop (calls, vídeo, apps).
- Mesma pipeline de segmentação + STT, fonte `source=desktop`.
- **Nunca** misturar mic e desktop na mesma linha de texto; linhas/registros distintos.
- Toggle: mic only / desktop only / ambos (default: ambos quando permissões ok).

### 4.4 Tela — screenshot — *must*
- Capturar frames da tela (display principal no MVP; multi-monitor *should*).
- Guardar imagem (ou referência) + timestamp + metadados (app em foco se disponível).

### 4.5 Tela — OCR em mudança — *must*
- Detectar **mudança de tela** (diff perceptual / hash de blocos / threshold configurável).
- Em mudança relevante: novo snapshot → **OCR** → persistir texto OCR + link ao frame.
- Também permitir captura OCR periódica (intervalo configurável) como fallback.
- Fonte lógica: `source=screen_ocr` (e opcionalmente `screen_image` para o binário).

### 4.6 Opções / toggles do sistema — *must*
- Liga/desliga independente: **mic**, **desktop audio**, **screenshot/OCR**.
- Sensibilidade de “mudança de tela” e intervalo mínimo entre OCRs (debounce).
- Idioma(s) STT/OCR (pt-BR default no lab).

### 4.7 Persistência e modelo de evento — *must*
Todo evento na base com no mínimo:
- `id`, `session_id`, `source` (`mic` | `desktop` | `screen_ocr`), `started_at`, `ended_at` (se aplicável)
- `text` (STT ou OCR; pode ser vazio se pending)
- `media_path` (áudio ou imagem)
- `meta` (app focus, display id, confidence, etc.)

### 4.8 Busca — *must*
- Full-text sobre `text` de todas as fontes.
- Filtro por `source`, intervalo de tempo, `session_id`.
- Resultado com trecho + timestamp + source + link à mídia.

### 4.9 Retrieval para IA / harness — *must*
- API/CLI: `query` + `from`/`to` + `sources[]` + `limit` → lista de segmentos ordenados no tempo.
- Formato pronto para injeção em prompt (texto concatenado com cabeçalhos de fonte/hora).
- Contrato estável documentado em arquitetura (MCP / HTTP depois).

### 4.10 Privacidade e retenção — *must*
- Pausa global (para de capturar tudo).
- Excluir sessão / intervalo / evento.
- Política de retenção configurável (dias); default documentado.

### 4.11 macOS como alvo v1 — *must*
- App ou daemon de captura no Mac (permissões: mic, screen recording, system audio conforme stack).
- Linux/Windows / mobile: *should* / depois.

### 4.12 UI mínima — *should* (MVP enxuto)
- Status + toggles + lista cronológica mista (áudio+OCR) + busca.
- Player/preview de áudio e thumbnail de frame *should*.

### 4.13 Diarização multi-speaker no desktop — *should* (v1.1)
- Além de `desktop`, tentar separar falantes; v1 basta fonte `desktop`.

### 4.14 Embeddings / busca semântica — *should* (v1.1)
- Vetores sobre STT+OCR; hybrid search.

### 4.15 Metadados de app / URL — *should*
- App em foco, título da janela, URL do browser quando possível — amarra exemplo Notinhas.

## 5. Histórias de uso (aceitação narrativa)

1. **Protótipo Notinhas** — Operador com captura ligada fala mudanças olhando a tela; depois pede à IA “aplica o que falei sobre o Notinhas entre 8h50 e 9h00”; retrieval devolve STT `mic` (+ OCR da tela se o protótipo estava visível).
2. **Reunião** — Desktop + mic ligados; busca “prazo” filtra linhas `desktop` e `mic` separadas.
3. **OCR em mudança** — Navega 3 telas do app; base ganha ≥1 evento `screen_ocr` por mudança relevante, com textos distintos.
4. **Pausa** — Em pausa, nenhum áudio/OCR novo; retoma sem nova sessão obrigatória (mesma sessão ou política documentada).

## 6. Não-objetivos (v1)

- Rede social / compartilhar gravações publicamente
- Substituto completo de Zoom recorder cloud
- Editor de vídeo/timeline profissional
- Captura de teclado/keylogger (explicitamente fora)
- Gravar conteúdo DRM / forçar bypass de proteção de áudio de apps

## 7. Critérios de sucesso (MVP)

1. Sessão com mic+desktop gera linhas STT separadas por `source`.
2. Mudança de tela gera novo registro OCR na base (debounce respeitado).
3. Busca encontra termo falado e termo que só apareceu na tela (OCR).
4. CLI/API de retrieval devolve bloco de contexto utilizável por um agente.
5. Pausa e exclusão de sessão funcionam sem lixo órfão documentado.

## 8. Métricas (qualitativas v1)

- Tempo até “primeiro contexto útil” após instalar < 15 min (permisões inclusas).
- Zero necessidade de redigitar o feedback oral do exemplo Notinhas para a IA agir.
- Taxa de eventos OCR espúrios (tela “mudou” sem mudança real) dentro de limiar configurável.

## 9. Riscos

| Risco | Mitigação |
|-------|-----------|
| Permissões macOS (Screen Recording, mic, system audio) frágeis | Doc de setup; falhar visível; toggles por canal |
| Volume de disco (áudio + frames) | Retenção; JPEG/WebP; OCR text-first; amostragem |
| OCR ruidoso / falso positivo de “mudança” | Threshold + debounce; guardar hash; UI de sensibilidade |
| Privacidade em reuniões | Pausa fácil; default local; aviso na visão |
| Escopo “gravar o mundo” | PRD must/should; config-ia bloqueia keylogger / mobile sem pedido |

## 10. Roadmap de produto (alto nível)

| Fase | Entrega |
|------|---------|
| **MVP** | Captura macOS mic+desktop+screen/OCR-on-change · persistência · busca FTS · retrieval CLI/API · pausa/delete |
| **v1.1** | Embeddings · diarização leve · multi-monitor · metadados app/URL · MCP Cursor |
| **v1.2** | UI timeline rica · políticas por app (não gravar X) · sync opcional |

## Rollback documental

```bash
rm -rf context-recorder/
# reverter linha Context Recorder no README.md da workstation
# arquivar board https://trello.com/b/lH0lCxXE/context-recorder
```
