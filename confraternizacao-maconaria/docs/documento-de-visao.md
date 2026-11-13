# Documento de visão — Confraternização Maçônica

**Versão:** 3.4 · 2026-11-13

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

- **CU-01** — Cadastrar participante  
  Cria a conta no aplicativo.
- **CU-02** — Autenticar  
  Entra com as credenciais da conta.

### Eventos (Home)

Tela inicial do app. Mapa no topo, boas-vindas em seguida, calendário e lista de eventos na parte inferior.

- **CU-03** — Ver mapa  
  Mostra a localização dos eventos na cidade.
- **CU-04** — Ver boas-vindas  
  Saudação ao participante.
- **CU-05** — Ver calendário  
  Mostra os dias da programação.
- **CU-06** — Selecionar dia  
  Filtra a lista pelo dia escolhido.
- **CU-07** — Ver lista de eventos  
  Data, horário, título, local e confirmados.
- **CU-08** — Abrir evento  
  Leva à tela do evento, pela lista ou pelo mapa.

### Evento

Tela de cada evento, com as funcionalidades referentes a ele. A inscrição libera o grupo do evento no Chat.

- **CU-09** — Ver informações do evento  
  Data, horário, local, confirmados e descrição.
- **CU-10** — Inscrever-se  
  Confirma a participação e libera o grupo.
- **CU-11** — Ver participantes  
  Lista quem está inscrito no evento.

### Inscrições

- **CU-12** — Ver lista de inscrições  
  Eventos em que o participante está inscrito, com acesso a cada um.

### Chat

Grupos e conversas privadas. O grupo do evento depende da inscrição.

- **CU-13** — Ver lista de grupos  
  Grupos liberados pelas inscrições.
- **CU-14** — Abrir grupo  
  Entra na conversa coletiva do evento.
- **CU-15** — Ver lista de conversas privadas  
  Chats individuais do participante.
- **CU-16** — Abrir conversa privada  
  Abre o diálogo com outro participante.
- **CU-17** — Enviar mensagem  
  Publica no grupo ou envia direto a um participante.

### Menu

- **CU-18** — Abrir menu  
  Exibe a navegação principal.
- **CU-19** — Navegar entre seções  
  Alterna entre Eventos, Inscrições e Chat.

### Menu da conta

- **CU-20** — Abrir menu da conta  
  Acessa as opções da conta.
- **CU-21** — Ver perfil  
  Dados cadastrais do participante.
- **CU-22** — Editar perfil  
  Altera os dados do perfil.
- **CU-23** — Alterar senha  
  Redefine a senha de acesso.

### Organização (organizador)

- **CU-24** — Cadastrar local  
  Registra um local da programação na cidade.
- **CU-25** — Cadastrar item da programação  
  Cria o evento com horário e local.

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
