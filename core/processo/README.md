# Processo de desenvolvimento de software

Ciclo padrão da workstation:

```text
Discovery → Refinamento técnico → Desenvolvimento → Testes → Implantação → Manutenção
```

Cada etapa documenta **entradas**, **execução** e **saídas**.

## Como atacar

1. No [discovery](discovery/README.md), nesta ordem: **vision → features → cenários → BDDs → protótipo → roadmap**.
2. **Depois**, separar **cada estória** e aplicar o ciclo acima **por estória** (refinamento técnico → desenvolvimento → testes → implantação → manutenção).

O mapa nasce no discovery; o restante do processo roda **estória a estória**, não no produto inteiro de uma vez.

| Etapa | Pasta | Objetivo |
|-------|-------|----------|
| Discovery | [`discovery/`](discovery/README.md) | Vision → features → cenários → BDDs → protótipo → roadmap; depois ciclo por estória |
| Refinamento técnico | [`refinamento-tecnico/`](refinamento-tecnico/README.md) | Detalhar solução, riscos e critérios técnicos |
| Desenvolvimento | [`desenvolvimento/`](desenvolvimento/README.md) | Implementar o que foi acordado |
| Testes | [`testes/`](testes/README.md) | Validar comportamento e qualidade |
| Implantação | [`implantacao/`](implantacao/README.md) | Publicar em ambiente alvo |
| Manutenção | [`manutencao/`](manutencao/README.md) | Operar, corrigir e evoluir |

---

## 1. Discovery

**Entradas**

- Demanda / problema
- Contexto e restrições
- Stakeholders
- Dados e feedback

**Execução**

- Vision → features → cenários → BDDs → protótipo → roadmap

**Saídas**

- `vision.md`
- `features.md`
- `scenarios.md`
- `bdds.md`
- Protótipo
- `roadmap.md`

---

## 2. Refinamento técnico

**Entradas**

- Vision + EP → US → SC + BDD
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
