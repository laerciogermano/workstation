# Super Portal — Protótipo v2

**Por quê:** ver o portal inteiro funcionando, em desktop e celular, antes de escrever PRD e histórias.
**Importante:** é protótipo. Integrações (SEFAZ, banco, e-mail, WhatsApp, CEP, importação do legado) são simuladas; pessoas, empresas, CNPJs e valores são fictícios.
**No fluxo:** [visão](../README.md) → [docs](../docs/README.md) → **protótipo** → PRD / histórias → implementação.

## Abrir

`index.html` direto no navegador (sem build). No celular, sirva a pasta e use `#app`:

```bash
cd super-portal/prototipo && python3 -m http.server 8000
# celular na mesma rede: http://<ip-do-computador>:8000/#app
```

| Link | Abre |
|------|------|
| `index.html` | apresentação, galeria, tendências e cobertura |
| `index.html#F09` | tela no desktop |
| `index.html#F09:m` | no celular |
| `index.html#F09:2` | os dois lado a lado |
| `index.html#app` | o portal em tela cheia (formato segue a largura) |
| `?tenant=t2&tema=dark` | marca e tema |

Atalhos no player: `← →` telas, `⌫` voltar, `D` formato, `⌘K` buscar, `Esc` fechar.

## O que tem

114 telas, cada uma em desktop e celular. A versão anterior (75 telas) está em [`v1/`](v1/index.html), para comparar.

| Épico | Features |
|-------|----------|
| E01 · Autenticação e acesso | F01, F02, F03, F04, F05, F06, F07, F08 |
| E02 · Orçamentos | F09, F10, F11, F12, F13, F14 |
| E03 · Pedidos | F15, F16, F17, F18, F19, F20 |
| E04 · Operação e logística | F21, F22, F23, F24, F25, F26, F27, F28, F29, F30, F31 |
| E05 · Cadastros, painel e marca | F32, F33, F34, F35, F36, F37, F38, F39, F40, F41, F42, F43 |
| E06 · Notas fiscais e integrações | F44, F45, F46, F47, F48, F49, F50 |
| E07 · Financeiro | F51, F52, F53, F54, F55, F56, F57, F58, F59, F60 |
| E08 · Automação e fila de decisão | F61, F62, F63, F64, F65, F66, F67, F68, F69 |
| E09 · Portal do cliente | F70, F71, F72, F73, F74, F75, F76, F77 |
| E10 · Chamados e notificações | F78, F79, F80, F81 |
| E11 · Visão do investidor | F82 |
| E12 · Kanban | F83, F84, F85, F86 |
| E13 · Inteligência artificial | F87, F88, F89, F90 |
| E14 · Campanhas de e-mail marketing | F91, F92, F93, F94 |
| E15 · Dashboards | F95, F96, F97, F98 |
| E16 · Leads | F99, F100, F101, F102, F103 |
| E17 · Gamificação de vendedores | F104, F105, F106, F107, F108, F109 |
| E18 · Automação de orçamentos | F110, F111, F112, F113, F114 |

**Estado de verdade (em memória, reinicia ao recarregar):** aprovar orçamento cria o pedido; marcar todos os itens como “Chegou” prepara a NF-e (ou pede os dados que faltam); autorizar a nota cria parcelas e boleto; quitar a última parcela conclui o pedido; contra proposta do cliente entra na fila. Ações têm recibo e desfazer (emitir e cancelar nota não).

**Cenários** no painel lateral: papel (administrador, vendedor, logística, investidor, cliente), tenant, tema, automação pausada, “acessando como”.

## O que a v2 trouxe

| Área | Mudança |
|------|---------|
| Registro | pedido, nota e cliente viram página de leitura: próximo passo com o motivo, linha do tempo com comentários e `@menção`, trilho com cliente, risco, entrega, pagamento e documentos |
| Tabelas | ordenação, cabeçalho fixo, uma ação visível e o resto em “⋯”, colunas, densidade, paginação e total |
| Formulários | máscara, CNPJ (numérico e alfanumérico) e CPF com dígito verificador, erro no campo ao sair, resumo no envio, aviso de alterações não salvas |
| Inteligência | resumo do dia, busca em linguagem natural que mostra o que entendeu, risco explicado, última venda do item ao cliente (regras locais, sem modelo de IA) |
| Navegação | barra lateral enxuta, central de Ajustes, trilha de localização, troca de marca, atalhos de teclado (`?`) |
| Financeiro | tela de cobrança por tempo de atraso, com mensagem revisável e régua |
| Estados | esqueleto, sem conexão com fila de envio, falha com saída, SEFAZ com andamento |
| Celular | título que encolhe, botão de ação flutuante, deslizar na fila (com alternativa por toque), instalável quando servido por http |

Cenário novo no player: **Rede** (normal, lenta, sem conexão, falha).

## Épicos

A lista de telas à esquerda do player é agrupada por épico e mostra só o que a persona escolhida acessa. Filtro **Épico** em **Cenários**, no painel de detalhes do player: `Tudo` e `E01 - título` até `E18 - título`. Ao escolher um, o portal e a lista de telas mostram só o que existe **até aquela fase** (cumulativo): menu, abas do celular, busca, botões e blocos das telas; regras automáticas só rodam a partir do E08. A **E01** é só autenticação e acesso (entrar, recuperar senha, sem acesso, saída, minha conta, vendedores, funcionários e permissões) e vale para os cinco papéis; quem ainda não tem módulo na fase chega em “Minha conta”. A **E02** são os orçamentos, a **E03**, os pedidos, e a **E04**, operação e logística. As telas de cada papel entram nas fases delas (portal do cliente no E09, investidor no E11).

Na apresentação (`index.html`), a galeria é separada por épico, de E01 a E18; o filtro não a altera: galeria, tendências e cobertura mostram sempre o produto completo. No modo tela cheia não há painel, então não há como trocar a fase ali. O que entra em cada fase: [`../docs/epics.md`](../docs/epics.md).

## Cobertura

Calculada na própria página a partir dos metadados das telas: 20/20 prints do legado, 42/42 itens do mapa de processos, 11/11 capacidades da visão.

A cobertura é por tela. Simplificado em relação ao legado: as observações com editor de texto rico viraram campo de texto simples; “subfranqueado” virou “unidade” (CNPJ emitente).

## Direção de design

Duas rodadas de pesquisa em 2026-11-27; práticas, telas e fontes na seção “O que há de atual no desenho” do `index.html`. Resumo: interface calma, fila só por exceção com o conteúdo exato da ação, autonomia por regra (sugerir, preparar, executar), pausa e desfazer, ⌘K, painel lateral no desktop, registro empilhado e folha inferior no celular, tema derivado das cores do tenant com contraste conferido. A marca ConectMax é só o tenant de exemplo (logos de [`inputs/identidade-visual/`](../inputs/identidade-visual/)); há mais dois fictícios.

## Além do legado e ainda fora da modelagem

- Inventados no protótipo, a validar: fila de decisão, regras de automação, templates, leitura de ordem de compra, portal do cliente, margem mínima e parâmetros, quadros, copiloto em chat (lista, ensina e escreve; respostas simuladas por regras locais, sem modelo), campanhas de e-mail (envio e métricas simulados), dashboards e leads (formulário e importação simulados) gamificação de vendedores e automação de orçamentos (leitura dos pedidos por regras simples; fornecedores e envios simulados).
- Entidades sem lugar em [`docs/modelagem-dados.md`](../docs/modelagem-dados.md): fornecedor, transportadora, banco, funcionário, chamado, notificação, regra, template, item de orçamento.

## Arquivos

| Arquivo | O que é |
|---------|---------|
| `index.html` | apresentação, galeria e player |
| `styles/portal.css` | o portal (claro, escuro, desktop, celular) |
| `styles/site.css` | apresentação e player |
| `js/util.js` | formatação, ícones, cores do tenant |
| `js/data.js` | dados de exemplo |
| `js/domain.js` | totais, etapas, automação, fila |
| `js/ui.js` | componentes |
| `js/kit.js` | validação, risco, próximo passo, página de registro, busca natural |
| `js/epicos.js` | fases (épicos) e o filtro do que cada uma libera |
| `js/screens/*.js` | telas |
| `js/app.js` | casca, navegação, eventos, galeria, cobertura |
| `assets/` | logos do tenant ConectMax e ícone do app |
| `manifest.webmanifest`, `sw.js` | instalação e cópia local (só em http) |
| `v1/` | versão anterior, completa |

## Rollback

Voltar à v1 sem apagar a v2: abrir `v1/index.html`. Substituir a v2 pela v1:

```bash
cd super-portal/prototipo && rm -rf js styles assets index.html manifest.webmanifest sw.js && cp -R v1/index.html v1/js v1/styles v1/assets . 
```
