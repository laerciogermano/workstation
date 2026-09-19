# BDD — cenários por nó (screen-robot)

**Por quê:** aceite de cada nó da [árvore de execução](../../../core/tasks/README.md#p1--connectmax--screen-robot).  
**Funcionalidades:** [`functionalities.md`](functionalities.md).  
**Cenário integrado:** [`bdd-linkedin-login.md`](bdd-linkedin-login.md).

Cada cenário = mudança de estado (Dado → Quando → Então).

---

## 1. Provisionar um agente

```gherkin
Funcionalidade: Provisionar um agente
  Cenário: Agent fica pronto para ADB
    Dado a config do dispositivo e o runtime Android disponíveis
    Quando o provisionamento sobe, conecta, garante serial online e aguarda boot
    Então o agent está pronto (serial online e boot completo)
```

### 1.1 Subir / conectar o Android (agent)

```gherkin
Cenário: Agent sobe e fica alcançável
  Dado host, imagem/runtime e script de start
  Quando o agent é iniciado e a conexão é estabelecida
  Então o processo do agent está em execução e alcançável
```

### 1.2 Garantir serial ADB online

```gherkin
Cenário: Serial ADB fica online
  Dado o agent alcançável e o serial esperado na config
  Quando adb connect / listagem de devices é repetida até o serial aparecer como device
  Então o serial ADB está online
```

### 1.3 Aguardar boot completo

```gherkin
Cenário: Boot completo no device
  Dado o serial ADB online
  Quando o sistema faz poll de boot (ex. sys.boot_completed)
  Então o device reporta boot completo
```

---

## 2. Instalar APKs

```gherkin
Funcionalidade: Instalar APKs
  Cenário: Apps da config ficam instalados na versão definida
    Dado o agent provisionado e a lista de apps/versões na config
    Quando cada pacote é resolvido, baixado e instalado
    Então os apps estão instalados nas versões definidas
```

### 2.1 Ler versão na config do dispositivo

```gherkin
Cenário: Versão e package são lidos da config
  Dado o arquivo device.config.json
  Quando apps.*.version e package são parseados
  Então a versão e o package alvo estão disponíveis para download
```

### 2.2 Baixar APK na versão definida

```gherkin
Cenário: APK da versão pedida é baixado
  Dado package, versão e ferramenta de download
  Quando o download da versão definida é executado
  Então o artefato APK/XAPK existe no disco
```

### 2.3 Instalar pacote no agent

```gherkin
Cenário: Pacote é instalado no agent
  Dado serial online e caminho do APK
  Quando adb install (ou equivalente) é executado
  Então o pacote está instalado no agent
```

---

## 3. Receber eventos

```gherkin
Funcionalidade: Receber eventos
  Cenário: Evento de UI confirmado para o próximo passo
    Dado serial online e critérios de espera
    Quando o sistema observa boot, app, estabilidade e dump
    Então o evento esperado é confirmado
```

### 3.1 Evento de boot

```gherkin
Cenário: Sinal de boot é recebido
  Dado serial online
  Quando o listener aguarda o evento de boot
  Então o boot é sinalizado
```

### 3.2 Evento de app aberta

```gherkin
Cenário: App em foreground é confirmada
  Dado o package esperado em foreground
  Quando o sistema aguarda a app aberta
  Então a app está em foreground
```

### 3.3 Evento de tela estável

```gherkin
Cenário: Tela fica estável
  Dado a app em foreground
  Quando o sistema aguarda ausência de transição de UI
  Então a tela está estável
```

### 3.4 Evento de mudança de dump

```gherkin
Cenário: Dump de UI muda
  Dado um dump anterior (ou ausência) e serial online
  Quando a hierarquia UI (uiautomator dump) muda em relação ao anterior
  Então um dump atualizado está disponível
```

---

## 4. Executar operações

```gherkin
Funcionalidade: Executar operações
  Cenário: Ação é aplicada no device
    Dado serial online e um alvo (package, coords, elemento ou imagem)
    Quando a operação correspondente é disparada
    Então a UI/device reflete a ação (e coords/artefato quando couber)
```

### 4.1 Abrir aplicativo

```gherkin
Cenário: App é aberta no agent
  Dado package (e activity opcional)
  Quando launch é executado
  Então a app está em foreground
```

### 4.2 tap

```gherkin
Cenário: Toque na tela
  Dado coordenadas x,y ou bounds de um elemento
  Quando tap é executado nesse alvo
  Então a UI reflete o toque
```

### 4.3 type

```gherkin
Cenário: Texto é digitado
  Dado um texto e campo focado (ou coords)
  Quando type injeta o texto
  Então o texto aparece na UI
```

### 4.4 key

```gherkin
Cenário: Tecla é enviada
  Dado um código de tecla (ex. ENTER, BACK)
  Quando keyevent é enviado
  Então a tecla é processada pelo device
```

### 4.5 scroll

```gherkin
Cenário: Conteúdo é rolado
  Dado direção (up/down/left/right) e distância ou área
  Quando scroll/swipe é executado
  Então o conteúdo rolou e novos itens podem ficar visíveis
```

### 4.6 screenshot

```gherkin
Cenário: Print da tela é salvo
  Dado serial e path de saída
  Quando screenshot é capturado
  Então o arquivo de imagem existe no path
```

### 4.7 Resgatar coordenadas x,y (imagem de entrada)

```gherkin
Cenário: Coordenadas a partir de imagem template
  Dado uma imagem de entrada (template) e o frame/tela atual
  Quando o match por visão/template é executado
  Então coordenadas x,y (e confiança) são devolvidas
```

---

## 5. Extrair elementos e informações

```gherkin
Funcionalidade: Extrair elementos e informações
  Cenário: Árvore DOM da tela é produzida
    Dado frame/dump da tela estável
    Quando textos, ícones, imagens, listas e containers são extraídos e compostos
    Então existe uma árvore de componentes navegável (estilo DOM)
```

### 5.1 Nó Texto

```gherkin
Cenário: Textos são extraídos
  Dado frame/dump
  Quando OCR ou atributos de texto são lidos
  Então nós de texto existem com string e bounds
```

### 5.2 Nó Ícone

```gherkin
Cenário: Ícones são reconhecidos
  Dado frame/dump
  Quando pictogramas/controles são detectados
  Então nós de ícone existem com tipo e bounds
```

### 5.3 Nó Imagem / foto

```gherkin
Cenário: Regiões de mídia são detectadas
  Dado frame/dump
  Quando regiões de imagem/foto são identificadas
  Então nós imagem/foto existem com bounds
```

### 5.4 Nó Lista

```gherkin
Cenário: Lista com itens é extraída
  Dado frame/dump
  Quando coleção rolável e itens são identificados
  Então existe nó lista com filhos e metadados de scroll
```

### 5.5 Nó Container

```gherkin
Cenário: Containers são agrupados
  Dado frame/dump
  Quando card/toolbar/painel são agrupados
  Então nós container existem com filhos
```

### 5.6 Montar árvore DOM

```gherkin
Cenário: Hierarquia raiz → filhos é montada
  Dado nós tipados (texto, ícone, imagem, lista, container)
  Quando a composição hierárquica é executada
  Então a árvore DOM navegável é devolvida
```

---

## 6. Guardar estado de sessão

```gherkin
Funcionalidade: Guardar estado de sessão
  Cenário: Sessão persiste e pode ser restaurada
    Dado contexto atual (device, apps, etapa, paths)
    Quando persistir e/ou restaurar é executado
    Então a sessão está em disco ou o contexto foi restaurado
```

### 6.1 Persistir sessão em arquivo

```gherkin
Cenário: Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

### 6.2 Restaurar sessão do arquivo

```gherkin
Cenário: Sessão é restaurada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```
