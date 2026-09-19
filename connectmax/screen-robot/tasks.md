# Tasks — screen-robot

**Por quê:** árvore de execução e Gantt EP → US → SC (minutos IA).  
**Roadmap (sem SC):** [`roadmap.md`](roadmap.md).  
**Fonte:** [`scenarios.md`](scenarios.md).  
**Épicos:** [`epics.md`](epics.md).  
**Visão:** [`README.md`](README.md).  
**Kanban / inventário (umbrella):** [`core/tasks`](../../core/tasks/README.md#p1--connectmax--screen-robot).

Estimativas: minutos IA · **1 dia = 8h = 480 min**.

**Colapso:** 1 US no épico → só o EP (SC sobem sob o EP se houver >1); 1 SC na história → só a US.

### Árvore de execução

```text
screen-robot (249 min caminho · 408 min soma)
├── EP-01 Provisionar agente (60 min)
│   ├── SC-01 Subir / conectar o Android (agent) (20 min)
│   ├── SC-02 Garantir serial ADB online (20 min)
│   └── SC-03 Aguardar boot completo (20 min)
├── EP-02 Eventos de UI (24 min caminho)
│   ├── US-02 Evento de boot (12 min)
│   ├── ∥ US-03 Evento de app aberta (12 min)
│   ├── ∥ US-04 Evento de tela estável (12 min)
│   └── ∥ US-05 Evento de mudança de dump (12 min)
├── ∥ EP-03 Instalar APKs (45 min)
│   ├── SC-08 Ler versão na config do dispositivo (5 min)
│   ├── SC-09 Baixar APK na versão definida (25 min)
│   └── SC-10 Instalar pacote no agent (15 min)
├── ∥ EP-04 Operar tela (15 min caminho)
│   ├── US-07 Abrir aplicativo (15 min)
│   ├── US-08 tap (15 min)
│   ├── US-09 type (15 min)
│   ├── US-10 scroll (15 min)
│   ├── US-11 screenshot (15 min)
│   └── US-12 Resgatar coordenadas x,y a partir de uma imagem (15 min)
├── ∥ EP-05 Extrair elementos (120 min)
└── EP-06 Sessão (45 min)
    ├── US-14 Salvar sessão (15 min)
    ├── US-15 Remover sessão (15 min)
    └── US-16 Recuperar sessão (15 min)
```

`∥` = paralelizáveis (US-03..05 após US-02; EP-03..05 / US-06..13 após o grupo de eventos; caminhos 12 min e 120 min).

### Gantt — EP / US / SC

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

→ Roadmap (EP/US): [`roadmap.md`](roadmap.md)  
→ Implementação em [`sources/android-control`](sources/android-control/README.md)  
→ Aceite: [`bdds.md`](bdds.md)
