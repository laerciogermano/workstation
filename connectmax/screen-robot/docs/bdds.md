# BDDs — screen-robot

**Por quê:** aceite Gherkin **só dos cenários (SC)** (fonte: [`scenarios.md`](scenarios.md)).  
**Piloto:** script [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js).

Cada bloco: Dado / Quando / Então alinhado a Entradas / Execução / Saídas do SC.

## Índice

| SC | Cenário | US |
|----|---------|-----|
| [SC-01](#sc-01) | Subir / conectar o Android (agent) | US-01 |
| [SC-02](#sc-02) | Garantir serial ADB online | US-01 |
| [SC-03](#sc-03) | Aguardar boot completo | US-01 |
| [SC-04](#sc-04) | Sinal de boot é recebido | US-02 |
| [SC-05](#sc-05) | App em foreground é confirmada | US-03 |
| [SC-06](#sc-06) | Tela fica estável | US-04 |
| [SC-07](#sc-07) | Dump de UI muda | US-05 |
| [SC-08](#sc-08) | Ler versão na config do dispositivo | US-06 |
| [SC-09](#sc-09) | Baixar APK na versão definida | US-06 |
| [SC-10](#sc-10) | Instalar pacote no agent | US-06 |
| [SC-11](#sc-11) | App é aberta no agent | US-07 |
| [SC-12](#sc-12) | Toque na tela | US-08 |
| [SC-13](#sc-13) | Texto é digitado | US-09 |
| [SC-14](#sc-14) | Conteúdo é rolado | US-10 |
| [SC-15](#sc-15) | Print da tela é salvo | US-11 |
| [SC-16](#sc-16) | Coordenadas a partir de imagem template | US-12 |
| [SC-17](#sc-17) | Extrair elementos tipados e árvore DOM | US-13 |
| [SC-18](#sc-18) | Salvar sessão em arquivo | US-14 |
| [SC-19](#sc-19) | Remover sessão do disco | US-15 |
| [SC-20](#sc-20) | Recuperar sessão do arquivo | US-16 |

---

## US-01 — Provisionar um agente

### SC-01

**Subir / conectar o Android (agent)**


```gherkin
Cenário: SC-01 Agent sobe e fica alcançável
  Dado host, imagem/runtime e script de start
  Quando o agent é iniciado e a conexão é estabelecida
  Então o processo do agent está em execução e alcançável
```

### SC-02

**Garantir serial ADB online**


```gherkin
Cenário: SC-02 Serial ADB fica online
  Dado o agent alcançável e o serial esperado na config
  Quando adb connect / listagem de devices é repetida até o serial aparecer como device
  Então o serial ADB está online
```

### SC-03

**Aguardar boot completo**


```gherkin
Cenário: SC-03 Boot completo no device
  Dado o serial ADB online
  Quando o sistema faz poll de boot (ex. sys.boot_completed)
  Então o device reporta boot completo
```

## US-02 — Evento de boot

### SC-04

**Sinal de boot é recebido**


```gherkin
Cenário: SC-04 Sinal de boot é recebido
  Dado o serial online
  Quando o listener aguarda o evento de boot
  Então o boot é sinalizado
```

## US-03 — Evento de app aberta

### SC-05

**App em foreground é confirmada**


```gherkin
Cenário: SC-05 App em foreground é confirmada
  Dado o package esperado em foreground
  Quando o sistema aguarda a app aberta
  Então a app está em foreground
```

## US-04 — Evento de tela estável

### SC-06

**Tela fica estável**


```gherkin
Cenário: SC-06 Tela fica estável
  Dado a app em foreground
  Quando o sistema aguarda ausência de transição de UI
  Então a tela está estável
```

## US-05 — Evento de mudança de dump

### SC-07

**Dump de UI muda**


```gherkin
Cenário: SC-07 Dump de UI muda
  Dado um dump anterior (ou ausência) e serial online
  Quando a hierarquia UI (uiautomator dump) muda em relação ao anterior
  Então um dump atualizado está disponível
```

## US-06 — Instalar APKs

### SC-08

**Ler versão na config do dispositivo**


```gherkin
Cenário: SC-08 Versão e package são lidos da config
  Dado o arquivo device.config.json
  Quando apps.*.version e package são parseados
  Então a versão e o package alvo estão disponíveis para download
```

### SC-09

**Baixar APK na versão definida**


```gherkin
Cenário: SC-09 APK da versão pedida é baixado
  Dado package, versão e ferramenta de download (ex. apkeep)
  Quando o download da versão definida é executado
  Então o artefato APK/XAPK existe no disco
```

### SC-10

**Instalar pacote no agent**


```gherkin
Cenário: SC-10 Pacote é instalado no agent
  Dado serial online e caminho do APK
  Quando adb install (ou equivalente) é executado
  Então o pacote está instalado no agent
```

## US-07 — Abrir aplicativo

### SC-11

**App é aberta no agent**


```gherkin
Cenário: SC-11 App é aberta no agent
  Dado package (e activity opcional)
  Quando launch é executado
  Então a app está em foreground
```

## US-08 — tap

### SC-12

**Toque na tela**


```gherkin
Cenário: SC-12 Toque na tela
  Dado coordenadas x,y ou bounds do elemento
  Quando tap é executado nesse alvo
  Então a UI reflete o toque
```

## US-09 — type

### SC-13

**Texto é digitado**


```gherkin
Cenário: SC-13 Texto é digitado
  Dado um texto e campo focado ou coords
  Quando type injeta o texto
  Então o texto aparece na UI
```

## US-10 — scroll

### SC-14

**Conteúdo é rolado**


```gherkin
Cenário: SC-14 Conteúdo é rolado
  Dado direção, distância ou bounds da área
  Quando scroll/swipe é executado
  Então o conteúdo rolou e novos itens podem ficar visíveis
```

## US-11 — screenshot

### SC-15

**Print da tela é salvo**


```gherkin
Cenário: SC-15 Print da tela é salvo
  Dado serial e path de saída
  Quando screenshot é capturado
  Então o arquivo de imagem existe no path
```

## US-12 — Resgatar coordenadas x,y a partir de uma imagem

### SC-16

**Coordenadas a partir de imagem template**


```gherkin
Cenário: SC-16 Coordenadas a partir de imagem template
  Dado uma imagem de entrada (template) e o frame/tela atual
  Quando o match por visão/template é executado
  Então coordenadas x,y (e confiança) são devolvidas
```

## US-13 — Extrair elementos

### SC-17

**Extrair elementos tipados e árvore DOM**


```gherkin
Cenário: SC-17 Elementos tipados e árvore DOM
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando OCR e reconhecimento extraem elementos tipados
  E a hierarquia raiz → filhos é composta
  Então elementos tipados existem com string/tipo, bounds e metadados
  E a árvore DOM navegável é devolvida
```

## US-14 — Salvar sessão

### SC-18

**Salvar sessão em arquivo**


```gherkin
Cenário: SC-18 Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

## US-15 — Remover sessão

### SC-19

**Remover sessão do disco**


```gherkin
Cenário: SC-19 Sessão é removida do disco
  Dado um path de sessão
  Quando o arquivo de sessão é apagado
  Então o arquivo de sessão não existe
  E o runtime não mantém o contexto daquela sessão
```

## US-16 — Recuperar sessão

### SC-20

**Recuperar sessão do arquivo**


```gherkin
Cenário: SC-20 Sessão é recuperada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```
