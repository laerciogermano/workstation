# Processo de desenvolvimento de software

Ciclo padrão da workstation:

```text
Discovery → Refinamento técnico → Desenvolvimento → Testes → Implantação → Manutenção
```

Cada etapa documenta **entradas**, **execução** e **saídas**. A árvore abaixo lista os **passos da execução** de cada fase.

## Como atacar

1. No [discovery](discovery/README.md), nesta ordem: **vision → functionalities → cenários → BDDs → protótipo → roadmap**.
2. **Depois**, separar **cada estória** e aplicar o ciclo acima **por estória** (refinamento técnico → desenvolvimento → testes → implantação → manutenção).

O mapa nasce no discovery; o restante do processo roda **estória a estória**, não no produto inteiro de uma vez.

| Etapa | Pasta | Objetivo |
|-------|-------|----------|
| Discovery | [`discovery/`](discovery/README.md) | Vision → functionalities → cenários → BDDs → protótipo → roadmap; depois ciclo por estória |
| Refinamento técnico | [`refinamento-tecnico/`](refinamento-tecnico/README.md) | Detalhar solução, riscos e critérios técnicos |
| Desenvolvimento | [`desenvolvimento/`](desenvolvimento/README.md) | Implementar o que foi acordado |
| Testes | [`testes/`](testes/README.md) | Validar comportamento e qualidade |
| Implantação | [`implantacao/`](implantacao/README.md) | Publicar em ambiente alvo |
| Manutenção | [`manutencao/`](manutencao/README.md) | Operar, corrigir e evoluir |

### Árvore de execução

```text
Processo (41)
├── 1. Discovery
│   ├── 1.1 Vision
│   ├── 1.2 Functionalities
│   ├── 1.3 Cenarios (EP → US → SC)
│   ├── 1.4 BDDs
│   ├── 1.5 Prototipo
│   └── 1.6 Roadmap
│       ├── 1.6.1 Criar épicos
│       ├── 1.6.2 Criar estórias
│       └── 1.6.3 Criar cenários
├── 2. Refinamento tecnico
│   ├── 2.1 Desenhar arquitetura, contratos e dados
│   ├── 2.2 Identificar riscos e mitigacoes
│   ├── 2.3 Consolidar criterios de pronto
│   ├── 2.4 Estimar esforco e dependencias
│   └── 2.5 Quebrar em tarefas priorizadas
├── 3. Desenvolvimento
│   ├── 3.1 Implementar conforme aceite
│   ├── 3.2 Commits pequenos e revisaveis
│   ├── 3.3 Lote: primeiro caso, depois escala
│   ├── 3.4 Testes unitarios
│   ├── 3.5 Documentar o minimo
│   └── 3.6 Integrar com CI
├── 4. Testes
│   ├── 4.1 Unitario / integracao / E2E
│   ├── 4.2 Aceite por cenario
│   ├── 4.3 Regressao
│   ├── 4.4 Qualidade
│   └── 4.5 Priorizar bugs
├── 5. Implantacao
│   ├── 5.1 Build e release
│   ├── 5.2 Migracoes e configuracao
│   ├── 5.3 Deploy staging → prod
│   ├── 5.4 Smoke pos-deploy
│   └── 5.5 Comunicar / rollback
└── 6. Manutencao
    ├── 6.1 Monitorar e incidentes
    ├── 6.2 Hotfixes
    ├── 6.3 Melhorias incrementais
    ├── 6.4 Debito tecnico
    └── 6.5 Encaminhar mudancas
```

### Roadmap — etapas sequenciais

Só as fases maiores, em sequência (detalhe dos passos na árvore acima).  
Estilo: fundo preto · etapa = azul.

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
  title Processo — etapas sequenciais
  dateFormat X
  axisFormat %s

  section Etapas
  1. Discovery                  :done, p1, 0, 1
  2. Refinamento tecnico        :done, p2, after p1, 1
  3. Desenvolvimento            :done, p3, after p2, 1
  4. Testes                     :done, p4, after p3, 1
  5. Implantacao                :done, p5, after p4, 1
  6. Manutencao                 :done, p6, after p5, 1
```

## Fluxo (entradas → execução → saídas)

```mermaid
flowchart TB
  subgraph D["1. Discovery"]
    direction TB
    D_E["Entradas<br/>demanda / problema<br/>contexto e restrições<br/>stakeholders<br/>dados e feedback"]
    D_X["Execução<br/>vision → functionalities → cenários<br/>BDDs → protótipo → roadmap"]
    D_S["Saídas<br/>vision.md<br/>functionalities.md<br/>scenarios.md<br/>bdds.md<br/>protótipo<br/>roadmap"]
    D_E --> D_X --> D_S
  end

  subgraph R["2. Refinamento técnico"]
    direction TB
    R_E["Entradas<br/>vision + EP → US → SC + BDD<br/>restrições<br/>stack e padrões"]
    R_X["Execução<br/>arquitetura e contratos<br/>riscos e mitigações<br/>critérios de pronto<br/>estimativas<br/>quebra em tarefas"]
    R_S["Saídas<br/>desenho técnico / ADR<br/>critérios de pronto<br/>backlog priorizado"]
    R_E --> R_X --> R_S
  end

  subgraph Dev["3. Desenvolvimento"]
    direction TB
    Dev_E["Entradas<br/>backlog e aceite<br/>desenho técnico<br/>código existente<br/>ambiente pronto"]
    Dev_X["Execução<br/>implementar<br/>commits revisáveis<br/>testes unitários<br/>documentar mínimo<br/>CI"]
    Dev_S["Saídas<br/>código para validação<br/>PRs / commits<br/>testes unitários"]
    Dev_E --> Dev_X --> Dev_S
  end

  subgraph T["4. Testes"]
    direction TB
    T_E["Entradas<br/>código entregue<br/>cenários de aceite<br/>ambiente de teste<br/>casos de regressão"]
    T_X["Execução<br/>unitário / integração / E2E<br/>aceite por cenário<br/>regressão<br/>qualidade<br/>priorizar bugs"]
    T_S["Saídas<br/>evidência de aceite<br/>bugs priorizados<br/>relatório de resultados"]
    T_E --> T_X --> T_S
  end

  subgraph I["5. Implantação"]
    direction TB
    I_E["Entradas<br/>artefato aprovado<br/>checklist go-live<br/>config e segredos<br/>plano de rollback"]
    I_X["Execução<br/>build e release<br/>migrações<br/>deploy staging→prod<br/>smoke<br/>comunicar / rollback"]
    I_S["Saídas<br/>versão publicada<br/>notas de release<br/>evidência de go-live"]
    I_E --> I_X --> I_S
  end

  subgraph M["6. Manutenção"]
    direction TB
    M_E["Entradas<br/>sistema em produção<br/>monitoramento<br/>incidentes e feedback<br/>backlog e débito"]
    M_X["Execução<br/>monitorar e incidentes<br/>hotfixes<br/>melhorias<br/>débito técnico<br/>encaminhar mudanças"]
    M_S["Saídas<br/>estabilidade<br/>correções publicadas<br/>backlog atualizado"]
    M_E --> M_X --> M_S
  end

  D_S --> R_E
  R_S --> Dev_E
  Dev_S --> T_E
  T_S -->|aprovado| I_E
  I_S --> M_E
  M_S -.->|mudança relevante| D_E
  M_S -.->|ajuste técnico| R_E
```
