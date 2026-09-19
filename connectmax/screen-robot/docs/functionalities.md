# Funcionalidades — screen-robot

**Por quê:** capacidades observáveis do robô, todas expostas via **código Node**.  
**Origem:** [visão](../README.md).  
**Agente LinkedIn:** [`../../linkedin-agent/`](../../linkedin-agent/README.md).  
**Negócio:** [`../../vendas/`](../../vendas/README.md).

**IDs:** **US-** = história (uma ação/capacidade). **SC-** = cenário sob US-01, US-02 e US-13.  
Eventos e operações: **cada item é uma US**. Extração + sessão = **US-13 Extrair elementos e guardar sessão**.

| ID | Funcionalidade | Descrição | Min |
|----|----------------|-----------|-----|
| US-01 | Provisionar um agente | Sobe/conecta o Android e deixa o device pronto para ADB | 60 |
| US-02 | Instalar APKs | Baixa (versão na config) e instala pacotes no agent | 45 |
| US-03 | Evento de boot | Espera e confirma sinal de boot do device | 12 |
| US-04 | Evento de app aberta | Espera e confirma app em foreground | 12 |
| US-05 | Evento de tela estável | Espera UI estável (sem transição) | 12 |
| US-06 | Evento de mudança de dump | Detecta mudança no dump de UI (uiautomator) | 12 |
| US-07 | Abrir aplicativo | Launch de package/activity no agent | 15 |
| US-08 | tap | Toque em coords ou bounds | 15 |
| US-09 | type | Digitar / injetar texto | 15 |
| US-10 | scroll | Swipe / scroll na tela ou lista | 15 |
| US-11 | screenshot | Capturar frame da tela | 15 |
| US-12 | Resgatar coordenadas x,y | Localizar alvo na tela a partir de imagem de entrada | 15 |
| US-13 | Extrair elementos e guardar sessão | Elementos tipados + árvore DOM a partir da tela; persistir/restaurar sessão | 150 |

## Entradas · Execução · Saídas

### US-01 · Provisionar um agente (60 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Config do device (`device.config.json`), runtime Android disponível | Orquestrar subir/conectar, serial online e boot completo | Agent pronto para ADB (serial online, boot ok) |

#### SC-01.1 Subir / conectar o Android (agent) (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Host, imagem/runtime, script de start | Subir o agent e estabelecer conexão | Processo do agent em execução e alcançável |

#### SC-01.2 Garantir serial ADB online (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Agent alcançável, serial esperado na config | `adb connect` / listar devices até serial `device` | Serial ADB online |

#### SC-01.3 Aguardar boot completo (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online | Poll de boot/sys.boot_completed (ou equivalente) | Device com boot completo |

### US-02 · Instalar APKs (45 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Agent provisionado, lista de apps e versões na config | Ler versão, baixar e instalar cada pacote | Apps instalados nas versões definidas |

#### SC-02.1 Ler versão na config do dispositivo (5 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| `device.config.json` | Parsear `apps.*.version` / package | Versão e package alvo |

#### SC-02.2 Baixar APK na versão definida (25 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package + versão, ferramenta de download (ex. apkeep) | Baixar APK/XAPK da versão pedida | Artefato APK no disco |

#### SC-02.3 Instalar pacote no agent (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online, caminho do APK | `adb install` (ou equivalente) | Pacote instalado no agent |

### US-03 · Evento de boot (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online | Esperar sinal de boot | Boot sinalizado |

### US-04 · Evento de app aberta (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package em foreground esperado | Esperar app em foreground | App aberta confirmada |

### US-05 · Evento de tela estável (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| App em foreground | Esperar UI estável (sem transição) | Tela estável |

### US-06 · Evento de mudança de dump (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Dump anterior (opcional), serial | Detectar mudança no dump de UI | Dump atualizado disponível |

### US-07 · Abrir aplicativo (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package (e activity opcional) | Launch do app no agent | App em foreground |

### US-08 · tap (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Coordenadas x,y ou bounds do elemento | Toque na tela | UI refletindo o tap |

### US-09 · type (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Texto, campo focado ou coords | Digitar / injetar texto | Texto na UI |

### US-10 · scroll (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Direção (up/down/left/right), distância ou bounds da área | Swipe / scroll na tela ou na lista | Conteúdo rolado; novos itens visíveis |

### US-11 · screenshot (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial, path de saída | Capturar frame da tela | Arquivo de imagem |

### US-12 · Resgatar coordenadas x,y (imagem de entrada) (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem template, frame/tela atual | Template match / visão na tela | Coordenadas x,y (e confiança) |

### US-13 · Extrair elementos e guardar sessão (150 min)

Extrai elementos tipados **a partir de uma imagem**/frame/dump da tela (textos via OCR, ícones, imagens/fotos, listas, containers), monta a **árvore de componentes** (estilo DOM) e **persiste/restaura** o contexto da sessão.

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem da tela (screenshot/frame) ou dump; contexto (device, apps, etapa, paths) | OCR e reconhecimento de elementos; compor hierarquia; persistir/restaurar sessão | Elementos tipados + árvore DOM; sessão em disco / contexto restaurado |

#### SC-13.1 Persistir sessão em arquivo (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

#### SC-13.2 Restaurar sessão do arquivo (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

## Cenário de aceitação (integração)

Login no LinkedIn orquestrando as histórias:  
[`bdd-linkedin-login.md`](bdd-linkedin-login.md) · script [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js)

BDD por história/cenário: [`bdd-nos.md`](bdd-nos.md).

## Fora do escopo

- Cadência LinkedIn, fila de leads, faturamento, papéis de venda.
- Bypass de autenticação / scraping ilegítimo.

## Próximos passos

→ [`tasks.md`](tasks.md) → [`core/tasks`](../../../core/tasks/README.md#p1--connectmax--screen-robot)  
→ Implementação em [`../sources/android-control`](../sources/android-control/README.md)
