# Tasks — screen-robot

**Por quê:** árvore de execução e Gantt das funcionalidades maiores (sequenciais) e filhas.  
**Fonte:** [`functionalities.md`](functionalities.md).  
**Visão:** [`../README.md`](../README.md).  
**Estimativas:** minutos de esforço IA.

## Árvore de execução

```text
screen-robot
├── 1. Provisionar um agente
│   ├── Subir / conectar o Android (agent)
│   ├── Garantir serial ADB online
│   └── Aguardar boot completo
├── 2. Instalar APKs
│   ├── Ler versão na config do dispositivo
│   ├── Baixar APK na versão definida
│   └── Instalar pacote no agent
├── 3. Receber eventos
│   ├── Evento de boot
│   ├── Evento de app aberta
│   ├── Evento de tela estável
│   └── Evento de mudança de dump
├── 4. Extrair elementos e informações
│   ├── Nó Texto
│   ├── Nó Ícone
│   ├── Nó Imagem / foto
│   ├── Nó Lista (itens filhos + scroll)
│   ├── Nó Container
│   └── Montar árvore DOM (raiz → filhos)
├── 5. Executar operações
│   ├── launch
│   ├── tap
│   ├── type
│   ├── key
│   └── screenshot
└── 6. Guardar estado de sessão
    ├── Persistir sessão em arquivo
    └── Restaurar sessão do arquivo
```

```mermaid
flowchart TB
  subgraph P["1. Provisionar um agente"]
    P1[Subir / conectar agent] --> P2[Serial ADB online] --> P3[Boot completo]
  end

  subgraph I["2. Instalar APKs"]
    I1[Ler versão na config] --> I2[Baixar APK] --> I3[Instalar no agent]
  end

  subgraph E["3. Receber eventos"]
    E1[Boot] --> E2[App aberta] --> E3[Tela estável] --> E4[Mudança de dump]
  end

  subgraph X["4. Extrair elementos e informações"]
    X1[Texto] --> X6[Árvore DOM]
    X2[Ícone] --> X6
    X3[Imagem / foto] --> X6
    X4[Lista] --> X6
    X5[Container] --> X6
  end

  subgraph O["5. Executar operações"]
    O1[launch] --> O2[tap] --> O3[type] --> O4[key] --> O5[screenshot]
  end

  subgraph S["6. Guardar estado de sessão"]
    S1[Persistir] --> S2[Restaurar]
  end

  P --> I --> E --> X --> O --> S
```

## Gantt

Funcionalidades **maiores** em sequência; dentro de cada seção, as **filhas** preenchem a barra da maior.

```mermaid
gantt
  title screen-robot — funcionalidades (minutos IA)
  dateFormat X
  axisFormat %s

  section 1. Provisionar
  Provisionar um agente        :crit, p0, 0, 60m
  Subir / conectar agent       :p1, 0, 20m
  Serial ADB online            :p2, after p1, 20m
  Boot completo                :p3, after p2, 20m

  section 2. Instalar APKs
  Instalar APKs                :crit, i0, after p0, 45m
  Ler versao na config         :i1, after p0, 5m
  Baixar APK                   :i2, after i1, 25m
  Instalar no agent            :i3, after i2, 15m

  section 3. Receber eventos
  Receber eventos              :crit, e0, after i0, 48m
  Evento boot                  :e1, after i0, 12m
  Evento app aberta            :e2, after e1, 12m
  Evento tela estavel          :e3, after e2, 12m
  Evento mudanca de dump       :e4, after e3, 12m

  section 4. Extrair
  Extrair elementos            :crit, x0, after e0, 120m
  No Texto                     :x1, after e0, 20m
  No Icone                     :x2, after x1, 20m
  No Imagem / foto             :x3, after x2, 24m
  No Lista                     :x4, after x3, 24m
  No Container                 :x5, after x4, 12m
  Montar arvore DOM            :x6, after x5, 20m

  section 5. Operacoes
  Executar operacoes           :crit, o0, after x0, 75m
  launch                       :o1, after x0, 15m
  tap                          :o2, after o1, 15m
  type                         :o3, after o2, 15m
  key                          :o4, after o3, 15m
  screenshot                   :o5, after o4, 15m

  section 6. Sessao
  Guardar estado de sessao     :crit, s0, after o0, 30m
  Persistir sessao             :s1, after o0, 15m
  Restaurar sessao             :s2, after s1, 15m
```

| # | Maior | Filhas | Min IA |
|---|-------|--------|--------|
| 1 | Provisionar um agente | subir/conectar · serial online · boot | 60 |
| 2 | Instalar APKs | ler versão · baixar · instalar | 45 |
| 3 | Receber eventos | boot · app aberta · tela estável · dump | 48 |
| 4 | Extrair elementos | texto · ícone · imagem/foto · lista · container · árvore DOM | 120 |
| 5 | Executar operações | launch · tap · type · key · screenshot | 75 |
| 6 | Guardar sessão | persistir · restaurar | 30 |
| | **Total** | | **378** |

## Próximos passos

→ Implementação em [`../sources/android-control`](../sources/android-control/README.md)  
→ Aceite: [`bdd-linkedin-login.md`](bdd-linkedin-login.md)
