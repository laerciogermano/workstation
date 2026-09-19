# Tasks — screen-robot

**Por quê:** árvore de execução das features e Gantt (minutos IA).  
**Fonte:** [`functionalities.md`](functionalities.md).  
**Visão:** [`../README.md`](../README.md).  
**Kanban / inventário (umbrella):** [`core/tasks`](../../../core/tasks/README.md#p1--connectmax--screen-robot).

Histórias US (eventos e operações cada uma é US; Extrair+sessão = US-13 com SC; Provisionar/APKs (US-06) com SC).  
Estimativas: minutos IA · **1 dia = 8h = 480 min**.

### Árvore de execução

```text
screen-robot (393 min)
├── US-01 Provisionar um agente (60 min)
│   ├── SC-01.1 Subir / conectar o Android (agent) (20 min)
│   ├── SC-01.2 Garantir serial ADB online (20 min)
│   └── SC-01.3 Aguardar boot completo (20 min)
├── US-02 Evento de boot (12 min)
├── US-03 Evento de app aberta (12 min)
├── US-04 Evento de tela estável (12 min)
├── US-05 Evento de mudança de dump (12 min)
├── US-06 Instalar APKs (45 min)
│   ├── SC-06.1 Ler versão na config do dispositivo (5 min)
│   ├── SC-06.2 Baixar APK na versão definida (25 min)
│   └── SC-06.3 Instalar pacote no agent (15 min)
├── US-07 Abrir aplicativo (15 min)
├── US-08 tap (15 min)
├── US-09 type (15 min)
├── US-10 scroll (15 min)
├── US-11 screenshot (15 min)
├── US-12 Resgatar coordenadas x,y (imagem de entrada) (15 min)
└── US-13 Extrair elementos e guardar sessão (150 min)
    ├── SC-13.1 Persistir sessão em arquivo (15 min)
    └── SC-13.2 Restaurar sessão do arquivo (15 min)
```

### Gantt — atividades da árvore (sequenciais)

Mesmas atividades da árvore acima (nomes e minutos), em sequência.  
Barras na ordem da árvore (folhas: SC sob US-01/06/13; US sem SC nas demais).  
Esforço total (soma / caminho crítico): **393 min**.

```mermaid
gantt
  title screen-robot US minutos IA sequencial
  dateFormat X
  axisFormat %s

  section Provisionar
  SC-01.1 Subir e conectar         :p1, 0, 20m
  SC-01.2 Serial ADB online        :p2, after p1, 20m
  SC-01.3 Boot completo            :p3, after p2, 20m

  section Eventos
  US-02 Evento boot                :e1, after p3, 12m
  US-03 Evento app aberta          :e2, after e1, 12m
  US-04 Evento tela estavel        :e3, after e2, 12m
  US-05 Evento mudanca dump        :e4, after e3, 12m

  section Instalar APKs
  SC-06.1 Ler versao               :i1, after e4, 5m
  SC-06.2 Baixar APK               :i2, after i1, 25m
  SC-06.3 Instalar pacote          :i3, after i2, 15m

  section Operacoes
  US-07 Abrir aplicativo           :o1, after i3, 15m
  US-08 tap                        :o2, after o1, 15m
  US-09 type                       :o3, after o2, 15m
  US-10 scroll                     :o4, after o3, 15m
  US-11 screenshot                 :o5, after o4, 15m
  US-12 Resgatar xy por imagem     :o6, after o5, 15m

  section Extrair e sessao
  US-13 Extrair elementos          :crit, x1, after o6, 120m
  SC-13.1 Persistir sessao         :s1, after x1, 15m
  SC-13.2 Restaurar sessao         :s2, after s1, 15m
```

## Próximos passos

→ Implementação em [`../sources/android-control`](../sources/android-control/README.md)  
→ Aceite: [`bdd-linkedin-login.md`](bdd-linkedin-login.md) · BDD nós: [`bdd-nos.md`](bdd-nos.md)
