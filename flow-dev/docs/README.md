# Docs — Flow.dev

Esteira enxuta (visão → protótipo). Detalhe de BDD/US fica no Plans quando compartilhado.

| Artefato | Papel |
|----------|--------|
| [`../README.md`](../README.md) | Visão |
| [`../prototipo/`](../prototipo/) | Protótipo alta fidelidade (Flow IDE) |
| [`../deploy/README.md`](../deploy/README.md) | Publicação `flow-ide.laerciogermano.com` |
| [`../config/config-ia.md`](../config/config-ia.md) | Regras para a IA |
| [`../inputs/`](../inputs/README.md) | Refs visuais / teoria |

**Antes → depois:** produto só no Plans `#T-32` → IDE próprio Flow.dev.

**Voltar:** apontar centralizador de volta para Plans `#T-32` e arquivar `flow-dev/`.

### UI recente (`prototipo/index.html`)

| Antes | Depois |
|-------|--------|
| Seção Explorar **Layers** | **Arquivos** |
| Só **Exportar** na barra | **Executar** + **Exportar** |
| Ícone Node preenchido com brand | Fundo branco; ícone/borda verde (`--ok` / brand) |
| Dado abstrato só se nunca produzido no plano | Abstrato = fora da **camada** (ex.: `dados_cliente` na Ativação = ■ preto) |
| Parâmetro FOP `context` | `state` (`function f(state)`, export JS) |
| Cubos em Arquivos/Estados | Abstrato = ■ preto · concreto = □ branco |
| Pessoas / Agentes no Explorar | Avatar com iniciais (ou foto); agente IA leva selo bot |
| Seção Explorar **Planos** | **Projetos**; dentro: **Funções** + **Dados** (antes “Planos” / “Estados”) |
