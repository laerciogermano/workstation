# Funcionalidades — screen-robot

**Por quê:** capacidades observáveis do robô, todas expostas via **código Node**.  
**Origem:** [visão](../README.md).  
**Agente LinkedIn:** [`../../linkedin-agent/`](../../linkedin-agent/README.md).  
**Negócio:** [`../../vendas/`](../../vendas/README.md).  
**Estimativas (min):** [`tasks.md`](tasks.md).  
**Vision:** [`vision.md`](vision.md).

**IDs:** **US-** = história · **SC-XX** = cenário sequencial (toda US tem ≥1 SC).

| ID | Funcionalidade |
|----|----------------|
| [US-01](#us-01--provisionar-um-agente) | Provisionar um agente |
| [US-02](#us-02--evento-de-boot) | Evento de boot |
| [US-03](#us-03--evento-de-app-aberta) | Evento de app aberta |
| [US-04](#us-04--evento-de-tela-estável) | Evento de tela estável |
| [US-05](#us-05--evento-de-mudança-de-dump) | Evento de mudança de dump |
| [US-06](#us-06--instalar-apks) | Instalar APKs |
| [US-07](#us-07--abrir-aplicativo) | Abrir aplicativo |
| [US-08](#us-08--tap) | tap |
| [US-09](#us-09--type) | type |
| [US-10](#us-10--scroll) | scroll |
| [US-11](#us-11--screenshot) | screenshot |
| [US-12](#us-12--resgatar-coordenadas-xy-a-partir-de-uma-imagem) | Resgatar coordenadas x,y a partir de uma imagem |
| [US-13](#us-13--extrair-elementos) | Extrair elementos |
| [US-14](#us-14--salvar-sessão) | Salvar sessão |
| [US-15](#us-15--remover-sessão) | Remover sessão |
| [US-16](#us-16--recuperar-sessão) | Recuperar sessão |

---

## US-01 — Provisionar um agente

Sobe/conecta o Android e deixa o device pronto para ADB.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Config do device (`device.config.json`), runtime Android disponível | Orquestrar subir/conectar, serial online e boot completo | Agent pronto para ADB (serial online, boot ok) |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-01 | Subir / conectar o Android (agent) | Host, imagem/runtime, script de start | Subir o agent e estabelecer conexão | Processo do agent em execução e alcançável |
| SC-02 | Garantir serial ADB online | Agent alcançável, serial esperado na config | `adb connect` / listar devices até serial `device` | Serial ADB online |
| SC-03 | Aguardar boot completo | Serial online | Poll de boot/sys.boot_completed (ou equivalente) | Device com boot completo |

### BDD

```gherkin
Funcionalidade: US-01 Provisionar um agente
  Cenário: Agent fica pronto para ADB
    Dado a config do dispositivo (device.config.json) e o runtime Android disponíveis
    Quando o provisionamento sobe/conecta o agent, garante serial online e aguarda boot completo
    Então o agent está pronto para ADB (serial online e boot ok)
```

#### SC-01 Subir / conectar o Android (agent)

```gherkin
Cenário: SC-01 Agent sobe e fica alcançável
  Dado host, imagem/runtime e script de start
  Quando o agent é iniciado e a conexão é estabelecida
  Então o processo do agent está em execução e alcançável
```

#### SC-02 Garantir serial ADB online

```gherkin
Cenário: SC-02 Serial ADB fica online
  Dado o agent alcançável e o serial esperado na config
  Quando adb connect / listagem de devices é repetida até o serial aparecer como device
  Então o serial ADB está online
```

#### SC-03 Aguardar boot completo

```gherkin
Cenário: SC-03 Boot completo no device
  Dado o serial ADB online
  Quando o sistema faz poll de boot (ex. sys.boot_completed)
  Então o device reporta boot completo
```

---

## US-02 — Evento de boot

Espera e confirma sinal de boot do device.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online | Esperar sinal de boot | Boot sinalizado |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-04 | Sinal de boot é recebido | Serial online | Listener aguarda o evento de boot | Boot sinalizado |

### BDD

```gherkin
Funcionalidade: US-02 Evento de boot
  Cenário: Boot do device é sinalizado
    Dado o serial online
    Quando o sistema espera o sinal de boot
    Então o boot é sinalizado
```

#### SC-04 Sinal de boot é recebido

```gherkin
Cenário: SC-04 Sinal de boot é recebido
  Dado o serial online
  Quando o listener aguarda o evento de boot
  Então o boot é sinalizado
```

---

## US-03 — Evento de app aberta

Espera e confirma app em foreground.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package em foreground esperado | Esperar app em foreground | App aberta confirmada |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-05 | App em foreground é confirmada | Package esperado em foreground | Aguardar app aberta | App em foreground |

### BDD

```gherkin
Funcionalidade: US-03 Evento de app aberta
  Cenário: App aberta é confirmada
    Dado o package em foreground esperado
    Quando o sistema espera a app em foreground
    Então a app aberta está confirmada
```

#### SC-05 App em foreground é confirmada

```gherkin
Cenário: SC-05 App em foreground é confirmada
  Dado o package esperado em foreground
  Quando o sistema aguarda a app aberta
  Então a app está em foreground
```

---

## US-04 — Evento de tela estável

Espera UI estável (sem transição).

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| App em foreground | Esperar UI estável (sem transição) | Tela estável |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-06 | Tela fica estável | App em foreground | Aguardar ausência de transição de UI | Tela estável |

### BDD

```gherkin
Funcionalidade: US-04 Evento de tela estável
  Cenário: Tela estável é confirmada
    Dado a app em foreground
    Quando o sistema espera UI estável (sem transição)
    Então a tela está estável
```

#### SC-06 Tela fica estável

```gherkin
Cenário: SC-06 Tela fica estável
  Dado a app em foreground
  Quando o sistema aguarda ausência de transição de UI
  Então a tela está estável
```

---

## US-05 — Evento de mudança de dump

Detecta mudança no dump de UI (uiautomator).

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Dump anterior (opcional), serial | Detectar mudança no dump de UI | Dump atualizado disponível |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-07 | Dump de UI muda | Dump anterior (ou ausência), serial online | Detectar mudança no dump (uiautomator) | Dump atualizado disponível |

### BDD

```gherkin
Funcionalidade: US-05 Evento de mudança de dump
  Cenário: Dump atualizado fica disponível
    Dado um dump anterior (opcional) e serial online
    Quando o sistema detecta mudança no dump de UI
    Então um dump atualizado está disponível
```

#### SC-07 Dump de UI muda

```gherkin
Cenário: SC-07 Dump de UI muda
  Dado um dump anterior (ou ausência) e serial online
  Quando a hierarquia UI (uiautomator dump) muda em relação ao anterior
  Então um dump atualizado está disponível
```

---

## US-06 — Instalar APKs

Baixa (versão na config) e instala pacotes no agent.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Agent provisionado, lista de apps e versões na config | Ler versão, baixar e instalar cada pacote | Apps instalados nas versões definidas |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-08 | Ler versão na config do dispositivo | `device.config.json` | Parsear `apps.*.version` / package | Versão e package alvo |
| SC-09 | Baixar APK na versão definida | Package + versão, ferramenta de download (ex. apkeep) | Baixar APK/XAPK da versão pedida | Artefato APK no disco |
| SC-10 | Instalar pacote no agent | Serial online, caminho do APK | `adb install` (ou equivalente) | Pacote instalado no agent |

### BDD

```gherkin
Funcionalidade: US-06 Instalar APKs
  Cenário: Apps da config ficam instalados na versão definida
    Dado o agent provisionado e a lista de apps/versões na config
    Quando cada pacote é lido, baixado e instalado
    Então os apps estão instalados nas versões definidas
```

#### SC-08 Ler versão na config do dispositivo

```gherkin
Cenário: SC-08 Versão e package são lidos da config
  Dado o arquivo device.config.json
  Quando apps.*.version e package são parseados
  Então a versão e o package alvo estão disponíveis para download
```

#### SC-09 Baixar APK na versão definida

```gherkin
Cenário: SC-09 APK da versão pedida é baixado
  Dado package, versão e ferramenta de download (ex. apkeep)
  Quando o download da versão definida é executado
  Então o artefato APK/XAPK existe no disco
```

#### SC-10 Instalar pacote no agent

```gherkin
Cenário: SC-10 Pacote é instalado no agent
  Dado serial online e caminho do APK
  Quando adb install (ou equivalente) é executado
  Então o pacote está instalado no agent
```

---

## US-07 — Abrir aplicativo

Launch de package/activity no agent.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package (e activity opcional) | Launch do app no agent | App em foreground |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-11 | App é aberta no agent | Package (e activity opcional) | Launch do app no agent | App em foreground |

### BDD

```gherkin
Funcionalidade: US-07 Abrir aplicativo
  Cenário: App fica em foreground no agent
    Dado package (e activity opcional)
    Quando o launch do app é executado no agent
    Então a app está em foreground
```

#### SC-11 App é aberta no agent

```gherkin
Cenário: SC-11 App é aberta no agent
  Dado package (e activity opcional)
  Quando launch é executado
  Então a app está em foreground
```

---

## US-08 — tap

Toque em coords ou bounds.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Coordenadas x,y ou bounds do elemento | Toque na tela | UI refletindo o tap |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-12 | Toque na tela | Coordenadas x,y ou bounds do elemento | Tap no alvo | UI refletindo o toque |

### BDD

```gherkin
Funcionalidade: US-08 tap
  Cenário: UI reflete o toque
    Dado coordenadas x,y ou bounds do elemento
    Quando o toque na tela é executado
    Então a UI reflete o tap
```

#### SC-12 Toque na tela

```gherkin
Cenário: SC-12 Toque na tela
  Dado coordenadas x,y ou bounds do elemento
  Quando tap é executado nesse alvo
  Então a UI reflete o toque
```

---

## US-09 — type

Digitar / injetar texto.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Texto, campo focado ou coords | Digitar / injetar texto | Texto na UI |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-13 | Texto é digitado | Texto, campo focado ou coords | Type injeta o texto | Texto na UI |

### BDD

```gherkin
Funcionalidade: US-09 type
  Cenário: Texto aparece na UI
    Dado um texto e campo focado ou coords
    Quando digitar / injetar texto é executado
    Então o texto aparece na UI
```

#### SC-13 Texto é digitado

```gherkin
Cenário: SC-13 Texto é digitado
  Dado um texto e campo focado ou coords
  Quando type injeta o texto
  Então o texto aparece na UI
```

---

## US-10 — scroll

Swipe / scroll na tela ou lista.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Direção (up/down/left/right), distância ou bounds da área | Swipe / scroll na tela ou na lista | Conteúdo rolado; novos itens visíveis |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-14 | Conteúdo é rolado | Direção, distância ou bounds da área | Scroll/swipe | Conteúdo rolado; novos itens visíveis |

### BDD

```gherkin
Funcionalidade: US-10 scroll
  Cenário: Conteúdo da tela ou lista é rolado
    Dado direção (up/down/left/right), distância ou bounds da área
    Quando swipe / scroll é executado
    Então o conteúdo rolou e novos itens podem ficar visíveis
```

#### SC-14 Conteúdo é rolado

```gherkin
Cenário: SC-14 Conteúdo é rolado
  Dado direção, distância ou bounds da área
  Quando scroll/swipe é executado
  Então o conteúdo rolou e novos itens podem ficar visíveis
```

---

## US-11 — screenshot

Capturar frame da tela.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial, path de saída | Capturar frame da tela | Arquivo de imagem |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-15 | Print da tela é salvo | Serial, path de saída | Capturar screenshot | Arquivo de imagem no path |

### BDD

```gherkin
Funcionalidade: US-11 screenshot
  Cenário: Frame da tela é capturado
    Dado serial e path de saída
    Quando o frame da tela é capturado
    Então o arquivo de imagem existe
```

#### SC-15 Print da tela é salvo

```gherkin
Cenário: SC-15 Print da tela é salvo
  Dado serial e path de saída
  Quando screenshot é capturado
  Então o arquivo de imagem existe no path
```

---

## US-12 — Resgatar coordenadas x,y a partir de uma imagem

Resgata as coordenadas x,y na tela a partir de uma imagem de entrada (template).

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem template, frame/tela atual | Template match / visão na tela | Coordenadas x,y (e confiança) |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-16 | Coordenadas a partir de imagem template | Imagem template, frame/tela atual | Match por visão/template | Coordenadas x,y (e confiança) |

### BDD

```gherkin
Funcionalidade: US-12 Resgatar coordenadas x,y a partir de uma imagem
  Cenário: Coordenadas do alvo são devolvidas
    Dado uma imagem de entrada e o frame/tela atual
    Quando o match por visão/template é executado
    Então as coordenadas x,y (e confiança) são devolvidas
```

#### SC-16 Coordenadas a partir de imagem template

```gherkin
Cenário: SC-16 Coordenadas a partir de imagem template
  Dado uma imagem de entrada (template) e o frame/tela atual
  Quando o match por visão/template é executado
  Então coordenadas x,y (e confiança) são devolvidas
```

---

## US-13 — Extrair elementos

Extrai elementos tipados a partir da tela e monta a árvore DOM.

A partir de uma imagem/frame ou dump, reconhece textos (OCR), ícones, imagens/fotos, listas e containers e compõe a hierarquia raiz → filhos (estilo DOM).

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem da tela (screenshot/frame) ou dump | OCR e reconhecimento de elementos; compor hierarquia | Elementos tipados + árvore DOM navegável |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-17 | Extrair elementos tipados e árvore DOM | Imagem/frame ou dump | OCR + reconhecimento; compor hierarquia | Elementos tipados + árvore DOM |

### BDD

```gherkin
Funcionalidade: US-13 Extrair elementos
  Cenário: Elementos tipados e árvore DOM
    Dado uma imagem da tela (screenshot/frame) ou dump
    Quando OCR e reconhecimento extraem elementos tipados
    E a hierarquia raiz → filhos (árvore DOM) é composta
    Então elementos tipados existem com string/tipo, bounds e metadados
    E a árvore DOM navegável é devolvida
```

#### SC-17 Extrair elementos tipados e árvore DOM

```gherkin
Cenário: SC-17 Elementos tipados e árvore DOM
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando OCR e reconhecimento extraem elementos tipados
  E a hierarquia raiz → filhos é composta
  Então elementos tipados existem com string/tipo, bounds e metadados
  E a árvore DOM navegável é devolvida
```

---

## US-14 — Salvar sessão

Persiste o contexto da sessão em arquivo.

Serializa o estado em memória (device, apps, etapa, paths, etc.) e grava no path da sessão.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-18 | Salvar sessão em arquivo | Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

### BDD

```gherkin
Funcionalidade: US-14 Salvar sessão
  Cenário: Sessão é gravada em disco
    Dado estado em memória e path da sessão
    Quando a serialização grava o arquivo
    Então o arquivo de sessão existe
```

#### SC-18 Salvar sessão em arquivo

```gherkin
Cenário: SC-18 Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

---

## US-15 — Remover sessão

Remove a sessão persistida em disco (e limpa o contexto em memória quando couber).

Apaga o arquivo de sessão no path configurado e deixa o runtime sem aquele contexto salvo.

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Path da sessão (arquivo existente ou ausente) | Apagar arquivo / limpar contexto | Sessão removida (arquivo inexistente; runtime sem sessão) |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-19 | Remover sessão do disco | Path da sessão | Apagar arquivo de sessão | Arquivo inexistente; contexto limpo |

### BDD

```gherkin
Funcionalidade: US-15 Remover sessão
  Cenário: Sessão é removida
    Dado um path de sessão
    Quando a remoção da sessão é executada
    Então o arquivo de sessão não existe
    E o runtime não mantém o contexto daquela sessão
```

#### SC-19 Remover sessão do disco

```gherkin
Cenário: SC-19 Sessão é removida do disco
  Dado um path de sessão
  Quando o arquivo de sessão é apagado
  Então o arquivo de sessão não existe
```

---

## US-16 — Recuperar sessão

Recupera o contexto da sessão a partir do arquivo em disco.

Lê o arquivo de sessão e reaplica o estado no runtime (device, apps, etapa, paths, etc.).

### Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

### Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-20 | Recuperar sessão do arquivo | Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

### BDD

```gherkin
Funcionalidade: US-16 Recuperar sessão
  Cenário: Sessão é recuperada
    Dado um arquivo de sessão existente
    Quando a leitura reaplica o contexto
    Então o runtime possui o estado restaurado
```

#### SC-20 Recuperar sessão do arquivo

```gherkin
Cenário: SC-20 Sessão é recuperada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```

---

## Aceite de integração

[`bdd-linkedin-login.md`](bdd-linkedin-login.md) · script [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js)

BDD consolidado (legado): [`bdd-nos.md`](bdd-nos.md).

## Fora do escopo

- Cadência LinkedIn, fila de leads, faturamento, papéis de venda.
- Bypass de autenticação / scraping ilegítimo.

## Próximos passos

→ [`tasks.md`](tasks.md) · [`core/tasks`](../../../core/tasks/README.md#p1--connectmax--screen-robot)  
→ Implementação em [`../sources/android-control`](../sources/android-control/README.md)
