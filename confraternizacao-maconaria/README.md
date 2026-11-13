# Confraternização Maçônica — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela, orçamento fechado ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/README.md).  
Pedido bruto do cliente: [`input/pedido-cliente.txt`](input/pedido-cliente.txt).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Confraternização Maçônica** é o aplicativo da **potência** para o **evento mundial de confraternização** em **Curitiba**, que celebra os **125 anos** da potência: um único lugar onde a organização controla e o irmão acompanha **programação**, **locais na cidade**, **participantes** e **comunicação entre eles** — com horário e nível de organização suficientes para um calendário espalhado pela cidade inteira.

## Problema

Um evento mundial de confraternização maçônica, com programação em vários pontos de Curitiba, concentra dores típicas de evento multi-local — sem um app da própria potência.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Programação dispersa** | Cronogramas em PDF, grupos de WhatsApp e murais locais. Difícil ver *o que acontece agora*, *onde* e *em qual horário*. |
| **Locais sem mapa único** | Atividades na cidade inteira; falta cadastro central de locais (endereço, capacidade, vínculo com atividades). |
| **Participantes invisíveis à organização** | Quem veio, quem se cadastrou e quem está em qual atividade fica em planilha ou no boca a boca. |
| **Contato entre irmãos improvisado** | Quem quer falar com outro participante monta mensagem fora do contexto do evento (WhatsApp solto, cartão, indicação). |
| **Nível de organização frágil** | Evento de confraternização precisa de papéis (organização vs participante), regras de inscrição e visão operacional — sem virar “só um folder digital”. |
| **Orçamento sem escopo** | O cliente pede preço sem ter descrito o produto; sem visão e referências de apps de evento, qualquer número é chute. |

A potência **já terá** o evento, os locais e as pessoas. O que falta é o **aplicativo da potência** que concentra controle e experiência do evento em um só lugar.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Organização da potência** | Comissão / secretaria / equipe do evento | Cadastrar programação, locais e participantes; acompanhar presença e operação no dia |
| **Participante (irmão / convidado)** | Quem se cadastra para viver o evento em Curitiba | Ver agenda, locais, horários; inscrever-se; encontrar e enviar mensagem a outro participante |
| **Coordenação de local / atividade** | Quem cuida de um ponto ou bloco da programação | Ver o que acontece no seu local, quem está esperado e avisos da organização |

## Objetivo

Ser o **sistema oficial do evento mundial da potência (125 anos)**: controle operacional (programação, locais, participantes) + experiência de confraternização (agenda na cidade + mensagem entre participantes), pronto para orçamento e discovery a partir desta visão.

## Proposta de valor

O app trata o evento como **calendário multi-local da potência**, não como folder estático nem como chat genérico. A organização publica e controla; o participante se orienta na cidade e se conecta com outros no contexto do evento.

| Necessidade | O que o app faz |
|-------------|-----------------|
| Ver a programação | Expor **cronograma** (atividades, data/hora, local, responsável) |
| Saber onde acontece | Manter **locais cadastrados** na cidade e ligá-los às atividades |
| Saber quem participa | **Cadastro / inscrição** de participantes ligados ao evento |
| Falar com outro participante | Permitir **montar e enviar mensagem** a outro inscrito (no contexto do evento) |
| Organizar sem caos | Separar papéis (organização vs participante) e níveis mínimos de operação |
| Orçar com clareza | Servir de base para referências de apps de evento e proposta comercial |

### Exemplos

**Organização publica a grade** — A comissão cadastra o local “Templo X” e a atividade “Abertura solene” às 9h. Participantes veem no cronograma com endereço e mapa.

**Participante se orienta na cidade** — Bruno chega a Curitiba, abre a agenda do dia, filtra por horário e vê três atividades em bairros diferentes — cada uma com local e horário.

**Cadastro e quem está no evento** — Carla se inscreve pelo app. A organização vê a lista de participantes e pode cruzar com presença em atividades-chave.

**Mensagem entre participantes** — Diego encontra Ana na lista (ou no contexto de uma atividade) e monta uma mensagem para combinar encontro no intervalo — sem depender de grupo genérico de WhatsApp.

## Princípios

1. **Evento da potência primeiro** — o produto existe para *este* evento mundial (125 anos, Curitiba), não como marketplace genérico de eventos.
2. **Programação + local + horário** — atividade sem tempo e lugar não resolve confraternização multi-local.
3. **Participante cadastrado** — quem está no evento é identidade conhecida pela organização; anônimo solto não é o núcleo.
4. **Mensagem no contexto** — contato entre pessoas serve à confraternização do evento, não a uma rede social aberta.
5. **Dois lados claros** — organização opera; participante vive a agenda. Papéis não se misturam sem regra.
6. **Escopo explícito antes do preço** — orçamento só depois de visão (e, em seguida, referências de apps de evento).

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Evento** | Um evento canônico (mundial / 125 anos) com dados básicos e período |
| **Programação** | Cronograma de atividades (título, descrição, data/hora, local, status) |
| **Locais** | Cadastro de locais na cidade (nome, endereço, observações) vinculados a atividades |
| **Participantes** | Cadastro / inscrição; listagem para organização; perfil mínimo no evento |
| **Mensagens** | Participante envia mensagem a outro participante (thread simples no contexto do evento) |
| **Papéis** | Organização (CRUD operacional) vs participante (consulta + inscrição + mensagem) |
| **Agenda do participante** | Ver programação do dia / filtrar por horário e local |
| **Operação** | Visão da organização: atividades, locais, inscritos |

### Fora de escopo (v1)

- Rede social maçônica permanente além do evento
- Streaming / transmissão ao vivo de rituais
- Pagamento de inscrição, gateway financeiro ou emissão de nota (pode entrar em fase posterior se o cliente pedir)
- App de loja / e-commerce da potência
- Moderação avançada tipo rede aberta (além do necessário para mensagens do evento)
- Multi-potência / marketplace de vários eventos de terceiros no lançamento
- Integração obrigatória com WhatsApp/Telegram (a mensagem vive no app)

## Modelo conceitual

### Potência

A jurisdição maçônica cliente do produto — dona do app e do evento dos 125 anos.

### Evento

A confraternização mundial em Curitiba (período, tema/125 anos, status). Unidade raiz de programação, locais e participantes.

### Local

Ponto na cidade onde ocorrem atividades (endereço, nome, notas). Um local pode receber várias atividades.

### Atividade (item de programação)

Bloco do cronograma: o quê, quando, onde, eventualmente responsável e capacidade/inscrição.

### Participante

Pessoa inscrita no evento (irmão, convidado, etc.), com dados mínimos e vínculo às atividades quando fizer sentido.

### Mensagem

Comunicação de um participante a outro no contexto do evento (não é post público).

### Organização

Usuários com permissão de cadastrar e operar programação, locais e visão de participantes.

## Critérios de sucesso

- Organização cadastra locais e monta o cronograma do evento sem planilha paralela.
- Participante abre o app e entende **o que acontece hoje**, **onde** e **a que horas**.
- Dá para ver **quem está participando** (visão organização; regras de privacidade no discovery).
- Dois participantes conseguem **trocar mensagem** no app no contexto do evento.
- A visão + referências de apps de evento permitem **orçamento** com escopo nomeado (não “app genérico”).
- Escopo v1 cabe em um evento multi-local de confraternização — sem virar rede social eterna.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Potência** | Jurisdição maçônica cliente; dona do evento e do app |
| **Evento mundial** | Confraternização em Curitiba que celebra os 125 anos da potência |
| **Programação / cronograma** | Lista ordenada de atividades com data/hora e local |
| **Local** | Endereço / espaço na cidade vinculado a atividades |
| **Participante** | Pessoa cadastrada / inscrita no evento |
| **Organização** | Equipe com poder de operar o app do evento |
| **Mensagem** | Contato 1:1 (ou thread) entre participantes no app |
| **Confraternização** | Natureza do encontro: várias atividades sociais/ritualísticas pela cidade, não um único auditório |

## Regras de negócio (v1)

- Toda **atividade** pertence ao **evento** e, quando presencial, referencia um **local** cadastrado (ou “a definir” explícito).
- Toda **atividade** tem **início** (data/hora); fim é desejável e obrigatório quando houver conflito de agenda.
- **Participante** só troca mensagem com outro se ambos estiverem inscritos no mesmo evento (v1).
- Papel **organização** gerencia programação, locais e visão operacional; participante não edita a grade oficial.
- O produto v1 é **single-event** (este evento mundial); multi-edição futura não bloqueia o núcleo.
- Dados de participantes seguem necessidade do evento; detalhe de privacidade (o que a lista mostra) fecha no discovery/PRD.
- Orçamento comercial **não** faz parte do runtime do app; usa esta visão + benchmarking como input.

## Insumo do cliente (interpretação)

Pedido falado (transcrição) pedindo **orçamento** para um **aplicativo da potência** no **evento mundial em Curitiba** (125 anos), com: cronograma/programação, locais cadastrados, participantes, cadastro, mensagens entre pessoas, programação pela cidade com horários e algum nível de organização. Cliente fará também busca própria por apps de evento / referências.

Texto integral: [`input/pedido-cliente.txt`](input/pedido-cliente.txt).

## Próximos passos

→ [`docs/README.md`](docs/README.md) → inventário de funcionalidades (a produzir) → benchmarking de apps de evento → orçamento v1
