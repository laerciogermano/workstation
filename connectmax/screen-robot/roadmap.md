# Roadmap — screen-robot

**Por quê:** Gantt EP → US → SC (minutos IA).  
**Árvore / esforço por nó:** [`tasks.md`](tasks.md).  
**Fonte:** [`scenarios.md`](scenarios.md).  
**Épicos:** [`epics.md`](epics.md).  
**Visão:** [`README.md`](README.md).

**Colapso:** 1 US no épico → só o EP (SC sobem se >1); 1 SC na história → só a US.  
Cores (só 2): **EP** = azul · **US/SC** = cinza · fundo preto.  
US-02 → **US-03..05** paralelas; **EP-03..05** (US-06..13) paralelas após US-05; EP-06 sequencial.  
Soma esforço: **408 min** · caminho crítico: **249 min**.

```mermaid
---
config:
  theme: base
  themeVariables:
    darkMode: true
    background: '#000000'
    primaryTextColor: '#ffffff'
    secondaryTextColor: '#ffffff'
    tertiaryTextColor: '#ffffff'
    textColor: '#ffffff'
    lineColor: '#333333'
    mainBkg: '#000000'
    secondaryColor: '#000000'
    tertiaryColor: '#000000'
    sectionBkgColor: '#000000'
    sectionBkgColor2: '#000000'
    altSectionBkgColor: '#000000'
    gridColor: '#222222'
    excludeBkgColor: '#000000'
    todayLineColor: '#444444'
    doneTaskBkgColor: '#2563eb'
    doneTaskBorderColor: '#1d4ed8'
    taskBkgColor: '#94a3b8'
    taskBorderColor: '#64748b'
    taskTextColor: '#ffffff'
    taskTextDarkColor: '#ffffff'
    taskTextLightColor: '#ffffff'
    taskTextOutsideColor: '#ffffff'
    critBkgColor: '#2563eb'
    critBorderColor: '#1d4ed8'
    activeTaskBkgColor: '#94a3b8'
    activeTaskBorderColor: '#64748b'
---
gantt
  title screen-robot EP / US / SC
  dateFormat X
  axisFormat %s

  section EP-01 Provisionar
  EP-01 Provisionar agente              :done, ep01, 0, 60m
  SC-01 Subir e conectar                :sc01, 0, 20m
  SC-02 Serial ADB online               :sc02, after sc01, 20m
  SC-03 Boot completo                   :sc03, after sc02, 20m

  section EP-02 Eventos de UI
  EP-02 Eventos de UI                   :done, ep02, after ep01, 24m
  US-02 Evento de boot                  :us02, after ep01, 12m
  US-03 Evento de app aberta            :us03, after us02, 12m
  US-04 Evento de tela estavel          :us04, after us02, 12m
  US-05 Evento de mudanca de dump       :us05, after us02, 12m

  section EP-03 Instalar APKs
  EP-03 Instalar APKs                   :done, ep03, after us05, 45m
  SC-08 Ler versao                      :sc08, after us05, 5m
  SC-09 Baixar APK                      :sc09, after sc08, 25m
  SC-10 Instalar pacote                 :sc10, after sc09, 15m

  section EP-04 Operar tela
  EP-04 Operar tela                     :done, ep04, after us05, 15m
  US-07 Abrir aplicativo                :us07, after us05, 15m
  US-08 tap                             :us08, after us05, 15m
  US-09 type                            :us09, after us05, 15m
  US-10 scroll                          :us10, after us05, 15m
  US-11 screenshot                      :us11, after us05, 15m
  US-12 Resgatar coordenadas x,y        :us12, after us05, 15m

  section EP-05 Extrair elementos
  EP-05 Extrair elementos               :done, ep05, after us05, 120m

  section EP-06 Sessao
  EP-06 Sessao                          :done, ep06, after ep05, 45m
  US-14 Salvar sessao                   :us14, after ep05, 15m
  US-15 Remover sessao                  :us15, after us14, 15m
  US-16 Recuperar sessao                :us16, after us15, 15m
```

## Próximos passos

→ [`tasks.md`](tasks.md) · [`bdds.md`](bdds.md)  
→ Implementação em [`sources/android-control`](sources/android-control/README.md)
