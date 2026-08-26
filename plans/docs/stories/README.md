# Histórias — Plans

Histórias de usuário derivadas de [`plans/README.md`](../../README.md). Critérios de aceite (BDD) ficam **dentro** de cada história.

Usar [`_TEMPLATE.md`](_TEMPLATE.md) para novas histórias.

## Pastas

| Épico | Pasta |
|-------|-------|
| EP-00 Fundamentos | [`ep-00-fundamentos/`](ep-00-fundamentos/) |
| EP-01 Board | [`ep-01-board/`](ep-01-board/) |
| EP-02 Gantt | [`ep-02-gantt/`](ep-02-gantt/) |
| EP-03 Árvore de execução | [`ep-03-arvore/`](ep-03-arvore/) |
| EP-04 Explorar | [`ep-04-explorar/`](ep-04-explorar/) |

## Índice

| ID | Título | Épico | Status |
|----|--------|-------|--------|
| [US-01](ep-00-fundamentos/US-01-mesma-unidade-trabalho.md) | Mesma unidade de trabalho | EP-00 | draft |
| [US-02](ep-00-fundamentos/US-02-vocabulario-por-visao.md) | Vocabulário por visão | EP-00 | draft |
| [US-03](ep-00-fundamentos/US-03-responsavel-pessoa.md) | Responsável pessoa | EP-00 | draft |
| [US-04](ep-00-fundamentos/US-04-responsavel-ia.md) | Responsável IA | EP-00 | draft |
| [US-05](ep-00-fundamentos/US-05-responsavel-prestador.md) | Responsável prestador | EP-00 | draft |
| [US-06](ep-00-fundamentos/US-06-responsavel-maquina.md) | Responsável máquina | EP-00 | draft |
| [US-07](ep-01-board/US-07-configurar-colunas.md) | Configurar colunas | EP-01 | draft |
| [US-08](ep-01-board/US-08-configurar-raias.md) | Configurar raias | EP-01 | draft |
| [US-09](ep-01-board/US-09-cadastrar-cards.md) | Cadastrar cards | EP-01 | draft |
| [US-10](ep-01-board/US-10-atribuir-responsaveis-board.md) | Atribuir responsáveis no board | EP-01 | draft |
| [US-11](ep-01-board/US-11-mover-cards.md) | Mover cards | EP-01 | draft |
| [US-12](ep-01-board/US-12-aninhar-cards.md) | Aninhar cards | EP-01 | draft |
| [US-13](ep-01-board/US-13-colunas-execucao.md) | Colunas de execução | EP-01 | draft |
| [US-14](ep-01-board/US-14-orquestrar-ia-board.md) | Orquestrar IA no board | EP-01 | draft |
| [US-15](ep-01-board/US-15-criar-chamado.md) | Criar chamado | EP-01 | draft |
| [US-16](ep-01-board/US-16-atender-chamado.md) | Atender chamado | EP-01 | draft |
| [US-17](ep-02-gantt/US-17-visualizar-ordens-tempo.md) | Visualizar ordens no tempo | EP-02 | draft |
| [US-18](ep-02-gantt/US-18-entradas-e-saidas.md) | Entradas e saídas | EP-02 | draft |
| [US-19](ep-02-gantt/US-19-responsaveis-gantt.md) | Responsáveis no Gantt | EP-02 | draft |
| [US-20](ep-02-gantt/US-20-tarefas-sequenciais.md) | Tarefas sequenciais | EP-02 | draft |
| [US-21](ep-02-gantt/US-21-tarefas-paralelas.md) | Tarefas paralelas | EP-02 | draft |
| [US-22](ep-02-gantt/US-22-aninhar-tarefas-gantt.md) | Aninhar tarefas no Gantt | EP-02 | draft |
| [US-23](ep-02-gantt/US-23-criar-planos.md) | Criar planos | EP-02 | draft |
| [US-24](ep-02-gantt/US-24-executar-planos-via-ais.md) | Executar planos via AIs | EP-02 | draft |
| [US-25](ep-02-gantt/US-25-flow-oriented-programming.md) | Flow Oriented Programming | EP-02 | draft |
| [US-26](ep-02-gantt/US-26-maquina-linguagem-gantt.md) | Máquina como linguagem no Gantt | EP-02 | draft |
| [US-27](ep-02-gantt/US-27-exportar-gantt-codigo.md) | Exportar Gantt como código | EP-02 | draft |
| [US-28](ep-02-gantt/US-28-linguagem-visual-unificada.md) | Linguagem visual unificada | EP-02 | draft |
| [US-29](ep-03-arvore/US-29-visualizar-arvore.md) | Visualizar árvore | EP-03 | draft |
| [US-30](ep-03-arvore/US-30-criar-atividades-filhas.md) | Criar atividades filhas | EP-03 | draft |
| [US-31](ep-03-arvore/US-31-hierarquia-infinita-arvore.md) | Hierarquia infinita na árvore | EP-03 | draft |
| [US-32](ep-03-arvore/US-32-responsaveis-arvore.md) | Responsáveis na árvore | EP-03 | draft |
| [US-33](ep-03-arvore/US-33-maquina-linguagem-arvore.md) | Máquina como linguagem na árvore | EP-03 | draft |
| [US-34](ep-04-explorar/US-34-persistir-como-arquivo.md) | Persistir como arquivo | EP-04 | draft |
| [US-35](ep-04-explorar/US-35-explorador-em-lista.md) | Explorador em lista | EP-04 | draft |
| [US-36](ep-04-explorar/US-36-navegacao-por-profundidade.md) | Navegação por profundidade | EP-04 | draft |

## Convenções

- Arquivo: `US-XX-slug.md` (numeração global)
- Status: `draft` → `ready` → `in-progress` → `done`
- Só refinar tecnicamente histórias com status `ready` (DoR)

## Definition of Ready (DoR)

- Épico pai identificado
- Valor e persona claros
- Critérios de aceite testáveis (incluindo borda/negativo quando couber)
- Notas com regras de negócio ainda abertas, se houver
- Sem dependência de regra de negócio indefinida bloqueante no README
