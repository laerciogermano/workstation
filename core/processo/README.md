# Processo de desenvolvimento de software

Ciclo padrão da workstation:

```text
Discovery → Refinamento técnico → Desenvolvimento → Testes → Implantação → Manutenção
```

Cada etapa documenta **entradas**, **execução** e **saídas**.

## Como atacar

1. No [discovery](1.discovery/README.md), nesta ordem: **stories → epics (prioridade) → roadmap**; depois **refinar cada estória**: scenarios → BDDs → protótipo (se houver) → tasks.
2. **Depois**, aplicar o ciclo acima **por estória** (refinamento técnico → desenvolvimento → testes → implantação → manutenção).

O mapa e a prioridade nascem no discovery; o detalhe (SC/BDD) e o restante do processo rodam **estória a estória**.

| Etapa | Pasta | Objetivo |
|-------|-------|----------|
| Discovery | [`1.discovery/`](1.discovery/README.md) | Stories → epics → roadmap; refinar estória (scenarios → BDDs → protótipo? → tasks); depois ciclo por estória |
| Refinamento técnico | [`2.refinamento-tecnico/`](2.refinamento-tecnico/README.md) | Detalhar solução, riscos e critérios técnicos |
| Desenvolvimento | [`3.desenvolvimento/`](3.desenvolvimento/README.md) | Por IA na ordem do Gantt; sequencial/paralelo; próximo robô só após humano |
| Testes | [`4.testes/`](4.testes/README.md) | Validar comportamento e qualidade |
| Implantação | [`5.implantacao/`](5.implantacao/README.md) | Publicar em ambiente alvo |
| Manutenção | [`6.manutencao/`](6.manutencao/README.md) | Operar, corrigir e evoluir |

---

## 1. Discovery

**Entradas**

- Demanda / problema
- Contexto e restrições
- Stakeholders
- Dados e feedback

**Execução**

- Stories → epics (prioridade) → roadmap → refinar estória (scenarios → BDDs → protótipo se houver) → tasks

**Saídas**

- `1.stories.md`
- `2.epics.md`
- `3.roadmap.md`
- `4.scenarios.md`
- `5.bdds.md`
- Protótipo (opcional)
- `7.tasks.md` / `tasks.md`

---

## 2. Refinamento técnico

**Entradas**

- Stories + EP → US → SC + BDD
- Restrições
- Stack e padrões

**Execução**

- Desenhar arquitetura, contratos e dados
- Identificar riscos e mitigações
- Consolidar critérios de pronto
- Estimar esforço e dependências
- Quebrar em tarefas priorizadas
- Plano de implementação por épico **com árvore de arquivos**
- Criar pasta `tasks/` com uma atividade por **task do Gantt** (pasta = `TSK-<nn>-<titulo>`; Entradas · Execução · Saídas + documentação)

**Saídas**

- Desenho técnico / ADR
- Planos de implementação (incl. árvore de arquivos)
- Critérios de pronto
- Backlog priorizado
- `tasks/` (pastas `TSK-<nn>-<titulo>`; origem EP/US/SC só no README)

---

## 3. Desenvolvimento

**Entradas**

- Atividade em `tasks/` + aceite
- Gantt das tasks (ordem / dependências)
- Desenho técnico
- Repo remoto
- Board

**Execução** (tudo por IA / robôs, por atividade)

1. Baixar o projeto **dentro da pasta da atividade** em `tasks/`
2. Criar branch `TSK-<nn>-<titulo>` (= pasta da atividade)
3. Criar TDDs (**SC** → unitário com **mock/stub** · **US**/**EP** = BDD e2e **sem** doubles, app inteira)
4. Implementar a funcionalidade
5. Testar
6. Abrir PR (Summary + Test plan) e status → **Pendente aprovação**
7. Parar até validação humana

Ordem = Gantt das tasks. Sequencial → robô espera o outro. Paralelo → robôs em paralelo, PRs separados; próximo passo da árvore/Gantt só após aprovação. Corpo do PR: [padrão de escrita](3.desenvolvimento/README.md#padrão-de-escrita-do-pull-request). Tipo de teste: [por origem](3.desenvolvimento/README.md#tipo-de-teste-por-origem) · [unitários](3.desenvolvimento/README.md#unitários-isolados) · [e2e](3.desenvolvimento/README.md#bdd-e2e-sem-doubles).

**Saídas**

- Branch + TDDs + código
- PR aberto (Summary + Test plan)
- Board: Pendente aprovação (próximo robô só após humano)

---

## 4. Testes

**Entradas**

- Código entregue
- Cenários de aceite
- Ambiente de teste
- Casos de regressão

**Execução**

- SC sem suíte · unitário isolado (mock/stub) · US/EP = BDD e2e sem doubles (app inteira)
- Aceite US/EP no sistema real; componentes cobertos por unitário
- Regressão
- Qualidade
- Priorizar bugs

**Saídas**

- Evidência de aceite
- Bugs priorizados
- Relatório de resultados

---

## 5. Implantação

**Entradas**

- Artefato aprovado
- Checklist go-live
- Config e segredos
- Plano de rollback

**Execução**

- Build e release
- Migrações e configuração
- Deploy staging → prod
- Smoke pós-deploy
- Comunicar / rollback

**Saídas**

- Versão publicada
- Notas de release
- Evidência de go-live

---

## 6. Manutenção

**Entradas**

- Sistema em produção
- Monitoramento
- Incidentes e feedback
- Backlog e débito

**Execução**

- Monitorar e incidentes
- Hotfixes
- Melhorias incrementais
- Débito técnico
- Encaminhar mudanças

**Saídas**

- Estabilidade
- Correções publicadas
- Backlog atualizado
