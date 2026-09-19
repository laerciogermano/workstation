# BDD — cenários por história (screen-robot)

**Por quê:** aceite de cada **US** (e **SC** sob US-01, US-02, US-13).  
**Funcionalidades:** [`functionalities.md`](functionalities.md).  
**Integração:** [`bdd-linkedin-login.md`](bdd-linkedin-login.md).

---

## US-01 · Provisionar um agente

```gherkin
Funcionalidade: Provisionar um agente
  Cenário: Agent fica pronto para ADB
    Dado a config do dispositivo e o runtime Android disponíveis
    Quando o provisionamento sobe, conecta, garante serial online e aguarda boot
    Então o agent está pronto (serial online e boot completo)
```

### SC-01.1 Subir / conectar o Android (agent)

```gherkin
Cenário: Agent sobe e fica alcançável
  Dado host, imagem/runtime e script de start
  Quando o agent é iniciado e a conexão é estabelecida
  Então o processo do agent está em execução e alcançável
```

### SC-01.2 Garantir serial ADB online

```gherkin
Cenário: Serial ADB fica online
  Dado o agent alcançável e o serial esperado na config
  Quando adb connect / listagem de devices é repetida até o serial aparecer como device
  Então o serial ADB está online
```

### SC-01.3 Aguardar boot completo

```gherkin
Cenário: Boot completo no device
  Dado o serial ADB online
  Quando o sistema faz poll de boot (ex. sys.boot_completed)
  Então o device reporta boot completo
```

---

## US-02 · Instalar APKs

```gherkin
Funcionalidade: Instalar APKs
  Cenário: Apps da config ficam instalados na versão definida
    Dado o agent provisionado e a lista de apps/versões na config
    Quando cada pacote é resolvido, baixado e instalado
    Então os apps estão instalados nas versões definidas
```

### SC-02.1 Ler versão na config do dispositivo

```gherkin
Cenário: Versão e package são lidos da config
  Dado o arquivo device.config.json
  Quando apps.*.version e package são parseados
  Então a versão e o package alvo estão disponíveis para download
```

### SC-02.2 Baixar APK na versão definida

```gherkin
Cenário: APK da versão pedida é baixado
  Dado package, versão e ferramenta de download
  Quando o download da versão definida é executado
  Então o artefato APK/XAPK existe no disco
```

### SC-02.3 Instalar pacote no agent

```gherkin
Cenário: Pacote é instalado no agent
  Dado serial online e caminho do APK
  Quando adb install (ou equivalente) é executado
  Então o pacote está instalado no agent
```

---

## US-03 · Evento de boot

```gherkin
Funcionalidade: Evento de boot
  Cenário: Sinal de boot é recebido
    Dado serial online
    Quando o listener aguarda o evento de boot
    Então o boot é sinalizado
```

## US-04 · Evento de app aberta

```gherkin
Funcionalidade: Evento de app aberta
  Cenário: App em foreground é confirmada
    Dado o package esperado em foreground
    Quando o sistema aguarda a app aberta
    Então a app está em foreground
```

## US-05 · Evento de tela estável

```gherkin
Funcionalidade: Evento de tela estável
  Cenário: Tela fica estável
    Dado a app em foreground
    Quando o sistema aguarda ausência de transição de UI
    Então a tela está estável
```

## US-06 · Evento de mudança de dump

```gherkin
Funcionalidade: Evento de mudança de dump
  Cenário: Dump de UI muda
    Dado um dump anterior (ou ausência) e serial online
    Quando a hierarquia UI (uiautomator dump) muda em relação ao anterior
    Então um dump atualizado está disponível
```

---

## US-07 · Abrir aplicativo

```gherkin
Funcionalidade: Abrir aplicativo
  Cenário: App é aberta no agent
    Dado package (e activity opcional)
    Quando launch é executado
    Então a app está em foreground
```

## US-08 · tap

```gherkin
Funcionalidade: tap
  Cenário: Toque na tela
    Dado coordenadas x,y ou bounds de um elemento
    Quando tap é executado nesse alvo
    Então a UI reflete o toque
```

## US-09 · type

```gherkin
Funcionalidade: type
  Cenário: Texto é digitado
    Dado um texto e campo focado (ou coords)
    Quando type injeta o texto
    Então o texto aparece na UI
```

## US-10 · scroll

```gherkin
Funcionalidade: scroll
  Cenário: Conteúdo é rolado
    Dado direção (up/down/left/right) e distância ou área
    Quando scroll/swipe é executado
    Então o conteúdo rolou e novos itens podem ficar visíveis
```

## US-11 · screenshot

```gherkin
Funcionalidade: screenshot
  Cenário: Print da tela é salvo
    Dado serial e path de saída
    Quando screenshot é capturado
    Então o arquivo de imagem existe no path
```

## US-12 · Resgatar coordenadas x,y

```gherkin
Funcionalidade: Resgatar coordenadas x,y
  Cenário: Coordenadas a partir de imagem template
    Dado uma imagem de entrada (template) e o frame/tela atual
    Quando o match por visão/template é executado
    Então coordenadas x,y (e confiança) são devolvidas
```

---

## US-13 · Extrair elementos e guardar sessão

```gherkin
Funcionalidade: Extrair elementos e guardar sessão
  Cenário: Elementos tipados, árvore DOM e sessão
    Dado uma imagem da tela (screenshot/frame) ou dump
    E contexto atual (device, apps, etapa, paths)
    Quando OCR extrai textos e ícones, imagens/fotos, listas e containers são reconhecidos
    E a hierarquia raiz → filhos é composta
    E persistir e/ou restaurar sessão é executado
    Então elementos tipados existem com string/tipo, bounds e metadados
    E a árvore DOM navegável é devolvida
    E a sessão está em disco ou o contexto foi restaurado
```

### SC-13.1 Persistir sessão em arquivo

```gherkin
Cenário: Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

### SC-13.2 Restaurar sessão do arquivo

```gherkin
Cenário: Sessão é restaurada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```
