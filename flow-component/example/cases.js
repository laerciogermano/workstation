// Seed e casos compartilhados pelas páginas de exemplo (depende de window.FlowComponent)
const FC = FlowComponent;
/* ───────── snapshot de exemplo ───────── */
const el = (id, parentId, title, x = {}) => ({ id, planId: "p1", parentId, kind: "file", title, context: null, agentId: null, respId: null,
  status: null, error: null, progress: null, loop: null, cond: null, code: null, archived: false, position: 0, ins: [], outs: [], ...x });
const seed = () => ({
  plans: [{ id: "p1", name: "Vendas", position: 0 }],
  elements: [
    el("root", null, "Raiz", { kind: "folder" }),
    el("vender", "root", "Vender produto", { position: 0 }),
    el("cobrar", "vender", "Cobrar cliente", { position: 0, ins: ["cliente"], outs: [["pagamento", "out/pagamento.json"]] }),
    el("entregar", "vender", "Entregar pedido", { position: 1, agentId: "a-ana" }),
    el("faturar", "vender", "Faturar", { position: 2 }),
    el("notificar", "root", "Notificar cliente", { position: 1 }),
  ],
  links: [{ from: "cobrar", to: "entregar", kind: "seq" }, { from: "entregar", to: "faturar", kind: "seq" }],
  structs: [],
  agents: [
    { id: "a-ana", kind: "pessoa", name: "Ana", sub: "Logística", moduleFile: null, modelId: null, prompt: null, photoUrl: null, tasks: [] },
    { id: "a-fs", kind: "maquina", name: "node:fs", sub: "Lib Node.js", moduleFile: null, modelId: null, prompt: null, photoUrl: null, tasks: FC.DEFAULT_LIB_TASKS["node:fs"] },
    { id: "a-red", kind: "ia", name: "Redator", sub: "Textos", moduleFile: null, modelId: "m1", prompt: "Escreva curto.", photoUrl: null, tasks: [] },
  ],
  models: [{ id: "m1", name: "Opus", api: "claude-opus", vendor: "Anthropic", color: "#cc785c" }],
  modules: [{ id: "mod1", file: "vendas.layer.js", items: [] }],
  data: [
    { name: "cliente", type: "objeto", value: null, position: 0 },
    { name: "cliente.nome", type: "texto", value: "Maria", position: 1 },
    { name: "preco", type: "numero", value: "10", position: 2 },
    { name: "pagamento", type: "texto", value: null, position: 3 },
  ],
});

/* ───────── catálogo de casos ───────── */
// c(label, payload, {pre, noAdapters, disabled})  — pre: comandos aplicados antes (setup)
const c = (label, cmd, o = {}) => ({ label, cmd, ...o });
const GROUPS = [
  ["§5.1 Função e composição", [
    ["createFunction", [c("Novo fluxo com título", { type: "createFunction", planId: "p1", title: "Emitir nota" }), c("Título padrão", { type: "createFunction", planId: "p1" }), c("Plano inexistente", { type: "createFunction", planId: "zzz" }), c("Título em branco", { type: "createFunction", planId: "p1", title: "  " })]],
    ["createChild", [c("Filho de função folha", { type: "createChild", refId: "faturar", title: "Emitir recibo" }), c("Filho de composição (entra no fim, ligado em sequência)", { type: "createChild", refId: "vender", title: "Pós-venda" }), c("Referência inexistente", { type: "createChild", refId: "nope" })]],
    ["createSibling", [c("Irmão depois", { type: "createSibling", refId: "cobrar", position: "after", title: "Validar cartão" }), c("Irmão antes", { type: "createSibling", refId: "entregar", position: "before", title: "Embalar" }), c("Raiz do fluxo não ganha irmão", { type: "createSibling", refId: "root", position: "after" })]],
    ["renameFunction", [c("Renomear", { type: "renameFunction", id: "faturar", title: "Emitir fatura" }), c("Título vazio", { type: "renameFunction", id: "faturar", title: "" }), c("IDR inexistente", { type: "renameFunction", id: "nope", title: "x" })]],
    ["removeElements", [c("Remover folha (costura a sequência)", { type: "removeElements", ids: ["entregar"] }), c("Remover composição com filhos", { type: "removeElements", ids: ["vender"] }), c("Vários ids (filho já saiu com o pai)", { type: "removeElements", ids: ["vender", "cobrar"] }), c("Nenhum existe", { type: "removeElements", ids: ["nope"] })]],
    ["duplicate", [c("Duplicar composição (IDRs novos, “(cópia)”)", { type: "duplicate", id: "vender" }), c("IDR inexistente", { type: "duplicate", id: "nope" })]],
    ["archive", [c("Arquivar", { type: "archive", id: "entregar" }), c("Arquivar membro de if (sai do corpo)", { type: "archive", id: "faturar" }, { pre: [{ type: "setSelection", id: "faturar", on: true }] }), c("IDR inexistente", { type: "archive", id: "nope" })]],
    ["unarchive", [c("Desarquivar", { type: "unarchive", id: "entregar" }, { pre: [{ type: "archive", id: "entregar" }] })]],
    ["move", [c("Reordenar (antes)", { type: "move", id: "faturar", refId: "cobrar", mode: "before" }), c("Reparent (como filho)", { type: "move", id: "faturar", refId: "notificar", mode: "child" }), c("Para dentro de si mesmo", { type: "move", id: "vender", refId: "cobrar", mode: "child" }), c("Raiz não ganha irmão", { type: "move", id: "faturar", refId: "root", mode: "after" })]],
    ["paste", [c("Recortar e colar (cut)", { type: "paste", ids: ["cobrar"], mode: "cut", destId: "notificar" }), c("Copiar e colar (copy)", { type: "paste", ids: ["vender"], mode: "copy", destId: "notificar" }), c("Colar na raiz (destId null)", { type: "paste", ids: ["faturar"], mode: "copy", destId: null }), c("Cut para dentro de si", { type: "paste", ids: ["vender"], mode: "cut", destId: "cobrar" }), c("Lista vazia", { type: "paste", ids: [], mode: "copy", destId: null })]],
    ["patchFunction", [c("Título, contexto e código", { type: "patchFunction", id: "faturar", patch: { title: "Emitir fatura", context: "NF-e", code: "return {}" } }), c("I/O e for em lote", { type: "patchFunction", id: "faturar", patch: { ins: ["preco", "preco", "cliente"], outs: [["fatura"]], loop: ["item", "itens"] } }), c("Troca responsável (IA → status pendente)", { type: "patchFunction", id: "faturar", patch: { agentId: "a-red" } }), c("Responsável inexistente", { type: "patchFunction", id: "faturar", patch: { agentId: "nope" } }), c("Nome de dado inválido", { type: "patchFunction", id: "faturar", patch: { ins: ["1 ruim"] } })]],
    ["setSelection", [c("Ligar if (volta para a anterior)", { type: "setSelection", id: "entregar", on: true }), c("Desligar if", { type: "setSelection", id: "entregar", on: false }, { pre: [{ type: "setSelection", id: "entregar", on: true }] }), c("Desligar sem estar num if", { type: "setSelection", id: "entregar", on: false }), c("Só em folha", { type: "setSelection", id: "vender", on: true })]],
    ["setRepetition", [c("Ligar for (item/lista)", { type: "setRepetition", id: "entregar", on: true }), c("Desligar for", { type: "setRepetition", id: "entregar", on: false }, { pre: [{ type: "setRepetition", id: "entregar", on: true }] }), c("Só em folha", { type: "setRepetition", id: "vender", on: true })]],
    ["setParallel", [c("Ligar paralelo", { type: "setParallel", a: "entregar", b: "faturar", on: true }), c("Desligar paralelo", { type: "setParallel", a: "faturar", b: "entregar", on: false }, { pre: [{ type: "setParallel", a: "entregar", b: "faturar", on: true }] }), c("Mesma função", { type: "setParallel", a: "entregar", b: "entregar", on: true })]],
    ["setTryCatch", [c("Ligar try/catch (cria a função de tratamento)", { type: "setTryCatch", id: "cobrar", on: true }), c("Ligar numa composição inteira", { type: "setTryCatch", id: "vender", on: true }), c("Um único try cobrindo duas funções", { type: "setTryCatch", id: "cobrar", on: true, through: "entregar" }), c("Incluir mais uma função no try existente", { type: "setTryCatch", id: "cobrar", on: true, through: "entregar" }, { pre: [{ type: "setTryCatch", id: "cobrar", on: true }] }), c("Desligar try/catch (remove o tratamento intocado)", { type: "setTryCatch", id: "cobrar", on: false }, { pre: [{ type: "setTryCatch", id: "cobrar", on: true }] }), c("Desligar sem ter try", { type: "setTryCatch", id: "cobrar", on: false })]],
  ]],
  ["§5.2 Entrada / saída", [
    ["addInput", [c("Adicionar entrada (cria o dado)", { type: "addInput", id: "faturar", name: "desconto" }), c("Idempotente", { type: "addInput", id: "cobrar", name: "cliente" }), c("Nome inválido", { type: "addInput", id: "faturar", name: "1 ruim" })]],
    ["removeInput", [c("Remover entrada", { type: "removeInput", id: "cobrar", name: "cliente" }), c("Entrada inexistente", { type: "removeInput", id: "cobrar", name: "x" })]],
    ["addOutput", [c("Adicionar saída (ref padrão)", { type: "addOutput", id: "faturar", name: "fatura" }), c("Com referência própria", { type: "addOutput", id: "faturar", name: "fatura", ref: "s3://notas/fatura.pdf" })]],
    ["removeOutput", [c("Remover saída", { type: "removeOutput", id: "cobrar", name: "pagamento" }), c("Saída inexistente", { type: "removeOutput", id: "cobrar", name: "x" })]],
    ["setCond", [c("Definir condição", { type: "setCond", id: "faturar", cond: { test: "preco", gotoId: "cobrar" } }), c("Limpar condição", { type: "setCond", id: "faturar", cond: null }), c("Destino inexistente", { type: "setCond", id: "faturar", cond: { test: "preco", gotoId: "nope" } })]],
    ["setCatch", [c("Definir o tratamento", { type: "setCatch", id: "cobrar", handlerId: "faturar" }), c("Try na composição inteira", { type: "setCatch", id: "vender", handlerId: "notificar" }), c("Um try cobrindo várias funções (de cobrar até faturar)", { type: "setCatch", id: "cobrar", handlerId: "notificar", through: "faturar" }), c("Tirar uma função do try (as outras continuam)", { type: "setCatch", id: "entregar", handlerId: null }, { pre: [{ type: "setCatch", id: "cobrar", handlerId: "notificar", through: "faturar" }] }), c("through antes de id", { type: "setCatch", id: "faturar", handlerId: "notificar", through: "cobrar" }), c("Limpar o tratamento", { type: "setCatch", id: "cobrar", handlerId: null }, { pre: [{ type: "setCatch", id: "cobrar", handlerId: "faturar" }] }), c("Tratamento inexistente", { type: "setCatch", id: "cobrar", handlerId: "nope" }), c("Tratamento dentro do próprio try", { type: "setCatch", id: "vender", handlerId: "cobrar" })]],
    ["setLoopVars", [c("Definir variável/coleção", { type: "setLoopVars", id: "entregar", loop: ["pedido", "pedidos"] }), c("Limpar", { type: "setLoopVars", id: "entregar", loop: null }), c("Variável vazia", { type: "setLoopVars", id: "entregar", loop: ["", "xs"] })]],
  ]],
  ["§5.3 Dados", [
    ["createData", [c("Criar dado", { type: "createData", name: "frete", dataType: "numero" }), c("Já existe", { type: "createData", name: "preco" }), c("Nome inválido", { type: "createData", name: "a b" })]],
    ["upsertData", [c("Alterar valor", { type: "upsertData", name: "preco", value: "25" }), c("Criar com tipo", { type: "upsertData", name: "ativo", dataType: "booleano", value: "true" }), c("Associar a um arquivo", { type: "upsertData", name: "preco", moduleFile: "vendas.layer.js" }), c("Arquivo inexistente", { type: "upsertData", name: "preco", moduleFile: "x.js" })]],
    ["clearDataValue", [c("Limpar valor (abstrato)", { type: "clearDataValue", name: "preco" }), c("Dado inexistente", { type: "clearDataValue", name: "nope" })]],
    ["addDataChild", [c("Campo filho (folha vira cubo)", { type: "addDataChild", parent: "preco", name: "moeda" }), c("Campo já existe", { type: "addDataChild", parent: "cliente", name: "nome" }), c("Pai inexistente", { type: "addDataChild", parent: "nope", name: "x" })]],
    ["toggleCube", [c("Folha → cubo", { type: "toggleCube", name: "preco" }), c("Cubo → folha (sem filhos)", { type: "toggleCube", name: "preco" }, { pre: [{ type: "toggleCube", name: "preco" }] }), c("Cubo com filhos não vira folha", { type: "toggleCube", name: "cliente" })]],
  ]],
  ["§5.4 Responsável · task · catálogo", [
    ["assignResponsible", [c("Pessoa (status zera)", { type: "assignResponsible", id: "faturar", agentId: "a-ana" }), c("Lib concreta (título vira task)", { type: "assignResponsible", id: "faturar", agentId: "a-fs" }), c("IA (status pendente)", { type: "assignResponsible", id: "faturar", agentId: "a-red" }), c("Arquivo virtual", { type: "assignResponsible", id: "faturar", agentId: "file:mod1" }), c("Limpar responsável", { type: "assignResponsible", id: "entregar", agentId: null }), c("Responsável inexistente", { type: "assignResponsible", id: "faturar", agentId: "nope" })]],
    ["setTask", [c("Task concreta válida", { type: "setTask", id: "faturar", task: "writeFile" }, { pre: [{ type: "assignResponsible", id: "faturar", agentId: "a-fs" }] }), c("Task fora da lib", { type: "setTask", id: "faturar", task: "voar" }, { pre: [{ type: "assignResponsible", id: "faturar", agentId: "a-fs" }] }), c("Abstrato: verbo livre", { type: "setTask", id: "entregar", task: "Conferir endereço" })]],
    ["createAgent", [c("Lib Node (tasks padrão)", { type: "createAgent", kind: "maquina", name: "node:path" }), c("IA (herda 1º modelo)", { type: "createAgent", kind: "ia", name: "Revisor", prompt: "Revise." }), c("Modelo inexistente", { type: "createAgent", kind: "ia", name: "X", modelId: "nope" })]],
    ["createPerson", [c("Pessoa", { type: "createPerson", name: "Bruno", sub: "Financeiro" }), c("Nome vazio", { type: "createPerson", name: " " })]],
    ["patchAgent", [c("Renomear e trocar modelo", { type: "patchAgent", id: "a-red", patch: { name: "Redator Sênior", prompt: "Seja direto." } }), c("Foto inválida", { type: "patchAgent", id: "a-ana", patch: { photoUrl: "http://x/y.png" } }), c("Inexistente", { type: "patchAgent", id: "nope", patch: {} })]],
    ["removeAgent", [c("Remover agente livre", { type: "removeAgent", id: "a-red" }), c("Em uso por uma função", { type: "removeAgent", id: "a-ana" })]],
    ["createModel", [c("Criar modelo", { type: "createModel", name: "Sonnet", api: "claude-sonnet", vendor: "Anthropic", color: "#3b82f6" }), c("Cor inválida", { type: "createModel", name: "X", api: "x", vendor: "y", color: "azul" })]],
    ["patchModel", [c("Alterar cor", { type: "patchModel", id: "m1", patch: { color: "#111111" } }), c("Inexistente", { type: "patchModel", id: "nope", patch: {} })]],
    ["removeModel", [c("Em uso por agente", { type: "removeModel", id: "m1" }), c("Livre (depois de remover o agente)", { type: "removeModel", id: "m1" }, { pre: [{ type: "removeAgent", id: "a-red" }] })]],
  ]],
  ["§5.5 Arquivos / módulos", [
    ["createModule", [c("Nome automático", { type: "createModule" }), c("Nome explícito", { type: "createModule", file: "estoque.layer.js" }), c("Já existe", { type: "createModule", file: "vendas.layer.js" }), c("Nome inválido", { type: "createModule", file: "sem-extensao" })]],
    ["renameModule", [c("Renomear", { type: "renameModule", id: "mod1", file: "vendas-v2.layer.js" }), c("Colisão", { type: "renameModule", id: "mod1", file: "b.js" }, { pre: [{ type: "createModule", file: "b.js" }] }), c("Inexistente", { type: "renameModule", id: "nope", file: "x.js" })]],
    ["deleteModule", [c("Apagar (limpa responsáveis que o usavam)", { type: "deleteModule", id: "mod1" }, { pre: [{ type: "assignResponsible", id: "faturar", agentId: "file:mod1" }] }), c("Inexistente", { type: "deleteModule", id: "nope" })]],
  ]],
  ["§5.6–5.7 Execução e exportação (portas do host)", [
    ["runPlan", [c("Com Runner injetado", { type: "runPlan", planId: "p1" }), c("Sem Runner → unsupported", { type: "runPlan", planId: "p1" }, { noAdapters: true })]],
    ["cancelRun", [c("Cancelar execução", { type: "cancelRun", planId: "p1" })]],
    ["completeStep", [c("Pessoa conclui etapa", { type: "completeStep", id: "entregar" })]],
    ["retryStep", [c("Retentar etapa", { type: "retryStep", id: "entregar" })]],
    ["runMachine", [c("Rodar etapa máquina", { type: "runMachine", id: "faturar" }), c("Runner falha → failed", { type: "runMachine", id: "nope" })]],
    ["exportPlan", [c("TypeScript", { type: "exportPlan", planId: "p1", format: "ts" }), c("JavaScript", { type: "exportPlan", planId: "p1", format: "js" }), c("Python", { type: "exportPlan", planId: "p1", format: "py" }), c("IR", { type: "exportPlan", planId: "p1", format: "ir" }), c("Sem Exporter → unsupported", { type: "exportPlan", planId: "p1", format: "ts" }, { noAdapters: true })]],
  ]],
  ["Contrato: desabilitar comando no host", [
    ["disabled", [c("removeElements desabilitado", { type: "removeElements", ids: ["entregar"] }, { disabled: ["removeElements"] }), c("createChild desabilitado (os demais seguem)", { type: "createChild", refId: "faturar" }, { disabled: ["createChild"] })]],
  ]],
];

