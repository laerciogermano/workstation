# Funcionalidades — linkedin-agent

**Por quê:** recortar as **ações maiores** no LinkedIn que o agente executa via [`screen-robot`](../../screen-robot/README.md).  
**Origem:** [visão](../README.md).  
**Formato:** [processo — documento de cenários](../../../core/processo/1.discovery/2.scenarios.md).
**Negócio:** [`../../vendas/`](../../vendas/README.md) consome estas ações; não as redefine.

Cada **funcionalidade** é uma **ação**. Cada **cenário** é uma mudança de estado necessária para executar a ação — e também unidade testável e paralelizável.

---

## Autenticar no LinkedIn

Abre o app, preenche credenciais e deixa a sessão autenticada no agent.

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Provisionar agent e instalar app | Device offline → LinkedIn instalado e agent pronto |
| 2 | Abrir LinkedIn | Home/launcher → app LinkedIn em foreground |
| 3 | Localizar entrada de login | Tela indefinida → botão Entrar ou campos visíveis |
| 4 | Informar usuário e senha | Campos vazios → credenciais preenchidas |
| 5 | Confirmar login | Formulário → sessão autenticada (feed/home) ou desafio pendente |
| 6 | Persistir sessão | Sessão só em memória → estado salvo em disco |

---

## Buscar pessoas

Executa busca de pessoas no LinkedIn com termos/filtros e obtém lista de resultados na tela.

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Abrir busca | Feed/home → tela de busca ativa |
| 2 | Digitar termo | Busca vazia → resultados carregando/carregados |
| 3 | Filtrar por Pessoas | Aba genérica → lista de pessoas |
| 4 | Extrair resultados visíveis | Só pixels → lista de nomes/títulos/bounds |
| 5 | Rolar para mais resultados | Primeira página → próximos itens visíveis |

---

## Abrir perfil

Navega até o perfil de um contato a partir da lista ou de um identificador na tela.

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Selecionar contato na lista | Lista → item escolhido |
| 2 | Abrir perfil | Lista → perfil do contato carregado |
| 3 | Aguardar UI estável | Perfil carregando → dump/elementos disponíveis |
| 4 | Extrair dados do perfil | Só tela → nome, headline, empresa, botões de ação |

---

## Enviar conexão

Dispara convite de conexão no perfil (com ou sem nota, conforme a UI permitir).

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Localizar ação Conectar | Perfil sem ação → botão Conectar visível |
| 2 | Tocar em Conectar | Perfil → fluxo de convite / nota |
| 3 | (Opcional) Escrever nota | Nota vazia → texto preenchido |
| 4 | Enviar convite | Convite pendente → convite enviado / pendente na UI |
| 5 | Registrar resultado | Sem registro → estado “conexão enviada” na sessão |

---

## Enviar mensagem

Abre conversa e envia mensagem a um contato já conectado (ou via InMail se a UI expuser).

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Localizar Mensagem | Perfil/lista → botão Mensagem |
| 2 | Abrir thread | Perfil → tela de conversa |
| 3 | Digitar mensagem | Campo vazio → texto pronto |
| 4 | Enviar | Texto no campo → mensagem na thread / enviada |
| 5 | Registrar envio | Sem histórico → mensagem registrada na sessão |

---

## Executar follow-up de conversa

Reabre uma conversa existente e envia a próxima mensagem da cadência (conteúdo vem de quem chama — tipicamente vendas).

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Abrir caixa de entrada / busca do contato | Home → lista de mensagens ou thread |
| 2 | Abrir thread alvo | Lista → conversa do contato |
| 3 | Confirmar último estado da UI | Thread aberta → último conteúdo lido |
| 4 | Enviar follow-up | Thread sem nova msg → mensagem enviada |
| 5 | Persistir andamento | Sessão sem marco → etapa de follow-up salva |

---

## Guardar e restaurar sessão LinkedIn

Persiste contexto do agente (device, apps, etapa, último perfil/thread) para retomar sem refazer tudo.

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Salvar sessão | Estado só em memória → arquivo de sessão |
| 2 | Restaurar sessão | Agent frio → contexto LinkedIn recarregado |
| 3 | Retomar na etapa salva | Etapa desconhecida → etapa anterior (ex.: pós-login, perfil aberto) |

---

## Fora do escopo

- Cadência, fila, distribuição, faturamento ([`vendas`](../../vendas/README.md)).
- Provisionar device / OCR / gestos genéricos ([`screen-robot`](../../screen-robot/2.scenarios.md)).
- Bypass de autenticação ou uso ilegítimo do LinkedIn.

## Próximos passos

→ Implementação consumindo [`../../screen-robot/sources/`](../../screen-robot/sources/README.md)  
→ Quem orquestra cadência: [`../../vendas/`](../../vendas/README.md)
