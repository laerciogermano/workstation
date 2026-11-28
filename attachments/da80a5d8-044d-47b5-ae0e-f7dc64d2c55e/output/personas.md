# Personas — Super Portal e contexto Conect

**Atividade:** Separar personas (Conect → Criar Super Portal → Autenticação) · 2026-11-28

**Assumido:** o pedido é listar quem pode aparecer no Super Portal, para definir a Autenticação. Por estar sob "Conect", entram também as personas comerciais da Conect, em grupo separado. "Todas as possíveis" inclui as que não têm login e as que ainda são hipótese, sempre marcadas.

## Resumo

| Grupo | Personas | Base |
|-------|----------|------|
| A. Entram no portal | Administrador, Vendedor, Logística, Investidor, Cliente | Visão e protótipo |
| B. Variações de um perfil | Gerência, Gestor/franqueado, Comprador, contatos do cliente | Protótipo e docs |
| C. Participam sem perfil | Suporte, Fornecedor, Transportadora, Lead, Visitante do site | Protótipo e processo |
| D. Mercado e comercial da Conect | Decisor, Gestor de operação, TI, Diretoria, Operador/desenvolvedor | Connect Tech, ConnectMax, Trello |
| E. Hipóteses | Operador da plataforma, Franqueadora, Financeiro, Contador, Marketing, Compras | Não definidas no contexto |

## A. Perfis que entram no portal

| Persona | Quem é | O que acessa no protótipo | Módulos próprios a partir de |
|---------|--------|---------------------------|------------------------------|
| **Administrador** | Configura e governa o tenant: marca, usuários, regras, templates | Tudo, menos as telas do portal do cliente; é quem usa "acessar como" um vendedor | E01 |
| **Vendedor** | Faz orçamentos, pedidos e atende clientes | Painel, fila, orçamentos, pedidos, checklist, clientes, produtos, leads, campanhas, quadros, chamados, copiloto, gamificação; nos módulos comerciais vê o que é dele | E01 |
| **Logística** | Compra, recebe, separa e entrega | Painel, fila (dados, compra e nota), checklist, parados, fluxograma, pedidos, logística, transportadoras, fornecedores, produtos, notas, chamados, tarefas, dashboard de operação, copiloto | E04 |
| **Investidor** | Investe na unidade como fonte de renda; não opera | Somente leitura: visão geral, dashboard financeiro, faturamento, fluxo previsto | E11 |
| **Cliente** | Empresa compradora atendida pelo tenant | Só o portal dele: início, propostas, pedidos, cobranças e notas, pagamento, ajuda | E09 |

A [visão](../../../super-portal/README.md) lista quatro personas (sem Logística). O [protótipo](../../../super-portal/prototipo/README.md) usa cinco, e o épico [E01](../../../super-portal/docs/epics.md) fala em "cinco perfis".

## B. Variações que caem em um desses perfis

| Nome no contexto | Perfil | Observação |
|------------------|--------|------------|
| **Gerência** (cargo de funcionário) | Administrador | No login do protótipo, funcionário que não é da Logística entra como administrador |
| **Gestor / franqueado** (dono da unidade) | Administrador | No Super Portal a franquia virou **tenant** |
| **Comprador** (contato do cliente) | Cliente | É a pessoa que de fato faz o login |
| **Compras / suprimentos, TI, Financeiro, Administrativo** do cliente | Cliente | Aparecem só nos e-mails fictícios de exemplo; hoje não há diferença de permissão entre eles |

## C. Participam do processo, sem perfil de acesso

| Persona | Onde aparece | Contato com o portal hoje |
|---------|--------------|---------------------------|
| **Suporte Portal** | Envolvido em chamados | É destinatário de chamado, mas não tem perfil |
| **Suporte comercial** | Envolvido em chamados e ajuda do cliente | Idem |
| **Fornecedor** | Cadastro, compra e cotação (E04, E18) | É cadastro; envios simulados |
| **Transportadora / Correios** | Frete, etiqueta, rastreio | É cadastro |
| **Lead / prospect** | Leads (E16) e etapas 1 a 4 do processo (LinkedIn e e-mail) | Registro que pode virar cliente |
| **Visitante do site** | Formulário de captação (E16) | Preenche o formulário, sem login |

Destinatário de campanha não é uma persona à parte: é o cliente ou lead que recebe o e-mail e pode se descadastrar.

## D. Mercado e comercial da Conect (fora do login do Super Portal)

| Persona | Origem | Necessidade |
|---------|--------|-------------|
| **Decisor (dono / diretor)** | [Connect Tech](../../../connect-tech/README.md) e etapa 1 do processo | Resultado mensurável sem montar fábrica de software |
| **Gestor de operação / processos** | Connect Tech | Achar onde perde prazo e custo e ter quem entregue a correção |
| **TI / responsável técnico** | Connect Tech | Parceiro que evolui o legado sem conflito com o time interno |
| **Comercial ConectMax** (vendedor / franqueado) | Connect Tech | Oferta clara de upsell: do produto ao software |
| **Diretoria** | Trello Connect (cerimônias com vendedores e diretoria) | Citada, sem necessidade descrita |
| **Operador / desenvolvedor** | [Agente LinkedIn](../../../conectmax/connectmax/linkedin-agent/README.md) | Rodar e depurar os fluxos de automação |

O [projeto de vendas ConnectMax](../../../conectmax/connectmax/vendas/README.md) repete Vendedor, Gestor/franqueado e Investidor, já contados em A e B.

## E. Hipóteses (não estão definidas no contexto)

| Persona | Por que considerar |
|---------|--------------------|
| **Operador da plataforma** (super admin) | Num white-label, alguém precisa criar e suspender tenants |
| **Franqueadora / matriz** | O portal antigo tem modo "conta gerenciada" e subfranqueado; o novo não diz quem enxerga várias unidades |
| **Financeiro interno** | Há cobrança, boletos e bancos, mas nenhum cargo para isso |
| **Contador** | Notas, XML e impostos costumam ir para fora da empresa |
| **Marketing** | Há campanhas (E14), hoje com administrador e vendedor |
| **Compras** | A compra dos itens existe no processo; hoje se mistura com a Logística |

**Não são personas:** SEFAZ, banco, e-mail, WhatsApp, API do portal antigo e o copiloto são sistemas ou integrações.

## O que falta decidir para a Autenticação

1. **Quantos perfis valem:** os 4 da visão ou os 5 do protótipo (com Logística).
2. **Cadastro de acesso:** só existe tela para Vendedores. A de Funcionários foi [removida](../../../super-portal/prompts/019-2026-11-27-remover-funcionarios.md), então não há como cadastrar Logística, Gerência ou Investidor.
3. **Modelo de dados:** [a modelagem](../../../super-portal/docs/modelagem-dados.md) tem Vendedor e Cliente, mas não tem usuário, perfil, administrador, logística nem investidor.
4. **Vários logins por cliente:** hoje o acesso é pelo único e-mail do cadastro da empresa.
5. **Fase dos perfis:** o E01 promete entrar e sair para os cinco, mas Cliente (E09) e Investidor (E11) só ganham telas depois.
6. **Suporte:** definir se é um perfil com login ou só destinatário de chamado.

**Sugestão:** começar a Autenticação com os 5 perfis do grupo A, tratar Gerência e franqueado como Administrador e deixar os grupos C e E sem login até haver decisão.
