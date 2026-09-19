# Processo de desenvolvimento de software

Ciclo padrão da workstation:

```text
Discovery → Refinamento técnico → Desenvolvimento → Testes → Implantação → Manutenção
```

Cada etapa documenta **entradas**, **execução** e **saídas**.

## Como atacar

1. No [discovery](1.discovery/README.md), nesta ordem: **stories → epics → cenários → BDDs → protótipo → roadmap → tasks**.
2. **Depois**, separar **cada estória** e aplicar o ciclo acima **por estória** (refinamento técnico → desenvolvimento → testes → implantação → manutenção).

O mapa nasce no discovery; o restante do processo roda **estória a estória**, não no produto inteiro de uma vez.

| Etapa | Pasta | Objetivo |
|-------|-------|----------|
| Discovery | [`1.discovery/`](1.discovery/README.md) | Stories → epics → cenários → BDDs → protótipo → roadmap → tasks; depois ciclo por estória |
| Refinamento técnico | [`2.refinamento-tecnico/`](2.refinamento-tecnico/README.md) | Detalhar solução, riscos e critérios técnicos |
| Desenvolvimento | [`3.desenvolvimento/`](3.desenvolvimento/README.md) | Implementar o que foi acordado |
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

- Stories → epics → cenários → BDDs → protótipo → roadmap → tasks

**Saídas**

- `1.stories.md`
- `2.epics.md`
- `3.scenarios.md`
- `4.bdds.md`
- Protótipo
- `6.roadmap.md`
- `tasks.md`

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

**Saídas**

- Desenho técnico / ADR
- Critérios de pronto
- Backlog priorizado

---

## 3. Desenvolvimento

**Entradas**

- Backlog e aceite
- Desenho técnico
- Código existente
- Ambiente pronto

**Execução**

- Implementar conforme aceite
- Commits pequenos e revisáveis
- Lote: primeiro caso, depois escala
- Testes unitários
- Documentar o mínimo
- Integrar com CI

**Saídas**

- Código para validação
- PRs / commits
- Testes unitários

---

## 4. Testes

**Entradas**

- Código entregue
- Cenários de aceite
- Ambiente de teste
- Casos de regressão

**Execução**

- Unitário / integração / E2E
- Aceite por cenário
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
