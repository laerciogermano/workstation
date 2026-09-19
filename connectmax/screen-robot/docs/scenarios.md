# Cenários — screen-robot

**Por quê:** US e cenários (SC) do robô, todos expostos via **código Node**. BDDs: [`bdds.md`](bdds.md).  
**Origem:** [visão](../README.md).  
**Agente LinkedIn:** [`../../linkedin-agent/`](../../linkedin-agent/README.md).  
**Negócio:** [`../../vendas/`](../../vendas/README.md).  
**Estimativas (min):** [`tasks.md`](tasks.md).  
**Épicos / fases:** [`epics.md`](epics.md).  
**Vision:** [`vision.md`](vision.md).

**IDs:** **US-** = história · **SC-XX** = cenário sequencial (toda US tem ≥1 SC).

---

## US-01 — Provisionar um agente

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Config, runtime Android disponível | Orquestrar subir/conectar, serial online e boot completo | Agent pronto para ADB (serial online, boot ok) |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-01 | Subir / conectar o Android (agent) | Host, imagem/runtime, script de start | Subir o agent e estabelecer conexão | Processo do agent em execução e alcançável |
| SC-02 | Garantir serial ADB online | Agent alcançável, serial esperado na config | `adb connect` / listar devices até serial `device` | Serial ADB online |
| SC-03 | Aguardar boot completo | Serial online | Poll de boot/sys.boot_completed (ou equivalente) | Device com boot completo |

---

## US-02 — Evento de boot

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online | Esperar sinal de boot | Boot sinalizado |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-04 | Sinal de boot é recebido | Serial online | Listener aguarda o evento de boot | Boot sinalizado |

---

## US-03 — Evento de app aberta

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package em foreground esperado | Esperar app em foreground | App aberta confirmada |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-05 | App em foreground é confirmada | Package esperado em foreground | Aguardar app aberta | App em foreground |

---

## US-04 — Evento de tela estável

| Entradas | Execução | Saídas |
|----------|----------|--------|
| App em foreground | Esperar UI estável (sem transição) | Tela estável |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-06 | Tela fica estável | App em foreground | Aguardar ausência de transição de UI | Tela estável |

---

## US-05 — Evento de mudança de dump

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Dump anterior (opcional), serial | Detectar mudança no dump de UI | Dump atualizado disponível |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-07 | Dump de UI muda | Dump anterior (ou ausência), serial online | Detectar mudança no dump (uiautomator) | Dump atualizado disponível |

---

## US-06 — Instalar APKs

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Agent provisionado, lista de apps e versões na config | Ler versão, baixar e instalar cada pacote | Apps instalados nas versões definidas |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-08 | Ler versão na config do dispositivo | `device.config.json` | Parsear `apps.*.version` / package | Versão e package alvo |
| SC-09 | Baixar APK na versão definida | Package + versão, ferramenta de download (ex. apkeep) | Baixar APK/XAPK da versão pedida | Artefato APK no disco |
| SC-10 | Instalar pacote no agent | Serial online, caminho do APK | `adb install` (ou equivalente) | Pacote instalado no agent |

---

## US-07 — Abrir aplicativo

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package (e activity opcional) | Launch do app no agent | App em foreground |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-11 | App é aberta no agent | Package (e activity opcional) | Launch do app no agent | App em foreground |

---

## US-08 — tap

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Coordenadas x,y ou bounds do elemento | Toque na tela | UI refletindo o tap |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-12 | Toque na tela | Coordenadas x,y ou bounds do elemento | Tap no alvo | UI refletindo o toque |

---

## US-09 — type

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Texto, campo focado ou coords | Digitar / injetar texto | Texto na UI |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-13 | Texto é digitado | Texto, campo focado ou coords | Type injeta o texto | Texto na UI |

---

## US-10 — scroll

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Direção (up/down/left/right), distância ou bounds da área | Swipe / scroll na tela ou na lista | Conteúdo rolado; novos itens visíveis |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-14 | Conteúdo é rolado | Direção, distância ou bounds da área | Scroll/swipe | Conteúdo rolado; novos itens visíveis |

---

## US-11 — screenshot

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial, path de saída | Capturar frame da tela | Arquivo de imagem |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-15 | Print da tela é salvo | Serial, path de saída | Capturar screenshot | Arquivo de imagem no path |

---

## US-12 — Resgatar coordenadas x,y a partir de uma imagem

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem template, frame/tela atual | Template match / visão na tela | Coordenadas x,y (e confiança) |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-16 | Coordenadas a partir de imagem template | Imagem template, frame/tela atual | Match por visão/template | Coordenadas x,y (e confiança) |

---

## US-13 — Extrair elementos

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem da tela (screenshot/frame) ou dump | OCR e reconhecimento; compor hierarquia DOM | Elementos tipados + árvore DOM navegável |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-17 | Extrair elementos tipados e árvore DOM | Imagem/frame ou dump | OCR + reconhecimento; compor hierarquia | Elementos tipados + árvore DOM |

---

## US-14 — Salvar sessão

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-18 | Salvar sessão em arquivo | Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

---

## US-15 — Remover sessão

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Path da sessão (arquivo existente ou ausente) | Apagar arquivo / limpar contexto | Sessão removida (arquivo inexistente; runtime sem sessão) |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-19 | Remover sessão do disco | Path da sessão | Apagar arquivo de sessão | Arquivo inexistente; contexto limpo |

---

## US-16 — Recuperar sessão

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-20 | Recuperar sessão do arquivo | Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

---

## Aceite de integração

| Artefato | Caminho |
|----------|---------|
| BDDs (unitário + piloto LinkedIn) | [`bdds.md`](bdds.md) |
| Script | [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js) |

## Fora do escopo

| Item |
|------|
| Cadência LinkedIn, fila de leads, faturamento, papéis de venda |
| Bypass de autenticação / scraping ilegítimo |

## Próximos passos

→ [`tasks.md`](tasks.md) · [`core/tasks`](../../../core/tasks/README.md#p1--connectmax--screen-robot)  
→ Implementação em [`../sources/android-control`](../sources/android-control/README.md)
