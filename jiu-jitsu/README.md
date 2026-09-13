# Jiu-jitsu — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Timeline de prompts: [`prompts/`](prompts/).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Jiu-jitsu** é o app (e a base de conhecimento) em que o praticante **vê o grafo de posições e transições**: a partir de um **estado** (posição, controle, grips), consulta **todas as possibilidades de próximo movimento** catalogadas — passagem, raspagem, finalização, escape, retenção — e entende **para onde cada escolha leva**. Em vez de vídeo solto ou caderno sem ligação, o aprendizado vira **mapa navegável do jogo**.

## Problema

Quem treina jiu-jitsu aprende movimentos, mas quase nunca vê o **sistema** por trás deles.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Movimento sem mapa** | Aulas e vídeos ensinam técnicas isoladas. Falta ver *de onde* saem e *para onde* chegam. |
| **“E agora?” no tatame** | Na posição, a pessoa não lembra o leque de opções — só o que treinou por último. |
| **Catálogo incompleto e disperso** | Não existe, na prática do aluno, um lugar com **todas as possibilidades** a partir de um estado; o conhecimento fica na cabeça do professor, em playlists e anotações. |
| **Progressão opaca** | Sem grafo, é difícil saber o que estudar depois, o que falta no jogo e quais caminhos ainda não foram explorados. |
| **Estudo sem contexto de estado** | Buscar “guarda fechada” devolve dezenas de técnicas sem ordenar por transição, risco ou objetivo. |

O praticante **já treina posições e movimentos**. O que falta é um **grafo de estados**: cada nó é uma situação; cada aresta é um movimento possível; a pergunta central é *“a partir daqui, o que posso fazer?”*.

### Sobre o catálogo completo

**Ninguém — humano ou IA — possui de antemão “todas” as possibilidades de movimento do jiu-jitsu.** O esporte é vasto, evolui e varia por escola, regras (gi / no-gi) e nível. O produto **não assume** um grafo universal fechado no dia um.

O que o produto **assume**:

1. Um **modelo de grafo** (estado → movimentos → novos estados) como forma canônica do conhecimento.
2. Um **catálogo curado e versionado** que cresce com especialistas, fontes confiáveis e contribuição controlada.
3. A capacidade de, **para cada estado já modelado**, listar os **próximos movimentos conhecidos** na base — e deixar explícito o que ainda **não** está catalogado.

Resposta direta à pergunta do produto: *“Você tem todas as possibilidades de próximos movimentos?”* — **tem as que estão no grafo para aquele estado**. Completude é meta de cobertura da base, não pretensão de omnisciência.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Iniciante** | Quem está montando o vocabulário de posições | Ver estados básicos e poucas saídas claras a partir de cada um |
| **Intermediário** | Quem já rola e quer fechar buracos no jogo | Explorar o leque a partir das posições em que trava ou perde |
| **Avançado / competidor** | Quem periodiza estudo e jogo | Navegar caminhos longos, cadeias e variantes por regra (gi/no-gi) |
| **Professor / coach** | Quem monta aula e currículo | Usar o grafo para planejar sequências e cobrir opções do aluno |

## Objetivo

Ser a **fonte navegável do jogo de jiu-jitsu**: um grafo em que cada **estado** expõe as **possibilidades de próximo movimento** catalogadas, com destino, intenção e contexto — para estudar, treinar e ensinar com mapa, não só com lista de técnicas.

## Proposta de valor

O Jiu-jitsu trata o jogo como **grafo de estados**, não como biblioteca de vídeos. Você escolhe (ou reconhece) onde está; o sistema mostra o que a base conhece como próximo passo; cada escolha atualiza o estado.

| Necessidade | O que o Jiu-jitsu faz |
|-------------|----------------------|
| Saber onde está | Representar **estados** (posição, controle, lado, grips relevantes) |
| Ver o que pode fazer a partir daí | Listar **próximos movimentos** ligados àquele estado no grafo |
| Entender para onde vai | Cada movimento aponta para o **estado de destino** (e variantes) |
| Estudar cadeias | Percorrer caminhos (estado → movimento → estado → …) |
| Fechar o mapa com honestidade | Mostrar cobertura: o que está modelado vs. lacunas conhecidas |
| Adaptar ao contexto | Filtrar por gi / no-gi, objetivo (passar, raspar, finalizar, escapar), nível |

### Exemplos

**Estado → opções** — Ana está em **guarda fechada (baixo)**. O app mostra o estado e os movimentos catalogados: abertura de guarda + knee cut, torre, pressão na linha média, etc. — cada um com o estado em que ela (ou o parceiro) termina.

**“E se eu raspar?”** — Bruno escolhe uma raspagem listada a partir da guarda. O grafo leva ao estado **montada** (ou lateral, conforme a técnica). Dali, novas finalizações e retenções aparecem.

**Buraco no jogo** — Carla perde sempre da lateral. Ela abre o estado **controle lateral (baixo)** e estuda só escapes e recuperações de guarda presentes na base — um subgrafo, não um feed infinito de vídeos.

**Aula do professor** — Diego monta a aula “da guarda fechada ao passe”. Usa o grafo para escolher 3 caminhos distintos e mostrar aos alunos que **o mesmo estado** admite várias intenções.

## Princípios

1. **Estado primeiro** — movimento sem estado de origem e destino não entra no núcleo do produto.
2. **Grafo explícito** — posições são nós; movimentos são arestas; a UI e a base falam essa linguagem.
3. **Completude honesta** — “todas as possibilidades” = todas as **catalogadas** para aquele estado; lacunas são visíveis.
4. **Catálogo vivo** — a base cresce com curadoria; não se finge grafo universal fechado.
5. **Contexto de regra e objetivo** — gi/no-gi e intenção filtram o leque sem apagar o mapa.
6. **Estudo navegável** — o valor está em explorar e encadear, não só em consumir um vídeo.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Estados** | Cadastro e consulta de posições/estados do jogo (nó do grafo) |
| **Movimentos** | Técnicas/transições como arestas: origem, destino, nome, intenção |
| **Grafo a partir do estado** | Dado um estado, listar **próximos movimentos** possíveis na base |
| **Navegação** | Percorrer estado → movimento → novo estado; histórico do caminho |
| **Busca** | Encontrar estado ou movimento por nome / tags |
| **Filtros** | Gi / no-gi, objetivo (passar, raspar, finalizar, escapar, reter), nível |
| **Cobertura** | Indicar, por estado, se há movimentos catalogados e sinalizar lacunas |
| **Estudo** | Favoritar estados/caminhos; marcar “já treinei” / “quero estudar” |
| **Conteúdo de apoio** | Notas, passos-chave e referência (ex.: link ou mídia) por movimento — sem depender de player proprietário |

### Fora de escopo (v1)

- Reconhecimento automático de posição por câmera / vídeo ao vivo
- Simulação física 3D completa do corpo
- Rede social completa de atletas
- Marketplace de academias ou pagamento de mensalidade
- Árbitro / scoreboard de competição em tempo real
- Afirmar cobertura de **100%** do jiu-jitsu mundial no lançamento

## Modelo conceitual

### Estado

Uma situação distinguível no jogo: posição dominante/inferior, tipo de guarda, controle (montada, costas, lateral…), e atributos relevantes (lado, grips, gancho, etc.). É o **nó** do grafo. “Onde estou / onde o jogo está.”

### Movimento

Uma transição intencional entre estados (ou que mantém o estado com novo controle): passe, raspagem, escape, finalização, retenção, transição de guarda. É a **aresta**: tem origem, destino (ou desfecho, no caso de finalização), e metadados (gi/no-gi, dificuldade, objetivo).

### Grafo de movimentação

O conjunto de estados e movimentos. Pergunta canônica: *dado o estado S, quais arestas saem de S?* A resposta é o leque de **próximos movimentos** conhecidos.

### Caminho

Sequência estado → movimento → estado → … usada para estudar encadeamentos e montar aula ou plano de treino.

### Cobertura

Medida (qualitativa ou quantitativa) de quanto daquele estado já tem saídas modeladas. Sustenta a honestidade do “todas as possibilidades **na base**”.

### Catálogo

A base curada e versionada de estados e movimentos. Cresce ao longo do tempo; não é um dump genérico sem validação.

## Critérios de sucesso

- A partir de um estado modelado, a pessoa vê a lista de **próximos movimentos** sem sair do mapa.
- Cada movimento deixa claro o **estado de destino** (ou o desfecho de finalização).
- Dá para navegar **cadeias** (caminhos) e voltar no grafo.
- Filtros por gi/no-gi e objetivo reduzem o leque sem perder o contexto do estado.
- A interface (ou a doc) deixa claro o que está **catalogado** vs. lacuna — sem prometer grafo total do esporte.
- Iniciante e professor conseguem usar o mesmo modelo: um para aprender opções; o outro para montar sequência.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Estado** | Nó do grafo: situação/posição (e atributos) no jogo |
| **Movimento** | Aresta: transição ou ação a partir de um estado |
| **Próximos movimentos** | Arestas que saem do estado atual na base |
| **Grafo** | Rede de estados e movimentos |
| **Caminho** | Sequência navegável de estados e movimentos |
| **Cobertura** | Quão completo está o leque de um estado na base |
| **Catálogo** | Conjunto curado de estados e movimentos versionados |
| **Intenção** | Objetivo do movimento (passar, raspar, finalizar, escapar, reter…) |
| **Gi / no-gi** | Contexto de regra/vestimenta que filtra técnicas aplicáveis |
| **Finalização** | Movimento cujo desfecho encerra o combate (em vez de só mudar posição) |

## Regras de negócio (v1)

- Todo **movimento** no núcleo do produto tem **estado de origem**; movimento sem origem não entra no grafo navegável.
- Movimento de transição declara **estado de destino**; finalização declara desfecho de finalização (e pode registrar o estado em que ocorreu).
- “Próximos movimentos” de um estado = arestas **na base** com origem naquele estado, após filtros ativos (gi/no-gi, intenção, etc.).
- O produto **não** afirma que a lista é exaustiva do esporte; afirma que é exaustiva **em relação ao catálogo** para aquele estado e filtros.
- Estados e movimentos têm identificadores estáveis; renomear não quebra caminhos salvos.
- Conteúdo do catálogo v1 é **curado** (não publicação aberta sem revisão).
- Favoritos e “já treinei” são por usuário e não alteram o grafo global.

## Próximos passos

→ [`docs/README.md`](docs/README.md) → inventário de funcionalidades (a produzir)
