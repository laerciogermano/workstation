# Fitness — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Timeline de prompts: [`prompts/`](prompts/).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Fitness** é o app que reúne **treino, dieta e métricas** num só lugar, com **gamificação no estilo Strava**: a pessoa acompanha a evolução, completa desafios, ganha progresso visível e mantém o hábito — sem espalhar planilha, app de calorias e caderno de treino em ferramentas separadas.

## Problema

Quem treina e cuida da alimentação costuma viver com a rotina fragmentada:

| Dor | O que acontece hoje |
|-----|---------------------|
| **Ferramentas espalhadas** | Treino num app, dieta em outro, peso no celular, fotos no álbum — nada conversa. |
| **Metas sem âncora metabólica** | Falta base clara (TMB, gasto, déficit/superávit) para saber se a estratégia faz sentido. |
| **Dieta desconectada da geladeira** | Planos idealizados ignoram o que a pessoa já tem em casa; macros ficam no papel. |
| **Treino genérico** | Fichas que não cobrem musculação, calistenia e outras modalidades no mesmo fluxo, nem estimam calorias por exercício. |
| **Evolução invisível** | Sem dashboards, gráficos e timeline de fotos, a motivação cai e o progresso some. |
| **Hábito frágil** | Sem reconhecimento, streaks e desafios sociais (como no Strava), a constância some. |

A pessoa **já quer treinar, comer melhor e medir resultado**. O que falta é um hub que una **estratégia calórica + plano + execução + prova visual da evolução**, com motivação gamificada.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Iniciante** | Quem está começando a treinar e a controlar a alimentação | Orientação simples: basal, meta calórica, treino básico e registro sem sobrecarga |
| **Intermediário** | Quem já treina e quer consistência | Montar dieta por macros ou por o que tem em casa; acompanhar métricas e fotos |
| **Avançado / atleta amador** | Quem periodiza treino e controla déficit/superávit | Modalidades diversas, calorias por exercício, dashboards e gamificação de longo prazo |

## Objetivo

Ser o **único app diário** para montar e acompanhar **treino + dieta + métricas**, com base metabólica (basal e estratégia calórica), evidência visual (gráficos e fotos) e **gamificação** que sustente o hábito.

## Proposta de valor

O Fitness trata saúde e performance como um **sistema integrado**: o que você gasta, o que você come, o que você treina e o que você mede — tudo alinhado a uma estratégia (déficit ou superávit) e reforçado por progresso gamificado.

| Necessidade | O que o Fitness faz |
|-------------|---------------------|
| Saber quanto o corpo gasta em repouso | Calcular e atualizar **taxa metabólica basal** com os dados do perfil |
| Definir se emagrece ou ganha massa | Escolher e acompanhar **estratégia de déficit ou superávit** calórico |
| Ver se está evoluindo | **Métricas**, dashboards e gráficos de evolução |
| Prova visual do corpo | **Fotos** em timeline para comparar ao longo do tempo |
| Dieta realista | Montar dieta com base no que **já tem disponível** |
| Dieta precisa | Montar dieta por **macronutrientes** (proteína, carbo, gordura) |
| Treinar de formas diferentes | Montar treinos: musculação, calistenia e outras modalidades |
| Entender o custo energético do treino | Cada exercício **estima calorias** no plano e na sessão |
| Manter o hábito | Gamificação inspirada no Strava: streaks, desafios, conquistas, feed de progresso |

### Exemplos

**Base + estratégia** — Carla informa idade, sexo, peso, altura e nível de atividade. O app calcula a basal, sugere gasto diário e ela escolhe déficit moderado para emagrecer. Treino e dieta passam a orbitar essa meta.

**Dieta com o que tem em casa** — João lista ovo, frango, arroz, banana e azeite. O app monta refeições que cabem nos macros do dia e no déficit escolhido, sem inventar ingredientes que ele não tem.

**Treino misto com calorias** — Ana monta um dia de musculação (supino, remada, agachamento) e outro de calistenia (barra, flexão, prancha). Cada exercício mostra estimativa calórica; a sessão fecha o gasto do dia junto com a basal.

**Evolução visível** — Bruno registra peso, circunferências e fotos de frente/lado a cada 2 semanas. O dashboard mostra tendência; a timeline de fotos deixa a mudança óbvia. Streaks e desafios mantêm a sequência.

## Princípios

1. **Um hub, três pilares** — treino, dieta e métricas vivem juntos; a estratégia calórica amarra os três.
2. **Basal primeiro** — meta de déficit/superávit parte de dados reais do perfil, não de chute.
3. **Dieta executável** — o plano respeita o que a pessoa tem disponível e/ou os macros definidos.
4. **Treino multimodal** — musculação, calistenia e outras modalidades no mesmo modelo de sessão e exercício.
5. **Calorias no movimento** — exercício e sessão contribuem para o balanço energético do dia.
6. **Evidência > opinião** — gráficos, dashboards e fotos na timeline mostram evolução.
7. **Gamificação a serviço do hábito** — reconhecimento e desafio social reforçam constância, sem substituir o conteúdo do plano.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Conta e perfil** | Cadastro; dados para basal (idade, sexo, peso, altura, atividade); objetivo |
| **Basal e energia** | Cálculo de TMB / gasto estimado; estratégia de **déficit** ou **superávit**; meta calórica diária |
| **Métricas** | Registrar peso, medidas e outras métricas; dashboards e gráficos de evolução |
| **Fotos / timeline** | Upload de fotos de progresso; comparar ao longo do tempo |
| **Dieta por estoque** | Informar alimentos disponíveis; montar plano alimentar a partir disso |
| **Dieta por macros** | Definir alvos de proteína, carbo e gordura; montar refeições alinhadas |
| **Treinos** | Montar treinos de musculação, calistenia e outras modalidades; biblioteca de exercícios |
| **Calorias no treino** | Estimar calorias por exercício e por sessão; somar ao balanço do dia |
| **Gamificação** | Streaks, conquistas, desafios, feed/atividade no espírito Strava |
| **Acompanhamento diário** | Visão do dia: meta calórica, treino previsto, refeições, progresso gamificado |

### Fora de escopo (v1)

- Consulta médica ou prescrição profissional automatizada
- Wearables / sync profundo com Apple Health, Google Fit, Garmin (pode entrar depois)
- Marketplace de personal trainers ou nutricionistas
- Pagamento de planos premium (modelo de negócio fica aberto)
- Receitas com IA generativa sem vínculo a estoque/macros
- Rede social completa além do feed de progresso e desafios

## Modelo conceitual

### Perfil metabólico

Dados do usuário usados para **basal** e gasto estimado (idade, sexo, peso, altura, nível de atividade). É a base numérica da estratégia.

### Estratégia calórica

Escolha consciente de **déficit**, **manutenção** ou **superávit**, com meta diária em kcal. Treino e dieta se alinham a essa meta.

### Métrica

Registro pontual (peso, circunferência, % gordura, etc.) que alimenta **dashboards** e **gráficos** de evolução.

### Foto de progresso

Imagem datada (e opcionalmente etiquetada: frente, lado, costas) que entra na **timeline** para comparação visual.

### Estoque alimentar

Lista do que a pessoa **tem disponível**; entrada para montagem de dieta realista.

### Plano alimentar

Conjunto de refeições do dia/semana, gerado ou ajustado por **estoque** e/ou por **macros**, respeitando a estratégia calórica.

### Treino e exercício

**Treino** é uma sessão (ou ficha) com modalidade (musculação, calistenia, etc.). Cada **exercício** tem séries/reps/carga ou duração e uma **estimativa calórica**.

### Progresso gamificado

Streaks, conquistas, desafios e atividade compartilhada que recompensam constância — inspirados no Strava, aplicados ao hub treino–dieta–métricas.

## Critérios de sucesso

- A pessoa calcula basal e escolhe déficit/superávit **sem planilha externa**.
- Consegue montar dieta a partir do que tem **e/ou** dos macros, alinhada à meta calórica.
- Monta treinos em modalidades diferentes e vê **calorias estimadas** por exercício/sessão.
- Acompanha evolução por **gráficos** e por **timeline de fotos**.
- Mantém o hábito com **gamificação** (streaks, desafios, conquistas) de forma mensurável.
- Usa o app como **fonte única** do dia a dia de treino e dieta.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Basal / TMB** | Taxa metabólica basal — estimativa de gasto em repouso |
| **Déficit** | Consumir menos kcal que o gasto, visando perda de peso |
| **Superávit** | Consumir mais kcal que o gasto, visando ganho (ex.: massa) |
| **Macros** | Macronutrientes: proteína, carboidrato e gordura |
| **Estoque** | Alimentos que a pessoa tem disponíveis para montar a dieta |
| **Sessão** | Treino executado ou planejado em um dia |
| **Timeline** | Linha do tempo de fotos (e opcionalmente métricas) para comparar evolução |
| **Streak** | Sequência de dias com atividade registrada (treino, dieta ou métrica) |
| **Desafio** | Meta gamificada (ex.: 4 treinos na semana) no espírito Strava |

## Regras de negócio (v1)

- Perfil com dados mínimos é obrigatório antes de calcular basal e definir estratégia calórica.
- Déficit/superávit altera a meta diária; treino e dieta devem poder ser reavaliados quando a estratégia muda.
- Dieta por estoque só usa alimentos marcados como disponíveis (salvo override explícito do usuário).
- Dieta por macros valida (ou alerta) desvio relevante dos alvos diários.
- Todo exercício em um treino deve poder exibir estimativa calórica; a sessão agrega o total.
- Métricas e fotos são datadas; dashboards e timeline respeitam a ordem cronológica.
- Gamificação recompensa ações reais (treino feito, métrica registrada, meta do dia), não só abertura do app.
- O app **não** substitui orientação médica ou nutricional profissional; valores são estimativas de apoio.

## Próximos passos

→ [`docs/README.md`](docs/README.md) → inventário de funcionalidades (a produzir)
