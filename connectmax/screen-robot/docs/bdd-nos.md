# BDD — cenários por história (screen-robot)

**Por quê:** aceite de cada **US** e de cada **SC** em [`functionalities.md`](functionalities.md).  
**Integração:** [`bdd-linkedin-login.md`](bdd-linkedin-login.md).

Cada bloco usa Dado / Quando / Então alinhado a Entradas / Execução / Saídas.

---

## US-01 · Provisionar um agente

```gherkin
Funcionalidade: US-01 Provisionar um agente
  Cenário: Agent fica pronto para ADB
    Dado a config do dispositivo (device.config.json) e o runtime Android disponíveis
    Quando o provisionamento sobe/conecta o agent, garante serial online e aguarda boot completo
    Então o agent está pronto para ADB (serial online e boot ok)
```

### SC-01 Subir / conectar o Android (agent)

```gherkin
Cenário: SC-01 Agent sobe e fica alcançável
  Dado host, imagem/runtime e script de start
  Quando o agent é iniciado e a conexão é estabelecida
  Então o processo do agent está em execução e alcançável
```

### SC-02 Garantir serial ADB online

```gherkin
Cenário: SC-02 Serial ADB fica online
  Dado o agent alcançável e o serial esperado na config
  Quando adb connect / listagem de devices é repetida até o serial aparecer como device
  Então o serial ADB está online
```

### SC-03 Aguardar boot completo

```gherkin
Cenário: SC-03 Boot completo no device
  Dado o serial ADB online
  Quando o sistema faz poll de boot (ex. sys.boot_completed)
  Então o device reporta boot completo
```

---

## US-02 · Evento de boot

```gherkin
Funcionalidade: US-02 Evento de boot
  Cenário: Boot do device é sinalizado
    Dado o serial online
    Quando o sistema espera o sinal de boot
    Então o boot é sinalizado
```

### SC-04 Sinal de boot é recebido

```gherkin
Cenário: SC-04 Sinal de boot é recebido
  Dado o serial online
  Quando o listener aguarda o evento de boot
  Então o boot é sinalizado
```

---

## US-03 · Evento de app aberta

```gherkin
Funcionalidade: US-03 Evento de app aberta
  Cenário: App aberta é confirmada
    Dado o package em foreground esperado
    Quando o sistema espera a app em foreground
    Então a app aberta está confirmada
```

### SC-05 App em foreground é confirmada

```gherkin
Cenário: SC-05 App em foreground é confirmada
  Dado o package esperado em foreground
  Quando o sistema aguarda a app aberta
  Então a app está em foreground
```

---

## US-04 · Evento de tela estável

```gherkin
Funcionalidade: US-04 Evento de tela estável
  Cenário: Tela estável é confirmada
    Dado a app em foreground
    Quando o sistema espera UI estável (sem transição)
    Então a tela está estável
```

### SC-06 Tela fica estável

```gherkin
Cenário: SC-06 Tela fica estável
  Dado a app em foreground
  Quando o sistema aguarda ausência de transição de UI
  Então a tela está estável
```

---

## US-05 · Evento de mudança de dump

```gherkin
Funcionalidade: US-05 Evento de mudança de dump
  Cenário: Dump atualizado fica disponível
    Dado um dump anterior (opcional) e serial online
    Quando o sistema detecta mudança no dump de UI
    Então um dump atualizado está disponível
```

### SC-07 Dump de UI muda

```gherkin
Cenário: SC-07 Dump de UI muda
  Dado um dump anterior (ou ausência) e serial online
  Quando a hierarquia UI (uiautomator dump) muda em relação ao anterior
  Então um dump atualizado está disponível
```

---

## US-06 · Instalar APKs

```gherkin
Funcionalidade: US-06 Instalar APKs
  Cenário: Apps da config ficam instalados na versão definida
    Dado o agent provisionado e a lista de apps/versões na config
    Quando cada pacote é lido, baixado e instalado
    Então os apps estão instalados nas versões definidas
```

### SC-08 Ler versão na config do dispositivo

```gherkin
Cenário: SC-08 Versão e package são lidos da config
  Dado o arquivo device.config.json
  Quando apps.*.version e package são parseados
  Então a versão e o package alvo estão disponíveis para download
```

### SC-09 Baixar APK na versão definida

```gherkin
Cenário: SC-09 APK da versão pedida é baixado
  Dado package, versão e ferramenta de download (ex. apkeep)
  Quando o download da versão definida é executado
  Então o artefato APK/XAPK existe no disco
```

### SC-10 Instalar pacote no agent

```gherkin
Cenário: SC-10 Pacote é instalado no agent
  Dado serial online e caminho do APK
  Quando adb install (ou equivalente) é executado
  Então o pacote está instalado no agent
```

---

## US-07 · Abrir aplicativo

```gherkin
Funcionalidade: US-07 Abrir aplicativo
  Cenário: App fica em foreground no agent
    Dado package (e activity opcional)
    Quando o launch do app é executado no agent
    Então a app está em foreground
```

### SC-11 App é aberta no agent

```gherkin
Cenário: SC-11 App é aberta no agent
  Dado package (e activity opcional)
  Quando launch é executado
  Então a app está em foreground
```

---

## US-08 · tap

```gherkin
Funcionalidade: US-08 tap
  Cenário: UI reflete o toque
    Dado coordenadas x,y ou bounds do elemento
    Quando o toque na tela é executado
    Então a UI reflete o tap
```

### SC-12 Toque na tela

```gherkin
Cenário: SC-12 Toque na tela
  Dado coordenadas x,y ou bounds do elemento
  Quando tap é executado nesse alvo
  Então a UI reflete o toque
```

---

## US-09 · type

```gherkin
Funcionalidade: US-09 type
  Cenário: Texto aparece na UI
    Dado um texto e campo focado ou coords
    Quando digitar / injetar texto é executado
    Então o texto aparece na UI
```

### SC-13 Texto é digitado

```gherkin
Cenário: SC-13 Texto é digitado
  Dado um texto e campo focado ou coords
  Quando type injeta o texto
  Então o texto aparece na UI
```

---

## US-10 · scroll

```gherkin
Funcionalidade: US-10 scroll
  Cenário: Conteúdo da tela ou lista é rolado
    Dado direção (up/down/left/right), distância ou bounds da área
    Quando swipe / scroll é executado
    Então o conteúdo rolou e novos itens podem ficar visíveis
```

### SC-14 Conteúdo é rolado

```gherkin
Cenário: SC-14 Conteúdo é rolado
  Dado direção, distância ou bounds da área
  Quando scroll/swipe é executado
  Então o conteúdo rolou e novos itens podem ficar visíveis
```

---

## US-11 · screenshot

```gherkin
Funcionalidade: US-11 screenshot
  Cenário: Frame da tela é capturado
    Dado serial e path de saída
    Quando o frame da tela é capturado
    Então o arquivo de imagem existe
```

### SC-15 Print da tela é salvo

```gherkin
Cenário: SC-15 Print da tela é salvo
  Dado serial e path de saída
  Quando screenshot é capturado
  Então o arquivo de imagem existe no path
```

---

## US-12 · Resgatar coordenadas x,y

```gherkin
Funcionalidade: US-12 Resgatar coordenadas x,y
  Cenário: Coordenadas do alvo são devolvidas
    Dado imagem template e frame/tela atual
    Quando template match / visão na tela é executado
    Então coordenadas x,y (e confiança) são devolvidas
```

### SC-16 Coordenadas a partir de imagem template

```gherkin
Cenário: SC-16 Coordenadas a partir de imagem template
  Dado uma imagem de entrada (template) e o frame/tela atual
  Quando o match por visão/template é executado
  Então coordenadas x,y (e confiança) são devolvidas
```

---

## US-13 · Extrair elementos e guardar sessão

```gherkin
Funcionalidade: US-13 Extrair elementos e guardar sessão
  Cenário: Elementos tipados, árvore DOM e sessão
    Dado uma imagem da tela (screenshot/frame) ou dump
    E contexto atual (device, apps, etapa, paths)
    Quando OCR e reconhecimento extraem elementos tipados
    E a hierarquia raiz → filhos (árvore DOM) é composta
    E persistir e/ou restaurar sessão é executado
    Então elementos tipados existem com string/tipo, bounds e metadados
    E a árvore DOM navegável é devolvida
    E a sessão está em disco ou o contexto foi restaurado
```

### SC-17 Persistir sessão em arquivo

```gherkin
Cenário: SC-17 Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

### SC-18 Restaurar sessão do arquivo

```gherkin
Cenário: SC-18 Sessão é restaurada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```
