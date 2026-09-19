# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

Artefato único: o [documento de funcionalidades](funcionalidades.md).

## Hierarquia

| Nível | ID | O que é | Critério |
|-------|-----|---------|----------|
| **Épico** | EP- | Conjunto de estórias | Entrega **valor** observável ao usuário/negócio |
| **Estória** | US- | Função / operação **completa** do usuário | Uma capacidade fechada (início → fim) |
| **Cenário** | SC- | Mudança de **estado visual** | Estado A → ação → estado B na UI |

Uma estória sozinha pode não entregar valor. O épico é o recorte mínimo em que o conjunto de estórias passa a entregar.

Exemplo — **épico Autenticação**: login isolado não entrega valor (não há como criar conta); login + cadastro juntos formam o épico.

```text
EP — Autenticação          ← valor (entrar no produto)
├── US — Cadastrar         ← operação completa
│   ├── SC — Abrir formulário
│   ├── SC — Preencher dados
│   └── SC — Confirmar cadastro
└── US — Fazer login       ← operação completa
    ├── SC — Abrir formulário
    ├── SC — Preencher credenciais
    └── SC — Sessão autenticada
```

## Entradas

- Demanda, ideia ou problema reportado
- Contexto de negócio e restrições conhecidas
- Stakeholders e usuários envolvidos
- Dados existentes (métricas, feedback, concorrência)

## Execução

- Mapear problema, usuários e valor esperado
- Delimitar escopo (in / out)
- Recortar **épicos** (conjuntos de estórias que entregam valor)
- Para cada épico, listar as **estórias** (operações completas do usuário)
- Para cada estória, listar os **cenários** (mudanças de estado visual)
- Validar o conjunto com stakeholders

## Saídas

### Documento de funcionalidades

Catálogo organizado em **épicos → estórias → cenários**.

| Campo | Conteúdo |
|-------|----------|
| **Épico** | Valor entregue pelo conjunto de estórias |
| **Estória** | Operação completa do usuário (ex.: criar usuário, fazer login) |
| **Cenários** | Mudanças de estado visual necessárias para completar a estória |

**Cenário** = uma mudança de estado **visual** (estado anterior → ação → estado resultante) exigida para completar a estória.

Exemplo — estória **Criar usuário** (no épico Autenticação ou equivalente):

| # | Cenário | Mudança de estado visual |
|---|---------|--------------------------|
| 1 | Clicar no botão criar | Lista → modal aberto |
| 2 | Digitar o nome | Modal sem nome → modal com nome visível |
| 3 | Clicar em salvar | Botão ativo → carregando/inativado → janela fechada e unidade salva na lista |

Modelo e regras: [`funcionalidades.md`](funcionalidades.md).

## Próximo passo

→ [Refinamento técnico](../refinamento-tecnico/README.md) — arquitetura, riscos e backlog técnico a partir do documento de funcionalidades
