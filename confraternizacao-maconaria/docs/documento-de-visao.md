# Documento de visão — Confraternização Maçônica

**Versão:** 2.9 · 2026-11-13

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

### Home

Boas-vindas no topo, calendário em seguida e lista de eventos na parte inferior.

- **CU-01** — Ver boas-vindas: exibe saudação e identificação do participante na abertura do app.  
- **CU-02** — Ver calendário: mostra os dias da programação na parte superior da Home.  
- **CU-03** — Selecionar dia no calendário: filtra a lista de eventos pelo dia escolhido.  
- **CU-04** — Ver lista de eventos abaixo do calendário: lista os eventos do dia selecionado.  
- **CU-05** — Abrir evento a partir da lista: leva ao detalhe do evento escolhido.  
- **CU-06** — Ver listas de inscrição: mostra as inscrições disponíveis ou já feitas a partir da Home.  
- **CU-07** — Inscrever-se no evento: confirma a participação e libera o chat do evento.  

### Eventos

- **CU-08** — Ver lista de eventos: apresenta data, horário, título, local e confirmados.  
- **CU-09** — Abrir detalhe do evento: abre a tela com as informações completas do evento.  

### Detalhe do evento

- **CU-10** — Ver data, horário, local, confirmados e descrição: consulta as informações do evento.  
- **CU-11** — Inscrever-se no evento: confirma a inscrição a partir do detalhe.  

### Inscrições

A inscrição libera o acesso ao chat (grupo do evento).

- **CU-12** — Ver lista de inscrições: lista as inscrições do participante.  
- **CU-13** — Inscrever-se no evento: realiza a inscrição e libera o grupo.  
- **CU-14** — Acessar o grupo liberado pela inscrição: abre o chat do evento após inscrito.  

### Chat

Menu de chat com grupos e conversas privadas. O acesso ao grupo do evento depende da inscrição.

- **CU-15** — Abrir menu de chat: acessa a área de mensagens.  
- **CU-16** — Ver lista de grupos: lista os grupos liberados pelas inscrições.  
- **CU-17** — Abrir grupo: entra na conversa coletiva do evento.  
- **CU-18** — Ver lista de conversas privadas: lista os chats individuais.  
- **CU-19** — Abrir conversa privada: abre o diálogo com outro participante.  
- **CU-20** — Enviar mensagem no grupo: publica mensagem no grupo do evento.  
- **CU-21** — Enviar mensagem privada: envia mensagem direta a outro participante.  

### Menu

- **CU-22** — Abrir menu: exibe as opções principais de navegação.  
- **CU-23** — Ir para Eventos: navega para a lista de eventos.  
- **CU-24** — Ir para Inscrições: navega para a lista de inscrições.  
- **CU-25** — Ir para Chat: navega para grupos e conversas privadas.  

### Menu da conta

- **CU-26** — Abrir menu da conta: acessa as opções da conta do participante.  
- **CU-27** — Ver perfil: consulta os dados cadastrais.  
- **CU-28** — Editar perfil: altera nome e demais dados do perfil.  
- **CU-29** — Alterar senha: redefine a senha de acesso.  

### Cadastro

- **CU-30** — Cadastrar participante: cria a conta do participante no aplicativo.  

### Participantes

- **CU-31** — Ver quem está participando: identifica os inscritos do evento.  

### Organização (organizador)

- **CU-32** — Cadastrar local: registra um local da programação na cidade.  
- **CU-33** — Cadastrar item da programação: cria evento com horário e local.  

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
