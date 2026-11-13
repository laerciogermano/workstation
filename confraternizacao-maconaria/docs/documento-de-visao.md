# Documento de visão — Confraternização Maçônica

**Versão:** 3.2 · 2026-11-13

## 1. Contexto

No próximo ano será realizado em Curitiba um **evento mundial** da maçonaria, em comemoração aos **125 anos** da instituição organizadora. O encontro tem caráter de **confraternização**, com **programação distribuída pela cidade** e organizada por **horários**.

O projeto **Confraternização Maçônica** consiste no **aplicativo oficial do evento**, destinado ao **controle operacional** dessa confraternização.

---

## 2. Objetivo

Disponibilizar o aplicativo oficial para o controle do evento mundial, assegurando programação, locais, participantes e comunicação entre inscritos, de forma compatível com a confraternização multi-local em Curitiba.

---

## 3. Personas

| Persona | Papel |
|---------|--------|
| **Organizador** | Responsável pelo controle do evento e pela organização da programação, dos locais e dos participantes |
| **Participante** | Pessoa cadastrada que consulta a programação, utiliza locais e serviços do evento e se comunica com outros participantes |

---

## 4. Público-alvo

| Critério | Definição |
|----------|-----------|
| **Idade** | 45 a 65 anos |

---

## 5. Funcionalidades citadas

- Controle do evento  
- Cronograma / programação  
- Programação na cidade inteira  
- Horários na programação  
- Locais cadastrados  
- Cadastro de participantes  
- Identificação de quem está participando  
- Mensagem de um participante para outro  
- Nível de organização do evento  
- Aplicativo oficial do evento  

---

## 6. Escopo por tela

Funcionalidades agrupadas pela tela em que o usuário as realiza:

### Autenticação e cadastro

- **CU-01** — Cadastrar participante: cria a conta do participante no aplicativo.  
- **CU-02** — Autenticar: entra no aplicativo com as credenciais da conta.  

### Eventos (Home)

Tela inicial do app. Mapa no topo (localização dos eventos), boas-vindas em seguida, calendário e lista de eventos na parte inferior.

- **CU-03** — Ver mapa: exibe no topo a localização dos eventos na cidade.  
- **CU-04** — Ver boas-vindas: exibe saudação e identificação do participante.  
- **CU-05** — Ver calendário: mostra os dias da programação.  
- **CU-06** — Selecionar dia no calendário: filtra a lista de eventos pelo dia escolhido.  
- **CU-07** — Ver lista de eventos: apresenta data, horário, título, local e confirmados.  
- **CU-08** — Abrir evento a partir da lista: leva à tela do evento escolhido.  
- **CU-09** — Abrir evento a partir do mapa: leva à tela do evento pelo ponto no mapa.  

### Evento

Tela de cada evento, com as funcionalidades referentes a esse evento. A inscrição libera o acesso ao chat (grupo do evento).

- **CU-10** — Ver data, horário, local, confirmados e descrição: consulta as informações do evento.  
- **CU-11** — Inscrever-se no evento: confirma a participação e libera o grupo.  
- **CU-12** — Ver quem está participando: identifica os inscritos desse evento.  
- **CU-13** — Acessar o grupo do evento: abre o chat liberado pela inscrição.  

### Inscrições

- **CU-14** — Ver lista de inscrições: lista as inscrições do participante.  
- **CU-15** — Abrir evento a partir da inscrição: leva à tela do evento inscrito.  

### Chat

Menu de chat com grupos e conversas privadas. O acesso ao grupo do evento depende da inscrição.

- **CU-16** — Abrir menu de chat: acessa a área de mensagens.  
- **CU-17** — Ver lista de grupos: lista os grupos liberados pelas inscrições.  
- **CU-18** — Abrir grupo: entra na conversa coletiva do evento.  
- **CU-19** — Ver lista de conversas privadas: lista os chats individuais.  
- **CU-20** — Abrir conversa privada: abre o diálogo com outro participante.  
- **CU-21** — Enviar mensagem no grupo: publica mensagem no grupo do evento.  
- **CU-22** — Enviar mensagem privada: envia mensagem direta a outro participante.  

### Menu

- **CU-23** — Abrir menu: exibe as opções principais de navegação.  
- **CU-24** — Ir para Eventos: volta à Home de eventos.  
- **CU-25** — Ir para Inscrições: navega para a lista de inscrições.  
- **CU-26** — Ir para Chat: navega para grupos e conversas privadas.  

### Menu da conta

- **CU-27** — Abrir menu da conta: acessa as opções da conta do participante.  
- **CU-28** — Ver perfil: consulta os dados cadastrais.  
- **CU-29** — Editar perfil: altera nome e demais dados do perfil.  
- **CU-30** — Alterar senha: redefine a senha de acesso.  

### Organização (organizador)

- **CU-31** — Cadastrar local: registra um local da programação na cidade.  
- **CU-32** — Cadastrar item da programação: cria evento com horário e local.  

---

## 7. Prazo

| Marco | Situação |
|-------|----------|
| Realização do evento | Próximo ano, em Curitiba |
| Data exata do evento | A definir |
| Entrega do aplicativo | Vinculada à realização do evento no próximo ano; cronograma detalhado a definir |

---

## 8. Referências

O projeto adota, como referência de experiência, o padrão de aplicativos de evento/clube com:

- Agenda (dias e eventos do dia)  
- Lista e detalhe de eventos (data, horário, local, confirmados, descrição)  
- Inscrição em eventos  
- Chat (grupos e privados)  
- Perfil e conta  

A programação, os locais e os participantes exibidos no aplicativo serão os do **evento do projeto**, e não os de outras instituições usadas apenas como referência de interface.

### Imagens de referência

**Home com privacidade e cookies**

![Home com modal de privacidade e cookies](referencias/01-home-privacidade.jpeg)

**Agenda**

![Agenda com eventos do dia e acesso rápido](referencias/02-agenda.jpeg)

**Lista de eventos**

![Lista de eventos com data, horário e confirmados](referencias/03-lista-eventos.jpeg)

**Ação no evento**

![Ação no evento](referencias/04-checkin-ingresso.jpeg)

**Detalhe do evento**

![Detalhe do evento com data, horário, local e confirmados](referencias/05-detalhe-evento.jpeg)

**Perfil**

![Perfil e informações da conta](referencias/06-perfil.jpeg)

---

## 9. Sites de referência maçônicos

| Instituição | Site |
|-------------|------|
| Grande Oriente do Brasil – Paraná (GOB-PR) | [https://gob-pr.org.br/](https://gob-pr.org.br/) |
| Maçonaria do Paraná | [https://maconariadoparana.org.br/](https://maconariadoparana.org.br/) |
| Grande Loja do Paraná (GLP) | [https://www.glp.org.br/](https://www.glp.org.br/) |
| Grande Oriente do Brasil (GOB) | [http://www.gob.org.br/](http://www.gob.org.br/) |
| Confederação Maçônica do Brasil (COMAB) | [https://comab.org.br/](https://comab.org.br/) |
| Confederação da Maçonaria Simbólica do Brasil (CMSB) | [http://www.cmsb.org.br/](http://www.cmsb.org.br/) |
