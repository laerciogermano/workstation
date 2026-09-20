# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

## Ordem dos artefatos

Ordem **obrigatória** — não pular nem inverter:

1. **Stories** — [`1.stories.md`](1.stories.md): US com título + descrição de como funciona.
2. **Epics** — [`2.epics.md`](2.epics.md): EP que agrupam US, entregam valor e têm **prioridade**.
3. **Roadmap** — [`3.roadmap.md`](3.roadmap.md): Gantt EP → US com a prioridade dos épicos (sem SC; barra = duração da atividade).
4. **Cenários** — [`4.scenarios.md`](4.scenarios.md): refinar cada US → SC (sem Gherkin; arquivo único).
5. **BDDs** — [`5.bdds.md`](5.bdds.md): Dado / Quando / Então por **US** e por **SC** (arquivo único).
6. **Protótipo** — [`6.prototype.md`](6.prototype.md): opcional; validação visual/interativa do que foi especificado.
7. **Tasks** — [`7.tasks.md`](7.tasks.md) / `tasks.md` do projeto: Gantt TSK + EP/US/SC em cada barra + inventário.

A **visão do produto** (problema, para quem, objetivo, fora de escopo) fica no `README.md` do projeto.

Fluxo em duas fases:

1. **Mapa e prioridade:** stories → epics (com prioridade) → roadmap.
2. **Refinar cada estória** (na ordem do roadmap): cenários → BDDs → protótipo (se houver) → depois tasks.

Só depois disso: seguir, **por estória**, os passos do [processo](../README.md): refinamento técnico → desenvolvimento → testes → implantação → manutenção.

Não atravessar o ciclo completo no produto inteiro de uma vez. O discovery fecha o mapa e a prioridade; o detalhe (SC/BDD/protótipo) e a execução do processo são **por estória**.

## Hierarquia

| Nível | ID | O que é | Critério |
|-------|-----|---------|----------|
| **Estória** | US- | Função / operação **completa** do usuário | Uma capacidade fechada (início → fim) |
| **Épico** | EP- | Conjunto de estórias ([`2.epics.md`](2.epics.md)) | Entrega **valor** observável; tem prioridade no roadmap |
| **Cenário** | SC- | Mudança de **estado** + unidade **testável** e **paralelizável** | Estado A → ação → estado B; aceite e trabalho isoláveis. Toda US tem ≥1 SC (pode ser só um) |

Uma estória sozinha pode não entregar valor. O épico (artefato 2) é o recorte mínimo em que o conjunto de estórias passa a entregar.

```text
US-01 — Cadastrar         ← operação completa
US-02 — Fazer login       ← operação completa

EP-01 — Autenticação      ← valor (entrar no produto); agrupa US-01 + US-02 em 2.epics

US-01 — Cadastrar
├── SC-01 Abrir formulário
├── SC-02 Preencher dados
└── SC-03 Confirmar cadastro

US-02 — Fazer login
├── SC-04 Abrir formulário
├── SC-05 Preencher credenciais
└── SC-06 Sessão autenticada
```

## Entradas

- Demanda, ideia ou problema reportado
- Contexto de negócio e restrições conhecidas
- Stakeholders e usuários envolvidos
- Dados existentes (métricas, feedback, concorrência)

## Execução

1. Escrever as **stories** (US título + como funciona)
2. Agrupar em **epics** (valor + **prioridade** por EP)
3. Montar o **roadmap** (EP/US na ordem de prioridade)
4. **Refinar cada estória** (seguir a prioridade do roadmap):
   - derivar **cenários** (US → SC)
   - escrever **BDDs** (Gherkin por US/SC)
   - produzir **protótipo** se houver necessidade de validação visual
5. Montar as **tasks** (TSK + ID EP/US/SC em cada barra)

## Saídas

| Ordem | Artefato | Conteúdo |
|-------|----------|----------|
| 1 | [`1.stories.md`](1.stories.md) | US título + descrição |
| 2 | [`2.epics.md`](2.epics.md) | EP → lista de US + prioridade |
| 3 | [`3.roadmap.md`](3.roadmap.md) / roadmap do projeto | Gantt EP/US priorizado |
| 4 | [`4.scenarios.md`](4.scenarios.md) | US → SC (arquivo único) |
| 5 | [`5.bdds.md`](5.bdds.md) | Aceite Gherkin por US e SC (arquivo único) |
| 6 | [`6.prototype.md`](6.prototype.md) / protótipo do projeto | Opcional; validação visual/interativa |
| 7 | [`7.tasks.md`](7.tasks.md) / `tasks.md` do projeto | Gantt TSK + EP/US/SC + inventário |

## Próximo passo

Com stories → epics → roadmap fechados e, por estória, scenarios → BDDs → (protótipo) → tasks: **uma estória por vez** → [Refinamento técnico](../2.refinamento-tecnico/README.md) (e demais fases do [processo](../README.md)).
