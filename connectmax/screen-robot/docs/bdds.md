# BDDs — screen-robot

**Por quê:** aceite Gherkin de cada **US** e **SC** (fonte: [`scenarios.md`](scenarios.md)).  
**Piloto de integração:** seção [Login LinkedIn](#integração--login-linkedin).

Cada bloco usa Dado / Quando / Então alinhado a Entradas / Execução / Saídas.

## Cobertura

| US | SC | BDD unitário | No piloto LinkedIn |
|----|----|--------------|--------------------|
| US-01 | SC-01, SC-02, SC-03 | sim | sim (provisionar) |
| US-02 | SC-04 | sim | parcial (`waitForUiReady` / boot) |
| US-03 | SC-05 | sim | parcial (app aberta no launch) |
| US-04 | SC-06 | sim | sim (UI estável) |
| US-05 | SC-07 | sim | sim (dump disponível) |
| US-06 | SC-08, SC-09, SC-10 | sim | sim (Instagram + LinkedIn) |
| US-07 | SC-11 | sim | sim (abrir LinkedIn) |
| US-08 | SC-12 | sim | sim (tap Entrar) |
| US-09 | SC-13 | sim | sim (type user/senha) |
| US-10 | SC-14 | sim | a exercer no script |
| US-11 | SC-15 | sim | sim (screenshot) |
| US-12 | SC-16 | sim | a exercer no script |
| US-13 | SC-17 | sim | sim (extrair árvore) |
| US-14 | SC-18 | sim | sim (salvar sessão) |
| US-15 | SC-19 | sim | **não** — BDD unitário só |
| US-16 | SC-20 | sim | **não** — BDD unitário só |

**Lacunas do piloto:** US-15 (remover sessão) e US-16 (recuperar sessão) têm BDD unitário, mas o script `linkedin-login` ainda não as exercita. US-10 e US-12 constam no mapeamento operacional e devem ser exercidas no script.

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

## US-12 · Resgatar coordenadas x,y a partir de uma imagem

```gherkin
Funcionalidade: US-12 Resgatar coordenadas x,y a partir de uma imagem
  Cenário: Coordenadas do alvo são devolvidas
    Dado uma imagem de entrada e o frame/tela atual
    Quando o match por visão/template é executado
    Então as coordenadas x,y (e confiança) são devolvidas
```

### SC-16 Coordenadas a partir de imagem template

```gherkin
Cenário: SC-16 Coordenadas a partir de imagem template
  Dado uma imagem de entrada (template) e o frame/tela atual
  Quando o match por visão/template é executado
  Então coordenadas x,y (e confiança) são devolvidas
```

---

## US-13 · Extrair elementos

```gherkin
Funcionalidade: US-13 Extrair elementos
  Cenário: Elementos tipados e árvore DOM
    Dado uma imagem da tela (screenshot/frame) ou dump
    Quando OCR e reconhecimento extraem elementos tipados
    E a hierarquia raiz → filhos (árvore DOM) é composta
    Então elementos tipados existem com string/tipo, bounds e metadados
    E a árvore DOM navegável é devolvida
```

### SC-17 Extrair elementos tipados e árvore DOM

```gherkin
Cenário: SC-17 Elementos tipados e árvore DOM
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando OCR e reconhecimento extraem elementos tipados
  E a hierarquia raiz → filhos é composta
  Então elementos tipados existem com string/tipo, bounds e metadados
  E a árvore DOM navegável é devolvida
```

---

## US-14 · Salvar sessão

```gherkin
Funcionalidade: US-14 Salvar sessão
  Cenário: Sessão é gravada em disco
    Dado estado em memória e path da sessão
    Quando a serialização grava o arquivo
    Então o arquivo de sessão existe
```

### SC-18 Salvar sessão em arquivo

```gherkin
Cenário: SC-18 Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

---

## US-15 · Remover sessão

```gherkin
Funcionalidade: US-15 Remover sessão
  Cenário: Sessão é removida
    Dado um path de sessão
    Quando a remoção da sessão é executada
    Então o arquivo de sessão não existe
    E o runtime não mantém o contexto daquela sessão
```

### SC-19 Remover sessão do disco

```gherkin
Cenário: SC-19 Sessão é removida do disco
  Dado um path de sessão
  Quando o arquivo de sessão é apagado
  Então o arquivo de sessão não existe
  E o runtime não mantém o contexto daquela sessão
```

---

## US-16 · Recuperar sessão

```gherkin
Funcionalidade: US-16 Recuperar sessão
  Cenário: Sessão é recuperada
    Dado um arquivo de sessão existente
    Quando a leitura reaplica o contexto
    Então o runtime possui o estado restaurado
```

### SC-20 Recuperar sessão do arquivo

```gherkin
Cenário: SC-20 Sessão é recuperada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```

---

## Integração — Login LinkedIn

**Script:** [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js)  
**Config do device:** [`../sources/android-control/device.config.json`](../sources/android-control/device.config.json)

```gherkin
Funcionalidade: Login no LinkedIn com agent Android via Node
  Como operador do screen-robot
  Quero provisionar o agent, instalar APKs, ler a tela e autenticar no LinkedIn
  Para validar o pipeline Node (US-01..14; US-15 e US-16 só no BDD unitário)

  Contexto:
    Dado a config do dispositivo em device.config.json
    E as credenciais LINKEDIN_USER e LINKEDIN_PASSWORD no ambiente
    E a versão do Instagram definida em apps.instagram.version

  @provisionar @apks @eventos @operacoes @extrair @sessao
  Cenário: Login a partir da home ou já na tela de login
    Dado que o agente Android é provisionado e fica online
    E o APK do Instagram na versão da config é baixado e instalado
    E o APK do LinkedIn é instalado (se ainda não estiver)
    Quando o LinkedIn é aberto no agent
    E o sistema recebe o evento de UI estável (dump disponível)
    E um print da tela é salvo
    E os elementos e informações da tela são extraídos como árvore de componentes (textos, ícones, imagens/fotos, listas e containers)
    Então a árvore contém o botão de login (ex.: "Entrar" / "Sign in")
       ou a tela já é a de login (campos de usuário/senha)
    Quando as operações digitam usuário e senha e tocam em Entrar
    Então o estado da sessão é guardado em disco
    E a sessão registra device, apps, caminho do print e etapa "login_submitted"
```

### Mapeamento US → passo

| US | Passo BDD / script |
|----|-------------------|
| US-01 | `Dado que o agente Android é provisionado` → `provisionAgent()` |
| US-02 | Boot no provisionamento / `waitForUiReady()` |
| US-03 | App em foreground após abrir LinkedIn |
| US-04 | `E o sistema recebe o evento de UI estável` → `waitForUiReady()` |
| US-05 | Dump disponível no mesmo wait |
| US-06 | `E o APK do Instagram…` / LinkedIn → `installApk` |
| US-07 | `Quando o LinkedIn é aberto` → `operate.openApp` |
| US-08 | tap Entrar → `operate.tap` |
| US-09 | digitar usuário/senha → `operate.type` |
| US-10 | scroll (quando necessário na tela) → `operate.scroll` |
| US-11 | `E um print da tela é salvo` → `operate.screenshot` |
| US-12 | resgatar x,y por imagem (quando necessário) → `operate.findByImage` |
| US-13 | `E os elementos…` → `extractElements()` |
| US-14 | `Então o estado da sessão…` → `saveSession()` |
| US-15 | *fora do piloto* — ver BDD unitário |
| US-16 | *fora do piloto* — ver BDD unitário |
