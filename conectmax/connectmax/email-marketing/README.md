# E-mail marketing — Documento de visão

Sistema simples de e-mail marketing da Connect.

## Contexto

Na Connect, é necessário um sistema de e-mail marketing do zero, bem simples, com front-end para campanhas e cadastro de base de e-mails em listas. A base é usada para enviar os e-mails das campanhas: configura-se para qual lista vai o envio e acompanha-se o progresso. Em essência: campanhas, listas e o envio de e-mails para essas listas.

## Objetivo

Disponibilizar um front-end em que se cadastram listas (base de e-mails), criam-se campanhas, configura-se a lista de destino de cada campanha, dispara-se o envio e se acompanha o progresso do envio — apenas isso.

## Casos de uso

**Persona:** operador de marketing da Connect — quem usa o front-end para montar listas, campanhas e disparos.

| ID | Caso de uso | Persona | Descrição |
|----|-------------|---------|-----------|
| CU-01 | Cadastrar base de e-mails em listas | Operador de marketing | Cadastra e-mails organizados em listas. |
| CU-02 | Criar campanhas | Operador de marketing | Cria e mantém campanhas no front-end. |
| CU-03 | Configurar lista da campanha | Operador de marketing | Define para qual lista a campanha envia. |
| CU-04 | Enviar e-mails da campanha | Operador de marketing | Dispara o envio da campanha para a lista configurada. |
| CU-05 | Acompanhar progresso do envio | Operador de marketing | Vê o progresso do envio de e-mails da campanha. |
