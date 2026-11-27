# Super Portal — Épicos

**Status:** proposta, a validar.
**Por quê:** ordenar a construção em entregas cumulativas e ver, no protótipo, o que existe em cada fase.
**Importante:** cada tela do protótipo entra em exatamente um épico. A lista é a mesma de [`../prototipo/js/epicos.js`](../prototipo/js/epicos.js): mudou aqui, mude lá.
**No fluxo:** [visão](../README.md) → [protótipo](../prototipo/README.md) → **épicos** → histórias → BDD.

Ver no protótipo: filtro **Épico** em **Cenários**, no painel de detalhes do player.

## Índice

| ID | Épico | Telas novas | Acumulado |
|----|-------|-------------|-----------|
| E01 | [Autenticação e acesso](#e01--autenticação-e-acesso) | +8 | 8 de 114 |
| E02 | [Orçamentos](#e02--orçamentos) | +6 | 14 de 114 |
| E03 | [Pedidos](#e03--pedidos) | +6 | 20 de 114 |
| E04 | [Operação e logística](#e04--operação-e-logística) | +11 | 31 de 114 |
| E05 | [Cadastros, painel e marca](#e05--cadastros-painel-e-marca) | +12 | 43 de 114 |
| E06 | [Notas fiscais e integrações](#e06--notas-fiscais-e-integrações) | +7 | 50 de 114 |
| E07 | [Financeiro](#e07--financeiro) | +10 | 60 de 114 |
| E08 | [Automação e fila de decisão](#e08--automação-e-fila-de-decisão) | +9 | 69 de 114 |
| E09 | [Portal do cliente](#e09--portal-do-cliente) | +8 | 77 de 114 |
| E10 | [Chamados e notificações](#e10--chamados-e-notificações) | +4 | 81 de 114 |
| E11 | [Visão do investidor](#e11--visão-do-investidor) | +1 | 82 de 114 |
| E12 | [Kanban](#e12--kanban) | +4 | 86 de 114 |
| E13 | [Inteligência artificial](#e13--inteligência-artificial) | +4 | 90 de 114 |
| E14 | [Campanhas de e-mail marketing](#e14--campanhas-de-e-mail-marketing) | +4 | 94 de 114 |
| E15 | [Dashboards](#e15--dashboards) | +4 | 98 de 114 |
| E16 | [Leads](#e16--leads) | +5 | 103 de 114 |
| E17 | [Gamificação de vendedores](#e17--gamificação-de-vendedores) | +6 | 109 de 114 |
| E18 | [Automação de orçamentos](#e18--automação-de-orçamentos) | +5 | 114 de 114 |

Ordem: E01 a E07 entregam o que o portal atual e o mapa de processos fazem; E08 a E11 trazem automação, cliente, suporte e investidor; E12 a E18, quadros, inteligência artificial, campanhas, dashboards, leads, gamificação e automação de orçamentos.

---

## E01 — Autenticação e acesso

Entrar, sair, recuperar a senha e definir quem acessa, para todos os perfis.

### O que entra nesta fase
- Entrar, recuperar a senha, acesso negado e saída para os cinco perfis
- Minha conta: dados, senha e preferências
- Cadastro de vendedores

### Telas que entram

| Feature | Tela |
|--------|------|
| F01 | Entrar |
| F02 | Recuperar senha |
| F03 | E-mail sem acesso |
| F04 | Saiu do portal |
| F05 | Menu completo (celular) |
| F06 | Vendedores |
| F07 | Cadastro de vendedor |
| F08 | Minha conta |

### Fora de escopo deste épico
Qualquer módulo de negócio: propostas, cadastros, pedidos e financeiro.

---

## E02 — Orçamentos

Montar, enviar e acompanhar propostas com margem à vista.

### O que entra nesta fase
- Lista, busca completa, novo orçamento, edição, PDF e histórico
- Cliente e produtos escolhidos na própria proposta

### Telas que entram

| Feature | Tela |
|--------|------|
| F09 | Orçamentos |
| F10 | Orçamentos · busca completa |
| F11 | Novo orçamento |
| F12 | Editar orçamento |
| F13 | Visualizar orçamento (PDF) |
| F14 | Histórico do orçamento |

### Fora de escopo deste épico
Telas de cadastro de clientes e produtos, e transformar a proposta em pedido.

---

## E03 — Pedidos

A proposta aprovada vira pedido, com dados fiscais, entrega e pagamento.

### O que entra nesta fase
- Orçamento aprovado ganha o botão “Gerar pedido”
- Cada item do orçamento mostra a última venda ao cliente

### Telas que entram

| Feature | Tela |
|--------|------|
| F15 | Pedidos |
| F16 | Editar pedido |
| F17 | Página do pedido |
| F18 | Cancelar pedido |
| F19 | PDF do pedido |
| F20 | Primeira vez (sem dados) |

### Fora de escopo deste épico
Telas de cadastro de clientes e produtos, compra, recebimento, expedição, nota e cobrança.

---

## E04 — Operação e logística

Comprar, receber, separar e entregar, sabendo o que está parado.

### O que entra nesta fase
- Pedido ganha o “Próximo passo” e o checklist
- Cadastro de transportadoras e fornecedores
- Uso sem conexão, com fila de envio

### Telas que entram

| Feature | Tela |
|--------|------|
| F21 | Checklist de pedidos |
| F22 | O que está parado |
| F23 | Fluxograma do processo |
| F24 | Logística (quadro) |
| F25 | Etiqueta de envio |
| F26 | Rastreio e aviso ao cliente |
| F27 | Transportadoras |
| F28 | Cadastro de transportadora |
| F29 | Fornecedores |
| F30 | Cadastro de fornecedor |
| F31 | Sem conexão |

### Fora de escopo deste épico
Telas de cadastro de clientes e produtos, painel, emissão fiscal e financeiro.

---

## E05 — Cadastros, painel e marca

Clientes e produtos, o painel inicial e a identidade do tenant.

### O que entra nesta fase
- Clientes e produtos, com CNPJ e CPF conferidos
- Ficha do cliente com pedidos, total comprado e ticket médio
- Painel inicial com funil de propostas, compra, recebimento e entrega, e calendário
- Marca do tenant, Ajustes e primeiros passos
- Ajustes reúne transportadoras e fornecedores
- Busca ⌘K e atalhos de teclado

### Telas que entram

| Feature | Tela |
|--------|------|
| F32 | Hoje |
| F33 | Busca global (⌘K) |
| F34 | Atalhos de teclado |
| F35 | Clientes |
| F36 | Cliente 360 |
| F37 | Produtos |
| F38 | Cadastro de produto |
| F39 | Ajustes |
| F40 | Marca (white-label) |
| F41 | Carregando |
| F42 | Falha com recuperação |
| F43 | Primeiros passos |

### Fora de escopo deste épico
Emissão fiscal e financeiro.

---

## E06 — Notas fiscais e integrações

Emitir e tratar a NF-e, com SEFAZ e importação do portal anterior.

### O que entra nesta fase
- Pedido ganha “Nota fiscal” e os documentos
- Funil ganha Faturar
- Primeiros passos passa a levar às integrações

### Telas que entram

| Feature | Tela |
|--------|------|
| F44 | Notas fiscais |
| F45 | Nova nota fiscal · Geral |
| F46 | Nova nota fiscal · Impostos |
| F47 | Nota emitida e ações |
| F48 | DANFE (PDF) |
| F49 | Carta de correção |
| F50 | Integrações e migração |

### Fora de escopo deste épico
Títulos, boletos e cobrança.

---

## E07 — Financeiro

Receber, cobrar e enxergar o resultado.

### O que entra nesta fase
- Painel ganha faturamento, a receber e ranking de vendedores
- Risco do cliente aparece em orçamentos, pedidos, notas e clientes
- Pedido ganha as parcelas
- Funil ganha A receber

### Telas que entram

| Feature | Tela |
|--------|------|
| F51 | Contas a receber |
| F52 | Conta a receber (nova e edição) |
| F53 | Quitar em massa |
| F54 | Boletos |
| F55 | Boleto e Pix |
| F56 | Bancos |
| F57 | Faturamento |
| F58 | Fluxo previsto |
| F59 | Cadastro de conta bancária |
| F60 | Cobrança |

### Fora de escopo deste épico
Regras automáticas: tudo ainda é acionado por uma pessoa.

---

## E08 — Automação e fila de decisão

O portal passa a trabalhar sozinho e só chama quando precisa de julgamento.

### O que entra nesta fase
- Regras rodam: aprovar cria o pedido, receber os itens prepara a nota
- Painel ganha o resumo do dia, “Precisa de você” e os recibos
- Busca em linguagem natural
- Orçamentos ganha a entrada de ordem de compra por e-mail

### Telas que entram

| Feature | Tela |
|--------|------|
| F61 | Precisa de você |
| F62 | Decidir item |
| F63 | Atividade e recibos |
| F64 | Entrada inteligente (OC por e-mail) |
| F65 | Automações |
| F66 | Editar regra |
| F67 | Templates |
| F68 | Editor de template |
| F69 | Parâmetros |

### Fora de escopo deste épico
O cliente final ainda não entra no portal.

---

## E09 — Portal do cliente

O comprador decide propostas, acompanha entregas e paga.

### O que entra nesta fase
- Novo papel: Cliente
- Ficha do cliente ganha “Ver como o cliente”
- Contra proposta do comprador entra na fila de decisão

### Telas que entram

| Feature | Tela |
|--------|------|
| F70 | Cliente · Início |
| F71 | Cliente · Propostas |
| F72 | Cliente · Decidir proposta |
| F73 | Cliente · Pedidos |
| F74 | Cliente · Acompanhar pedido |
| F75 | Cliente · Cobranças e notas |
| F76 | Cliente · Pagar |
| F77 | Cliente · Ajuda |

### Fora de escopo deste épico
Chamados internos e central de avisos.

---

## E10 — Chamados e notificações

Suporte e avisos num lugar só.

### O que entra nesta fase
- Sino no topo e avisos por menção
- Menu ganha Chamados

### Telas que entram

| Feature | Tela |
|--------|------|
| F78 | Notificações |
| F79 | Chamados |
| F80 | Criar chamado |
| F81 | Conversa do chamado |

### Fora de escopo deste épico
Visão de resultado para quem investe.

---

## E11 — Visão do investidor

Resultado da unidade para quem não opera o fluxo.

### O que entra nesta fase
- Novo papel: Investidor, somente leitura

### Telas que entram

| Feature | Tela |
|--------|------|
| F82 | Visão do investidor |

### Fora de escopo deste épico
Quadros, inteligência artificial, campanhas e dashboards.

---

## E12 — Kanban

Ver e mover vendas e tarefas em quadros.

### O que entra nesta fase
- Propostas em quadro por status, com total por coluna
- Tarefas da equipe com dono, prazo, prioridade e limite por coluna

### Telas que entram

| Feature | Tela |
|---------|------|
| F83 | Kanban de vendas |
| F84 | Kanban de tarefas |
| F85 | Cartão de tarefa |
| F86 | Colunas e limites |

### Fora de escopo deste épico
Inteligência artificial, campanhas e dashboards.

---

## E13 — Inteligência artificial

Um copiloto em chat: a pessoa pede e ele lista, ensina a fazer ou escreve.

### O que entra nesta fase
- Chat que lista pedidos, propostas, títulos, leads, tarefas, estoque, clientes e vendas
- Ensina o passo a passo e leva até a tela
- Escreve mensagens para revisão
- Respeita o perfil e o que pode ler

### Telas que entram

| Feature | Tela |
|---------|------|
| F87 | Copiloto |
| F88 | Copiloto · pedir uma lista |
| F89 | Copiloto · aprender a fazer |
| F90 | Configurar copiloto |

### Fora de escopo deste épico
Campanhas e dashboards.

---

## E14 — Campanhas de e-mail marketing

Segmentar clientes, enviar e medir campanhas.

### O que entra nesta fase
- Campanhas com prévia, teste, agendamento e confirmação
- Públicos calculados a partir dos clientes, com descadastro
- Abertura e cliques por campanha e por destinatário, para saber quem abriu
- Analytics de e-mail: abertura por pixel 1×1 e clique por link rastreado, no próprio envio
- Links com UTM, para o Google Analytics medir o que acontece no site depois do clique

### Como o rastreio funciona

| O que mede | Técnica | Limite |
|------------|---------|--------|
| Abertura | Imagem 1×1 servida pelo portal, uma por destinatário | Aproximada: bloqueio de imagens esconde aberturas e o pré-carregamento do provedor conta aberturas que não houve |
| Clique | Link que passa pelo portal e redireciona para o destino | Mais confiável que a abertura |
| Visita no site | Parâmetros UTM no link | Só depois do clique; o e-mail não executa as tags do Google Analytics |

O protótipo mostra abertura e cliques com dados simulados; o detalhe por destinatário com data e o aviso desses limites ainda não estão nas telas.

### Telas que entram

| Feature | Tela |
|---------|------|
| F91 | Campanhas |
| F92 | Nova campanha |
| F93 | Públicos |
| F94 | Resultado da campanha |

### Fora de escopo deste épico
Dashboards.

---

## E15 — Dashboards

Acompanhar vendas, operação e financeiro, cada pessoa com o seu painel.

### O que entra nesta fase
- Painéis comercial, de operação e financeiro
- Painel montado pela própria pessoa

### Telas que entram

| Feature | Tela |
|---------|------|
| F95 | Dashboard comercial |
| F96 | Dashboard de operação |
| F97 | Dashboard financeiro |
| F98 | Montar meu painel |

### Fora de escopo deste épico
Captação e funil de leads.

---

## E16 — Leads

Captar, qualificar e transformar contatos em clientes.

### O que entra nesta fase
- Lista e funil de leads por etapa
- Pontuação explicada, responsável e histórico
- Conversão em cliente, com orçamento em seguida
- Formulário do site com consentimento, importação e rodízio

### Telas que entram

| Feature | Tela |
|---------|------|
| F99 | Leads |
| F100 | Funil de leads |
| F101 | Ficha do lead |
| F102 | Cadastro de lead |
| F103 | Captação de leads |

### Fora de escopo deste épico
Pontuação e gamificação dos vendedores.

---

## E17 — Gamificação de vendedores

Pontuar o que o vendedor faz, mostrar a posição de cada um e premiar desafios.

### O que entra nesta fase
- Pontos calculados do que acontece no portal, com extrato
- Ranking, níveis e conquistas
- Desafios com prazo e prêmio
- Regras de pontuação configuráveis pelo administrador

### Telas que entram

| Feature | Tela |
|---------|------|
| F104 | Ranking de vendedores |
| F105 | Minha pontuação |
| F106 | Conquistas |
| F107 | Desafios e prêmios |
| F108 | Cadastro de desafio |
| F109 | Regras de pontuação |

### Fora de escopo deste épico
Automação de orçamentos.

---

## E18 — Automação de orçamentos

Do pedido de cotação que chega à proposta enviada e acompanhada.

### O que entra nesta fase
- Pedidos de e-mail, WhatsApp, site ou texto colado viram itens do catálogo, com confiança
- Preço calculado por regras, com a explicação
- Comparação de fornecedores
- Orçamento gerado em um toque e envio direto dentro do limite
- Follow-up automático

### Telas que entram

| Feature | Tela |
|---------|------|
| F110 | Pedidos de cotação |
| F111 | Revisar e gerar orçamento |
| F112 | Regras de preço |
| F113 | Cotação com fornecedores |
| F114 | Follow-up automático |

### Fora de escopo deste épico
Nada além do que já foi entregue.

---

## Próximos passos

→ Validar a divisão e a ordem · depois PRD e histórias por épico, começando pelo E01.
