# Tasks — screen-robot

**Por quê:** árvore de execução das features (minutos IA).  
**Gantt / roadmap:** [`roadmap.md`](roadmap.md).  
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

## Próximos passos

→ Gantt: [`roadmap.md`](roadmap.md)  
→ Implementação em [`sources/android-control`](sources/android-control/README.md)  
→ Aceite: [`bdds.md`](bdds.md)
