# Docs — Flow.dev

Esteira enxuta (visão → protótipo). Detalhe de BDD/US fica no Plans quando compartilhado.

| Artefato | Papel |
|----------|--------|
| [`../README.md`](../README.md) | Visão · **IDR** (ID único ≠ nome) |
| [`prd.md`](prd.md) | PRD · requisito IDR |
| [`linguagem-flow.md`](linguagem-flow.md) | Conceito (artigo Flow), linguagem, transpilação JS · TS · C e uso no IDE |
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
| Explorar | Sem seção **Projetos**; **Funções** = só funções; **Dados** = lista plana de dados |
| Adicionar fluxo / dado | `+` em Funções e Dados; menu de contexto |
| Definir valor do dado | Painel no clique; com valor → concreto (sólido), sem valor → abstrato |
| Clique abre o detalhe | Clique seleciona e mostra **Editar · Filho · Irmão** (padrão da Árvore do Plans) |
| Agrupadores Pessoal / Site em Funções | Só funções, e o nome é sempre verbo |
| Ícone de função por tipo de agente | Sólido = tudo preenchido · preto = falta filha · vazado = sem responsável |
| Dado plano | Dado com campos filhos (opcional) e **Tipo** no painel |
| Seção **Arquivos** | **Módulos** (dados + funções); scripts próprios podem ser responsáveis |
| Seções fixas no Explorar | Todas as seções abrem e fecham |
| Teoria só em `docs/linguagem-flow.md` | **Explorar › Docs** (T-60…62): Fundamentos da linguagem com exemplo vivo do fluxo Onboarding Acme e botão que aplica cada conceito no Flow · código em `prototipo/docs.js` + `docs.css` |
