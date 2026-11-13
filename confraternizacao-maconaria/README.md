# Confraternização Maçônica — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela, orçamento fechado ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/README.md).  
Insumos do cliente (áudio, transcrição, prints de referência): [`input/README.md`](input/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Confraternização Maçônica** é o aplicativo da **potência** para o **evento mundial de confraternização** em **Curitiba**, que celebra os **125 anos** da potência: o participante acompanha **agenda do dia**, **lista de atividades**, **detalhe com local e capacidade**, **check-in** e **identificação**; a organização controla **programação**, **locais/salas**, **inscritos** e a operação na cidade inteira — no espírito de um app de eventos/clube (referência enviada pelo cliente), adaptado à confraternização maçônica.

## Problema

Um evento mundial de confraternização maçônica, com programação em vários pontos de Curitiba, concentra dores típicas de evento multi-local — sem um app da própria potência.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Programação dispersa** | Cronogramas em PDF, grupos de WhatsApp e murais locais. Difícil ver *o que acontece agora*, *onde* e *em qual horário*. |
| **Locais sem mapa único** | Atividades na cidade inteira; falta cadastro central de locais/salas ligados às atividades. |
| **Participantes e presença opacos** | Cadastro e “quem confirmou / quem fez check-in” ficam em planilha ou boca a boca; falta capacidade (X de Y). |
| **Entrada e identificação improvisadas** | Sem carteirinha digital / ingresso / fluxo claro de inscrição no mesmo lugar da agenda. |
| **Contato entre irmãos improvisado** | Mensagem e networking fora do contexto do evento (WhatsApp solto). |
| **Orçamento sem escopo** | Cliente pede preço e envia referência visual; sem visão alinhada ao áudio + prints, o número continua chute. |

A potência **já terá** o evento, os locais e as pessoas. O que falta é o **aplicativo da potência** — com a densidade de um app de eventos moderno (como a referência LIDE), focado nesta confraternização.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Organização da potência** | Comissão / secretaria / equipe do evento | Cadastrar programação, locais/salas e participantes; ver confirmados e check-ins |
| **Participante (irmão / convidado)** | Quem se cadastra para viver o evento em Curitiba | Agenda do dia, lista de atividades, detalhe (local/horário), inscrição/ingresso, check-in, carteirinha, mensagem |
| **Coordenação de local / sala** | Quem cuida de um ponto ou bloco da programação | Ver atividades do local, capacidade e presença |

## Objetivo

Ser o **sistema oficial do evento mundial da potência (125 anos)**: agenda multi-local + controle de participantes (confirmação, check-in, identificação) + comunicação no contexto do evento — alinhado ao pedido falado e aos prints de referência — base para discovery e orçamento.

## Proposta de valor

O app trata o evento como **calendário multi-local da potência com operação de presença**, não como folder estático. A organização publica e opera; o participante se orienta na cidade, confirma, faz check-in e se conecta no contexto do evento.

| Necessidade | O que o app faz |
|-------------|-----------------|
| Ver a programação | **Agenda do dia** + **lista de atividades** (data/hora, título, confirmados) |
| Entender uma atividade | **Detalhe**: banner/resumo, data, horário, local, capacidade (X de Y), “sobre” |
| Saber onde acontece | **Locais / salas** cadastrados e ligados às atividades |
| Entrar / confirmar | Cadastro, **confirmação** e fluxo de **ingresso / inscrição** |
| Marcar presença | **Check-in** na atividade (e visão agregada de check-ins) |
| Identificar-se | **Carteirinha** digital do participante no evento |
| Falar com outro | **Mensagem** entre inscritos no contexto do evento |
| Atalhos do dia | Acesso rápido (carteirinha, ingressos, check-in / logística do local quando houver) |
| Orçar com clareza | Visão + referência visual nomeada → proposta comercial |

### Exemplos

**Agenda do dia** — Bruno abre o app em Curitiba, escolhe o dia na faixa semanal e vê as atividades daquele dia (ou “nenhuma” se a grade ainda não tiver item).

**Lista e detalhe** — Carla navega Eventos, vê “Abertura solene · 0/200 confirmados”, abre o detalhe com local, horário e texto “sobre”, e confirma presença ou adquire ingresso.

**Check-in no local** — Na porta da atividade, Diego escolhe “Fazer check-in” e confirma presença; a organização vê o contador subir.

**Carteirinha** — Ana mostra a carteirinha digital no perfil para identificação na entrada.

**Mensagem** — Dois inscritos trocam mensagem no app para combinar o próximo ponto da programação na cidade.

## Princípios

1. **Evento da potência primeiro** — produto para *este* evento mundial (125 anos, Curitiba), não marketplace genérico.
2. **Programação + local + horário + capacidade** — atividade sem tempo, lugar e noção de lotação não resolve confraternização multi-local.
3. **Presença explícita** — confirmação e check-in são parte do controle do evento, não acessório.
4. **Referência como idioma de UI** — os prints (app tipo LIDE) definem o *tipo* de experiência; a marca e o domínio são da potência, não cópia literal do LIDE.
5. **Participante identificado** — cadastro + carteirinha / ingresso; anônimo solto não é o núcleo.
6. **Mensagem no contexto** — contato serve à confraternização do evento, não a rede social aberta.
7. **Escopo explícito antes do preço** — orçamento depois de visão alinhada a áudio + prints.

## Escopo da visão

### Capacidades (v1)

Alinhadas ao **pedido falado** e ao que os **prints de referência** tornam concreto:

| Área | Em escopo |
|------|-----------|
| **Evento** | Evento canônico (mundial / 125 anos) com período e dados básicos |
| **Agenda** | Home/agenda: boas-vindas, faixa de dias, **eventos do dia** |
| **Programação / Eventos** | Lista de atividades com data/hora, título, **confirmados X/Y** |
| **Detalhe da atividade** | Banner/capa, data, horário, local, capacidade, texto “sobre” |
| **Ações na atividade** | Confirmar / **check-in**; fluxo de **ingresso ou inscrição** |
| **Locais / salas** | Cadastro de locais na cidade (e salas quando couber) vinculados a atividades |
| **Participantes** | Cadastro; perfil; listagem operacional |
| **Carteirinha** | Identificação digital do participante no evento |
| **Mensagens** | Thread simples entre inscritos no mesmo evento |
| **Papéis** | Organização (CRUD + visão operacional) vs participante |
| **Notificações** | Avisos básicos (sino / push quando houver canal) |
| **Privacidade** | Consentimento de cookies/analytics no app (padrão da referência) |
| **Operação** | Visão organização: grade, locais, inscritos, confirmados/check-ins |

### Candidatos (referência — validar com o cliente)

Presentes nos prints LIDE; **não** estão no áudio de forma explícita. Entram só se o cliente confirmar na próxima conversa / PRD:

| Área | O que a referência mostra |
|------|---------------------------|
| **Estacionamento** | Vagas / acesso rápido a estacionamento |
| **Produtos / pedidos** | Aba produtos, pedidos na conta |
| **Vouchers / lanchonete** | Créditos de alimentação |
| **Rateios** | Divisão de custos entre membros |
| **Rede de empresas** | Diretório/networking empresarial (além da mensagem 1:1) |
| **Facial cadastrada** | Biometria facial no perfil |
| **Status financeiro (adimplente)** | Badge de adimplência de clube/mensalidade |

### Fora de escopo (v1)

- Copiar marca, conteúdo ou eventos do **LIDE** (só referência de interação)
- Rede social maçônica permanente além do evento
- Streaming / transmissão ao vivo de rituais
- Marketplace multi-potência / vários eventos de terceiros no lançamento
- Integração obrigatória com WhatsApp/Telegram (mensagem vive no app)
- Fechar orçamento sem esta visão + benchmarking explícito

## Modelo conceitual

### Potência

Jurisdição maçônica cliente — dona do app e do evento dos 125 anos.

### Evento

Confraternização mundial em Curitiba (período, tema/125 anos). Raiz de programação, locais e participantes.

### Local / sala

Ponto (ou espaço interno) na cidade onde ocorrem atividades.

### Atividade

Item da programação: título, data/hora, local, capacidade, confirmados, check-ins, conteúdo “sobre”, mídia de capa.

### Participante

Pessoa inscrita: perfil, carteirinha, ingressos/inscrições, check-ins.

### Confirmação / check-in

Confirmação = intenção de ir (conta na capacidade). Check-in = presença no local/atividade.

### Ingresso / inscrição

Direito de participar de uma atividade (pago ou não — regra comercial no PRD).

### Mensagem

Comunicação entre participantes no contexto do evento.

### Organização

Usuários com permissão de operar programação, locais e visão de presença.

## Critérios de sucesso

- Organização monta a grade e os locais sem planilha paralela.
- Participante vê **agenda do dia** e **lista de atividades** com horário e local.
- Detalhe da atividade mostra **capacidade (X de Y)** e permite **check-in** e **inscrição/ingresso**.
- Participante tem **carteirinha** digital utilizável na entrada.
- Dois inscritos trocam **mensagem** no app.
- Visão + prints de referência permitem **orçamento** com escopo nomeado.
- Escopo v1 cobre confraternização multi-local — sem virar clone de clube empresarial.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Potência** | Jurisdição maçônica cliente; dona do evento e do app |
| **Evento mundial** | Confraternização em Curitiba pelos 125 anos da potência |
| **Agenda** | Visão do dia (faixa de datas + atividades daquele dia) |
| **Programação / eventos** | Lista de atividades do período |
| **Local / sala** | Espaço na cidade (ou interno) vinculado a atividades |
| **Confirmados X/Y** | Quantos confirmaram frente à capacidade |
| **Check-in** | Registro de presença na atividade |
| **Carteirinha** | Identificação digital do participante |
| **Ingresso / inscrição** | Direito de participar de uma atividade |
| **Referência LIDE** | Prints de app de clube/eventos enviados pelo cliente como modelo de UX — não é o produto |

## Regras de negócio (v1)

- Toda **atividade** pertence ao **evento** e, quando presencial, referencia um **local** (ou “a definir” explícito).
- Toda **atividade** tem **início** (data/hora); capacidade (Y) é desejável; **confirmados** e **check-ins** não ultrapassam a regra definida no PRD (fila, bloqueio ou aviso).
- **Check-in** só para participante com inscrição/confirmação válida naquela atividade (detalhe no discovery).
- **Participante** só troca mensagem com outro se ambos estiverem no mesmo evento.
- Papel **organização** edita a grade; participante não.
- Produto v1 é **single-event** (este evento mundial).
- Prints LIDE orientam **padrões de tela e fluxo**; textos, marca e domínio são da potência.
- Itens da tabela **Candidatos** não entram em orçamento v1 sem aceite explícito do cliente.
- Orçamento comercial não faz parte do runtime do app.

## Insumo do cliente

### Pedido falado (áudio)

Orçamento para **aplicativo da potência** no **evento mundial em Curitiba** (125 anos): controle do evento com cronograma/programação, locais cadastrados, quem participa, cadastro, mensagens entre pessoas, programação na cidade com horários e nível de organização. Cliente também buscaria apps de evento / referências.

- Áudio: [`input/WhatsApp Audio 2026-11-13 at 17.46.52.ogg`](input/WhatsApp%20Audio%202026-11-13%20at%2017.46.52.ogg)
- Transcrição: [`input/WhatsApp Audio 2026-11-13 at 17.46.52.transcricao.txt`](input/WhatsApp%20Audio%202026-11-13%20at%2017.46.52.transcricao.txt)
- Texto: [`input/pedido-cliente.txt`](input/pedido-cliente.txt)

### Referência visual (prints)

Pacote de screenshots de app mobile de **clube/eventos (LIDE Paraná)** enviado em seguida ao áudio — índice em [`input/README.md`](input/README.md).

Interpretação: o cliente aponta **esse tipo de produto** como referência (agenda, eventos, detalhe com local/capacidade, check-in, ingresso, salas, perfil/carteirinha, privacidade). Não é brief de clonar o LIDE; é brief de **paridade de experiência** para o evento da potência.

## Próximos passos

→ [`docs/README.md`](docs/README.md) → funcionalidades a partir desta visão  
→ validar com o cliente a tabela **Candidatos**  
→ benchmarking (LIDE + outros apps de evento) → orçamento v1
