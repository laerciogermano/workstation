# Caronas — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Timeline de prompts: [`prompts/`](prompts/).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Caronas** é o app onde pessoas que fazem o **mesmo trajeto de casa ao trabalho todos os dias** encontram quem pode **compartilhar a ida e a volta**. Em vez de um carro por pessoa ou um ônibus desconfortável, o deslocamento vira uma **carona recorrente**: menos carros na rua, menos custo para quem participa.

## Problema

O deslocamento diário para o trabalho concentra três dores:

| Dor | O que acontece hoje |
|-----|---------------------|
| **Engarrafamento** | Muita gente faz o mesmo caminho, sozinha no próprio carro. O fluxo aumenta, o tempo de viagem cresce e a cidade trava no horário de pico. |
| **Alto custo de logística** | Combustível, pedágio, estacionamento e desgaste do veículo ficam inteiros com uma pessoa. Quem usa transporte público também paga caro por um serviço que não resolve o desconforto. |
| **Ônibus desconfortável** | Lotação, espera, atrasos e pouca previsibilidade tornam o trajeto cansativo antes mesmo da jornada de trabalho começar. |

As pessoas **já repetem o mesmo trajeto**, nos mesmos horários, nos mesmos dias. O que falta é um jeito simples de **encontrar quem vai para o mesmo lugar** e dividir o carro.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Motorista** | Quem tem carro e já faz o trajeto casa–trabalho | Oferecer vagas ociosas, reduzir o custo da viagem e ter companhia previsível |
| **Passageiro** | Quem precisa ir ao trabalho sem ir sozinho de carro ou de ônibus | Encontrar carona no próprio trajeto, com horário estável e custo compartilhado |
| **Participante** | Quem às vezes dirige e às vezes pega carona | Alternar papéis sem cadastrar a vida duas vezes |

## Objetivo

Conectar pessoas do **mesmo trajeto recorrente de trabalho** para que compartilhem caronas de ida e volta, **reduzindo o fluxo de carros** e o **custo de deslocamento** de quem participa.

## Proposta de valor

O Caronas trata o deslocamento para o trabalho como uma **rotina compartilhada**, não como uma corrida avulsa. Quem já vai, leva quem já iria.

| Necessidade | O que o Caronas faz |
|-------------|---------------------|
| Encontrar quem faz o mesmo caminho | Combinar origem, destino, dias e horários de ida e volta |
| Dividir o custo da viagem | Estimar e registrar a partilha entre motorista e passageiros |
| Sair do ônibus e do carro vazio | Oferecer e aceitar vagas em caronas recorrentes |
| Confiar em quem viaja junto | Perfil, histórico de caronas e avaliação após a viagem |
| Manter a rotina | Caronas que se repetem nos dias úteis, não só uma vez |

### Exemplos

**Oferecer a ida** — Ana sai de casa às 7h20 em Campinas e chega ao escritório às 8h10. Ela cadastra o trajeto, os dias da semana e duas vagas. O app mostra quem mora no caminho e precisa chegar no mesmo horário.

**Pegar a volta** — Bruno pega ônibus lotado todo dia. Ele busca caronas no trecho casa–trabalho, aceita a vaga da Ana na segunda, quarta e sexta, e divide combustível e pedágio.

**Alternar a direção** — No mesmo grupo, Ana dirige na ida e outro colega dirige na quinta. O custo e o esforço não ficam só com uma pessoa.

## Princípios

1. **Trajeto recorrente primeiro** — o produto existe para a rotina casa–trabalho, não para corridas avulsas de aplicativo.
2. **Mesmo caminho, mesmo horário** — o encaixe é geográfico e temporal; sem isso, não há carona útil.
3. **Custo compartilhado, não tarifa** — participantes dividem o deslocamento; o app não é uma praça de motorista profissional.
4. **Dois papéis, uma conta** — motorista e passageiro são o mesmo usuário em momentos diferentes.
5. **Confiança visível** — histórico e avaliação pesam mais do que um anúncio isolado.
6. **Menos carros na rua** — sucesso se mede também em vagas ocupadas, não só em cadastros.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Conta** | Cadastro, perfil, papel (motorista, passageiro ou ambos) |
| **Trajeto** | Origem, destino do trabalho, dias da semana, horário de ida e de volta |
| **Oferta** | Publicar vagas no carro, pontos de encontro, regras da carona |
| **Busca** | Encontrar caronas compatíveis com o próprio trajeto e horário |
| **Combinar** | Pedir vaga, aceitar, recusar, confirmar ida e volta |
| **Custo** | Estimar divisão (combustível, pedágio) e registrar o combinado |
| **Confiança** | Avaliação após a viagem e histórico de caronas |
| **Rotina** | Repetir a carona nos dias combinados; pausar um dia |

### Fora de escopo (v1)

- Pagamento integrado (Pix, cartão, carteira)
- Corridas avulsas no estilo aplicativo de transporte
- Motorista profissional / tarifação dinâmica
- Rastreamento GPS em tempo real da viagem
- Integração com RH, vale-transporte ou estacionamento da empresa
- Chat avançado além do combinado da carona

## Modelo conceitual

### Trajeto

A unidade de rotina: **origem** (casa ou ponto de partida), **destino** (trabalho), **dias** e **horários** de ida e volta. É o que torna duas pessoas compatíveis.

### Carona

Uma ocorrência (ou série recorrente) em que um **motorista** leva um ou mais **passageiros** no trajeto combinado. Tem vagas, ponto de encontro, horário e partilha de custo.

### Combinado

O acordo entre motorista e passageiro: dias, horários, ponto, valor estimado e status (`pedido` → `aceito` → `confirmado` → `realizado` / `cancelado` / `faltou`).

### Custo compartilhado

Valor de referência da viagem (combustível, pedágio e, se fizer sentido, estacionamento) dividido entre quem ocupou o carro naquela ocorrência — não é preço de corrida.

## Critérios de sucesso

- Pessoas do mesmo trajeto de trabalho encontram carona **sem improvisar em grupo de mensagem**.
- O passageiro deixa o ônibus (ou o segundo carro) em dias recorrentes, não só uma vez.
- O motorista reduz o custo por viagem ao ocupar vagas que já existiam.
- Há evidência de **menos carros no mesmo fluxo** (vagas ocupadas em trajetos repetidos).
- Confiança se constrói com histórico e avaliação, não só com o primeiro encontro.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Trajeto** | Caminho recorrente casa–trabalho com dias e horários |
| **Carona** | Viagem compartilhada oferecida por um motorista |
| **Vaga** | Assento disponível no carro naquela ocorrência |
| **Combinado** | Acordo entre motorista e passageiro para ida e/ou volta |
| **Partilha** | Divisão do custo da viagem entre participantes |
| **Rotina** | Repetição da carona nos dias úteis combinados |

## Regras de negócio (v1)

- Uma conta por pessoa; a mesma conta pode oferecer e pedir carona.
- Trajeto exige origem, destino, pelo menos um dia da semana e horário de ida ou volta.
- Compatibilidade considera proximidade do trajeto **e** janela de horário — não só o destino final.
- Motorista define vagas, ponto de encontro e se aceita ida, volta ou ambos.
- Passageiro solicita; motorista aceita ou recusa; os dois podem cancelar com registro do motivo.
- Partilha é estimativa e combinado entre pessoas; o app não processa pagamento em v1.
- Avaliação só depois de carona com status `realizado`.
- Pausar um dia não apaga a rotina nem o histórico.

## Próximos passos

→ [`docs/README.md`](docs/README.md) → inventário de funcionalidades (a produzir)
