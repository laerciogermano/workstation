# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

Artefato único: o [documento de funcionalidades](funcionalidades.md).

## Entradas

- Demanda, ideia ou problema reportado
- Contexto de negócio e restrições conhecidas
- Stakeholders e usuários envolvidos
- Dados existentes (métricas, feedback, concorrência)

## Execução

- Mapear problema, usuários e valor esperado
- Delimitar escopo (in / out)
- Recortar **todas as funcionalidades maiores** no documento de funcionalidades
- Para cada funcionalidade, listar os **cenários** (mudanças de estado necessárias para executar a ação)
- Validar o conjunto com stakeholders

## Saídas

### Documento de funcionalidades

Catálogo das **funcionalidades maiores** do produto. Cada funcionalidade é uma **ação** no sistema.

Cada funcionalidade traz:

| Campo | Conteúdo |
|-------|----------|
| **Título** | Nome da ação (ex.: criar usuário) |
| **Descrição** | O que a ação faz e para quem / por quê |
| **Cenários** | Mudanças de estado necessárias para executar a ação |

**Cenário** = uma mudança de estado do sistema (estado anterior → ação → estado resultante) exigida para completar a funcionalidade.

Exemplo — funcionalidade **Criar usuário**:

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Clicar no botão criar | Lista → modal aberto |
| 2 | Digitar o nome | Modal sem nome → modal com nome visível |
| 3 | Clicar em salvar | Botão ativo → carregando/inativado → janela fechada e unidade salva na lista |

Modelo e regras: [`funcionalidades.md`](funcionalidades.md).

## Próximo passo

→ [Refinamento técnico](../refinamento-tecnico/README.md) — arquitetura, riscos e backlog técnico a partir do documento de funcionalidades
