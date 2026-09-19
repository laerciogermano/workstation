# Funcionalidades do sistema — ConnectMax vendas

**Por quê:** reunir, em bullets, as capacidades do **processo de vendas / prospecção**.  
**Papel no fluxo:** base funcional para as histórias de usuário.  
**Origem:** documento de [visão](../README.md).  
**Operações LinkedIn:** [`../../linkedin-agent/docs/functionalities.md`](../../linkedin-agent/docs/functionalities.md).  
**Robô de tela:** [`../../screen-robot/scenarios.md`](../../screen-robot/scenarios.md).

## Como usar este documento

- Cada bullet descreve uma capacidade observável do produto de vendas.
- Ações no LinkedIn **não** são redefinidas aqui — usa o [`linkedin-agent`](../../linkedin-agent/README.md).
- Critérios de aceite ficam no [`bdd.md`](bdd.md) (a produzir).
- Superfícies e UI ficam no [`screens.md`](screens.md) (a produzir).

---

## Conta e papéis

- Autenticar usuários da unidade.
- Distinguir papéis de **vendedor**, **gestor** e **investidor**.
- Restringir operações conforme o papel (investidor só leitura da operação).
- Associar o usuário a uma **unidade** (franqueado / operação).

---

## Motor de prospecção LinkedIn

### Público-alvo e lista

- Definir e editar o público-alvo da prospecção no LinkedIn.
- Montar e manter a lista de contatos a abordar.
- Registrar a origem LinkedIn de cada contato considerado pelo produto.
- Exibir o estado de cada contato na cadência (pendente, abordado, em follow-up, respondido, handoff, descartado).

### Cadência e abordagem

- Configurar cadência de abordagens e follow-ups.
- Respeitar limites configuráveis de volume/frequência para não quebrar o canal.
- Disparar etapas repetíveis da prospecção (mensagem, follow-up) conforme a cadência, **via linkedin-agent** quando a ação for na UI do LinkedIn.
- Registrar o que já foi dito/feito em cada contato.
- Pausar, retomar ou cancelar a cadência de um contato.
- Evitar reabordar contato já tratado sem ação explícita.

### Handoff para o vendedor

- Marcar contato como pronto para conversa comercial (handoff).
- Entregar o lead ao vendedor com contexto da prospecção.
- Manter o fechamento da venda sob responsabilidade do vendedor (o motor não marca venda sozinho).

---

## Fila de leads

- Listar leads da unidade e por vendedor.
- Exibir status do lead na cadência e no handoff.
- Filtrar e ordenar a fila (status, dono, recência).
- Abrir o histórico de prospecção de um lead.
- Indicar leads disponíveis (sem dono ou prontos para pegar) versus em trabalho.
- Atualizar o andamento do lead até a conversa/venda (registro pelo vendedor).

---

## Distribuição

- Atribuir um lead a um vendedor.
- Redistribuir lead entre vendedores somente por ação explícita do gestor (ou regra combinada).
- Garantir no máximo um vendedor dono por lead por vez.
- Exibir a carga (quantidade/estado de leads) de cada vendedor.
- Permitir que o vendedor trabalhe a própria fila sem alterar a de outros.

---

## Time comercial

- Listar os vendedores da unidade.
- Incluir e desativar vendedor no time.
- Associar fila e indicadores a cada vendedor.
- Mostrar o efeito de adicionar pessoas ao time (carga e pipeline disponíveis).
- Manter referência operacional ao tamanho atual do time (ex.: 5 vendedores).

---

## Faturamento

- Registrar ou importar o faturamento da unidade no período.
- Exibir faturamento atual da unidade.
- Comparar com referências de escala (teto atual ~R$ 200 mil/mês; franqueados maiores ~R$ 600 mil/mês).
- Relacionar faturamento a tamanho do time e volume de pipeline (visão agregada).

---

## Prontidão para contratar

- Indicar se a fila/prospecção já sustenta mais uma cadeira de vendedor.
- Basear a recomendação em capacidade ociosa de leads, não só em vontade de contratar.
- Exibir o que falta de pipeline para justificar a próxima contratação.
- Avisar quando adicionar vendedor só dividiria o mesmo pipeline (sem sobra).

---

## Visão para investidor

- Exibir números simples da unidade: time, pipeline/fila e faturamento.
- Apresentar a tese de renda da operação (prospecção repetível + time expansível).
- Restringir o papel investidor a **leitura** (não opera a fila no lugar do vendedor).
- Tornar a operação compreensível sem depender de “quem é bom no LinkedIn”.

---

## Fora do escopo em v1

- CRM completo de pós-venda / CS.
- Automação de canais que não sejam LinkedIn (e-mail frio em massa, WhatsApp como motor principal, ads).
- Substituição do vendedor por robô que fecha a venda sozinho.
- Marketplace de franquias ou captação pública de investimento.
- Integração bancária / conciliação financeira da unidade.
- Scraping ou bypass de autenticação da plataforma.
- Implementação do motor Capture/Perceive/Decide/Actuate (pertence ao [`screen-robot`](../../screen-robot/README.md)).
- Operações de domínio no app LinkedIn (pertence ao [`linkedin-agent`](../../linkedin-agent/README.md)).

---

## Próximos passos

→ [`user-stories.md`](user-stories.md) (a produzir) a partir deste inventário
