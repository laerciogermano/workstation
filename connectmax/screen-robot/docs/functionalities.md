# Funcionalidades — screen-robot

**Por quê:** capacidades observáveis do robô, todas expostas via **código Node**.  
**Origem:** [visão](../README.md).  
**Agente LinkedIn:** [`../../linkedin-agent/`](../../linkedin-agent/README.md).  
**Negócio:** [`../../vendas/`](../../vendas/README.md).

| Funcionalidade | Descrição |
|----------------|-----------|
| Provisionar um agente | Sobe/conecta o Android (agent) e deixa o device pronto para ADB (serial online, boot completo) |
| Instalar APKs | Baixa (versão definida na config do dispositivo) e instala pacotes no agent |
| Receber eventos | Observa e espera sinais do device/UI (boot, app aberta, tela estável, mudança de dump) |
| Executar operações | Dispara gestos e comandos (abrir aplicativo, tap, type, key, scroll, screenshot) e **rescata coordenadas x,y** a partir de uma imagem de entrada |
| Extrair elementos e informações | Lê a tela e devolve a UI como **árvore de componentes** (estilo DOM): textos, ícones, imagens, fotos, **listas** e demais nós, com bounds e metadados |
| Guardar estado de sessão | Persiste e restaura contexto da sessão (device, apps, último frame, login parcial) em arquivo |

### Extrair elementos e informações

Lê a tela (dump / OCR / visão) e devolve a hierarquia da UI como **árvore de componentes**, análoga a um DOM: cada nó tem tipo, bounds, metadados e filhos.

| Tipo de nó | Conteúdo típico |
|------------|-----------------|
| Texto | String visível (OCR ou atributo de acessibilidade) |
| Ícone | Controle/pictograma reconhecido (ex.: lupa, menu, coração) |
| Imagem / foto | Região de mídia (avatar, banner, foto de perfil) |
| Lista | Coleção rolável/repetível de itens (cada item é um filho na árvore) |
| Container | Agrupador (card, toolbar, painel) com filhos |
| Outros | Botões, campos, links e nós genéricos com papel na UI |

A saída é a **árvore completa** (raiz → filhos), não só uma lista plana — quem consome navega como em um DOM. Listas entram como nós com itens filhos (e metadados de scroll quando houver).

## Entradas · Execução · Saídas (por nó)

#### 1. Provisionar um agente (60 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Config do device (`device.config.json`), runtime Android disponível | Orquestrar subir/conectar, serial online e boot completo | Agent pronto para ADB (serial online, boot ok) |

##### 1.1 Subir / conectar o Android (agent) (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Host, imagem/runtime, script de start | Subir o agent e estabelecer conexão | Processo do agent em execução e alcançável |

##### 1.2 Garantir serial ADB online (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Agent alcançável, serial esperado na config | `adb connect` / listar devices até serial `device` | Serial ADB online |

##### 1.3 Aguardar boot completo (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online | Poll de boot/sys.boot_completed (ou equivalente) | Device com boot completo |

#### 2. Instalar APKs (45 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Agent provisionado, lista de apps e versões na config | Ler versão, baixar e instalar cada pacote | Apps instalados nas versões definidas |

##### 2.1 Ler versão na config do dispositivo (5 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| `device.config.json` | Parsear `apps.*.version` / package | Versão e package alvo |

##### 2.2 Baixar APK na versão definida (25 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package + versão, ferramenta de download (ex. apkeep) | Baixar APK/XAPK da versão pedida | Artefato APK no disco |

##### 2.3 Instalar pacote no agent (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online, caminho do APK | `adb install` (ou equivalente) | Pacote instalado no agent |

#### 3. Receber eventos (48 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online, critérios de espera | Observar e aguardar sinais de boot, app, UI e dump | Evento confirmado (estado estável para o próximo passo) |

##### 3.1 Evento de boot (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online | Esperar sinal de boot | Boot sinalizado |

##### 3.2 Evento de app aberta (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package em foreground esperado | Esperar app em foreground | App aberta confirmada |

##### 3.3 Evento de tela estável (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| App em foreground | Esperar UI estável (sem transição) | Tela estável |

##### 3.4 Evento de mudança de dump (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Dump anterior (opcional), serial | Detectar mudança no dump de UI | Dump atualizado disponível |

#### 4. Executar operações (105 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online, alvo (package/coords/elemento/imagem) | Disparar abrir app, gestos, scroll, teclas, print e match por imagem | Ação aplicada no device; coords ou artefato quando couber |

##### 4.1 Abrir aplicativo (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package (e activity opcional) | Launch do app no agent | App em foreground |

##### 4.2 tap (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Coordenadas x,y ou bounds do elemento | Toque na tela | UI refletindo o tap |

##### 4.3 type (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Texto, campo focado ou coords | Digitar / injetar texto | Texto na UI |

##### 4.4 key (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Código de tecla (ex. ENTER, BACK) | Enviar keyevent | Tecla processada |

##### 4.5 scroll (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Direção (up/down/left/right), distância ou bounds da área | Swipe / scroll na tela ou na lista | Conteúdo rolado; novos itens visíveis |

##### 4.6 screenshot (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial, path de saída | Capturar frame da tela | Arquivo de imagem |

##### 4.7 Resgatar coordenadas x,y (imagem de entrada) (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem template, frame/tela atual | Template match / visão na tela | Coordenadas x,y (e confiança) |

#### 5. Extrair elementos e informações (120 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Frame/dump da tela estável | Extrair textos, ícones, imagens, listas, containers e montar DOM | Árvore de componentes (estilo DOM) |

##### 5.1 Nó Texto (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Frame/dump | OCR / atributo de texto | Nós de texto com string e bounds |

##### 5.2 Nó Ícone (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Frame/dump | Reconhecer pictogramas/controles | Nós de ícone com tipo e bounds |

##### 5.3 Nó Imagem / foto (24 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Frame/dump | Detectar regiões de mídia | Nós imagem/foto com bounds |

##### 5.4 Nó Lista (itens filhos + scroll) (24 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Frame/dump | Identificar coleção rolável e itens | Nó lista com filhos e metadados de scroll |

##### 5.5 Nó Container (12 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Frame/dump | Agrupar card/toolbar/painel | Nós container com filhos |

##### 5.6 Montar árvore DOM (raiz → filhos) (20 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Nós tipados (texto, ícone, imagem, lista, container) | Compor hierarquia raiz → filhos | Árvore DOM navegável |

#### 6. Guardar estado de sessão (30 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Contexto atual (device, apps, etapa, paths) | Persistir e/ou restaurar arquivo de sessão | Sessão em disco / contexto restaurado |

##### 6.1 Persistir sessão em arquivo (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

##### 6.2 Restaurar sessão do arquivo (15 min)

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

## Cenário de aceitação (funcionalidade maior)

Login no LinkedIn orquestrando as seis fatias:  
[`bdd-linkedin-login.md`](bdd-linkedin-login.md) · script [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js)

BDD por nó da árvore: [`bdd-nos.md`](bdd-nos.md).

## Fora do escopo

- Cadência LinkedIn, fila de leads, faturamento, papéis de venda.
- Bypass de autenticação / scraping ilegítimo.

## Próximos passos

→ [`tasks.md`](tasks.md) → [`core/tasks`](../../../core/tasks/README.md#p1--connectmax--screen-robot) — árvore, Gantt e kanban  
→ Implementação em [`../sources/android-control`](../sources/android-control/README.md)
