# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

## Ordem dos artefatos

Ordem **obrigatória** — não pular nem inverter:

1. **Vision** — [`vision.md`](vision.md): problema, para quem, objetivo, escopo in/out.
2. **Functionalities** — [`functionalities.md`](functionalities.md): capacidades observáveis do produto (base para EP/US).
3. **Cenários** — [`scenarios.md`](scenarios.md): catálogo EP → US → SC (sem Gherkin).
4. **BDDs** — [`bdds.md`](bdds.md): Dado / Quando / Então por **US** e por **SC**.
5. **Protótipo** — [`prototype.md`](prototype.md): validação visual/interativa do que foi especificado.
6. **Roadmap** — [`roadmap.md`](roadmap.md): Gantt / ordem de execução; épicos primeiro (paralelizáveis), depois estórias e cenários no plano.

Só depois disso: **separar cada estória** e seguir, **por estória**, os passos do [processo](../README.md): refinamento técnico → desenvolvimento → testes → implantação → manutenção.

Não atravessar o ciclo completo no produto inteiro de uma vez. O discovery fecha o mapa; a execução do processo é **por estória**.

## Hierarquia (no artefato de cenários)

| Nível | ID | O que é | Critério |
|-------|-----|---------|----------|
| **Épico** | EP- | Conjunto de estórias | Entrega **valor** observável ao usuário/negócio |
| **Estória** | US- | Função / operação **completa** do usuário | Uma capacidade fechada (início → fim) |
| **Cenário** | SC- | Mudança de **estado** + unidade **testável** e **paralelizável** | Estado A → ação → estado B; aceite e trabalho isoláveis. Toda US tem ≥1 SC (pode ser só um) |

Uma estória sozinha pode não entregar valor. O épico é o recorte mínimo em que o conjunto de estórias passa a entregar.

Exemplo — **épico Autenticação**: login isolado não entrega valor (não há como criar conta); login + cadastro juntos formam o épico.

```text
EP-01 — Autenticação          ← valor (entrar no produto)
├── US-01 — Cadastrar         ← operação completa
│   ├── SC-01 Abrir formulário
│   ├── SC-02 Preencher dados
│   └── SC-03 Confirmar cadastro
└── US-02 — Fazer login       ← operação completa
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

1. Escrever a **vision** (problema, personas, objetivo, fora de escopo)
2. Listar **functionalities** (capacidades observáveis derivadas da vision)
3. Derivar **cenários** (épicos → estórias → SC com entradas/execução/saídas)
4. Escrever **BDDs** (Gherkin alinhado a cada US/SC)
5. Produzir o **protótipo** (validar o *quê* com stakeholders)
6. Montar o **roadmap** (épicos → estórias → cenários no plano; definir atividades paralelizáveis nos épicos — assim estórias e SC ficam mais fáceis de encaixar)

## Saídas

| Ordem | Artefato | Conteúdo |
|-------|----------|----------|
| 1 | [`vision.md`](vision.md) | Visão do produto |
| 2 | [`functionalities.md`](functionalities.md) | Capacidades observáveis |
| 3 | [`scenarios.md`](scenarios.md) | EP → US → SC |
| 4 | [`bdds.md`](bdds.md) | Aceite Gherkin por US e SC |
| 5 | [`prototype.md`](prototype.md) / protótipo do projeto | Validação visual/interativa |
| 6 | [`roadmap.md`](roadmap.md) / roadmap do projeto | Plano / Gantt de execução |

## Próximo passo

Com vision → functionalities → cenários → BDDs → protótipo → roadmap fechados: **uma estória por vez** → [Refinamento técnico](../refinamento-tecnico/README.md) (e demais fases do [processo](../README.md)).
