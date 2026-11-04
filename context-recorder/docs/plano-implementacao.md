# Plano de implementação — Context Recorder

**Por quê:** quebrar o MVP em fatias verificáveis (PoC → pipeline → retrieval).  
**PRD:** [`prd.md`](prd.md) · **Arquitetura:** [`arquitetura.md`](arquitetura.md)

**Antes → depois:** só docs → código por fases abaixo.  
**Rollback:** parar na última fase verde; apagar `capture/`/`api/`/`workers/` criados; manter docs.

---

## Princípio

1. **PoC de captura primeiro** (permissões macOS matam o resto se falharem).
2. **Texto antes de UI rica** — CLI + DB bastam para provar o exemplo Notinhas.
3. **Um canal por vez no código**, mas o modelo de dados já nasce multimodal.

---

## Fase 0 — Bootstrap (docs) ✅ em andamento

| Entrega | Critério |
|---------|----------|
| Visão + PRD + arquitetura + este plano | Pasta `context-recorder/` + board favorito |
| Card de análise no Trello | [Card](https://trello.com/c/LfLlu1CF) |

**Árvore:** só `README`, `docs/`, `config/`, `prompts/`.

---

## Fase 1 — PoC captura macOS

| Entrega | Critério de pronto |
|---------|-------------------|
| Mic → arquivo wav/opus + timestamp | 30s de fala gravados |
| Desktop/loopback → arquivo separado | Áudio de Meet/YouTube isolado do mic |
| Screenshot periódico | PNG/WebP em disco |
| Diff “tela mudou” | Log + frame só quando Δ >= threshold |

**Árvore:**

```text
capture/
  README.md
  src/…          # ou pacote Swift
  scripts/poc-mic.sh
  scripts/poc-desktop.sh
  scripts/poc-screen-diff.sh
```

**Riscos:** Screen Recording + system audio. Documentar permissões no README da fase.

---

## Fase 2 — Store + eventos

| Entrega | Critério |
|---------|----------|
| SQLite schema Session/Event | Migrations |
| Ingest dos arquivos da Fase 1 | Events `mic`/`desktop`/`screen_ocr` (text null) |
| CLI listar por tempo | `cr events --from --to` |

**Árvore:** `api/` (mínimo) ou `store/` + `cli/`.

---

## Fase 3 — Workers STT + OCR

| Entrega | Critério |
|---------|----------|
| Worker STT preenche `Event.text` por trilha | Mic e desktop em linhas distintas |
| Worker OCR em frames de mudança | Texto OCR buscável |
| Status pending→ready\|failed | Retry documentado |

**Árvore:** `workers/stt`, `workers/ocr`.

---

## Fase 4 — Busca + retrieval (harness)

| Entrega | Critério |
|---------|----------|
| FTS sobre textos | Busca acha termo falado e termo só na tela |
| `GET /context` ou `cr context` | Prompt-ready com labels de fonte/hora |
| Demo Notinhas | Gravar feedback oral + OCR do protótipo → retrieval injeta em prompt fake |

Aceite alinhado ao PRD §5 e §7.

---

## Fase 5 — Agente contínuo + toggles + retenção

| Entrega | Critério |
|---------|----------|
| Daemon com pause/resume e toggles mic/desktop/screen | PRD 4.1 / 4.6 |
| Debounce OCR + retenção | Disco estável |
| Delete sessão cascade | Sem órfãos |

---

## Fase 6 — UI mínima + polish (*should*)

- Status, timeline mista, busca.
- Thumbnails / play áudio.

---

## Fase 7 — v1.1 (fora do MVP)

- Embeddings, MCP Cursor, diarização, multi-monitor, denylist de apps.

---

## Ordem sugerida de tasks (Gantt lógico)

```text
F0 docs
 → F1 PoC mic
 → F1 PoC desktop (// mic se hardware ok)
 → F1 PoC screen-diff
 → F2 store
 → F3 STT
 → F3 OCR (// STT)
 → F4 FTS + context CLI
 → F5 daemon toggles
 → F6 UI (opcional)
```

Discovery fino (US/EP/SC) depois do aceite deste plano — pasta `docs/discovery/` na próxima leva.

---

## Dependências externas

| Dep | Para quê |
|-----|----------|
| Permissões macOS | Captura |
| Whisper (ou API) | STT |
| Vision/Tesseract | OCR |
| (opc) BlackHole / similar | Loopback se ScreenCaptureKit audio insuficiente |

---

## Definição de MVP “pronto”

Operador no Mac: captura ligada → fala sobre Notinhas → navega telas → `cr context --from … --to …` devolve STT mic + OCR relevantes → outro processo/IA consome esse texto sem o operador redigitar.
