# Documento de visão — Confraternização Maçônica

**Versão:** 1.6 · 2026-11-13

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

## 6. Casos de uso

Casos de uso por objeto, com ações concretas que o usuário realiza:

### Conta

- **CU-01** — Cadastrar participante  
- **CU-02** — Visualizar perfil  
- **CU-03** — Editar perfil  
- **CU-04** — Alterar senha  
- **CU-05** — Cadastrar facial  
- **CU-06** — Aceitar ou rejeitar cookies de privacidade  

### Participante

- **CU-07** — Visualizar quem está participando  
- **CU-08** — Enviar mensagem para outro participante  

### Local

- **CU-09** — Cadastrar local  
- **CU-10** — Visualizar salas  

### Programação / evento

- **CU-11** — Cadastrar item da programação (com horário e local na cidade)  
- **CU-12** — Visualizar lista de eventos (data, horário, título, imagem e confirmados)  
- **CU-13** — Visualizar detalhe do evento (banner, data, horário, local, confirmados e sobre)  
- **CU-14** — Fazer check-in no evento  
- **CU-15** — Comprar ingresso do evento  

### Agenda

- **CU-16** — Selecionar dia  
- **CU-17** — Visualizar eventos do dia  

### Carteirinha

- **CU-18** — Visualizar carteirinha  

### Ingresso

- **CU-19** — Visualizar ingressos da conta  

### Check-in

- **CU-20** — Visualizar check-ins da conta  

### Estacionamento

- **CU-21** — Visualizar vagas de estacionamento  

### Produto

- **CU-22** — Visualizar produtos  

### Voucher

- **CU-23** — Visualizar vouchers  

### Pedido

- **CU-24** — Visualizar pedidos  

### Rateio

- **CU-25** — Visualizar rateios  

### Rede de empresas

- **CU-26** — Visualizar rede de empresas  

### Notificação

- **CU-27** — Visualizar notificações  

### Navegação

- **CU-28** — Abrir menu  
- **CU-29** — Navegar entre Agenda, Eventos, Salas e Produtos  

---

## 7. Referências

O projeto adota, como referência de experiência, o padrão de aplicativos de evento/clube com:

- Agenda (dias e eventos do dia)  
- Lista e detalhe de eventos (data, horário, local, confirmados, descrição)  
- Check-in  
- Ingressos  
- Carteirinha  
- Salas  
- Estacionamento  
- Produtos  
- Perfil e conta  
- Privacidade e cookies  
- Notificações na interface  

A programação, os locais e os participantes exibidos no aplicativo serão os do **evento do projeto**, e não os de outras instituições usadas apenas como referência de interface.

### Imagens de referência

**Home com privacidade e cookies**

![Home com modal de privacidade e cookies](referencias/01-home-privacidade.jpeg)

**Agenda**

![Agenda com eventos do dia e acesso rápido](referencias/02-agenda.jpeg)

**Lista de eventos**

![Lista de eventos com data, horário e confirmados](referencias/03-lista-eventos.jpeg)

**Check-in e ingresso**

![Ações de check-in e comprar ingresso](referencias/04-checkin-ingresso.jpeg)

**Detalhe do evento**

![Detalhe do evento com data, horário, local e confirmados](referencias/05-detalhe-evento.jpeg)

**Perfil**

![Perfil e informações da conta](referencias/06-perfil.jpeg)

---

## 8. Sites de referência maçônicos

| Instituição | Site |
|-------------|------|
| Grande Oriente do Brasil – Paraná (GOB-PR) | [https://gob-pr.org.br/](https://gob-pr.org.br/) |
| Maçonaria do Paraná | [https://maconariadoparana.org.br/](https://maconariadoparana.org.br/) |
| Grande Loja do Paraná (GLP) | [https://www.glp.org.br/](https://www.glp.org.br/) |
| Grande Oriente do Brasil (GOB) | [http://www.gob.org.br/](http://www.gob.org.br/) |
| Confederação Maçônica do Brasil (COMAB) | [https://comab.org.br/](https://comab.org.br/) |
| Confederação da Maçonaria Simbólica do Brasil (CMSB) | [http://www.cmsb.org.br/](http://www.cmsb.org.br/) |

---

## 9. Prazo

| Marco | Situação |
|-------|----------|
| Realização do evento | Próximo ano, em Curitiba |
| Data exata do evento | A definir |
| Entrega do aplicativo | Vinculada à realização do evento no próximo ano; cronograma detalhado a definir |
