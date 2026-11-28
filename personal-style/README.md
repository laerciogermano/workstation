# Personal Style — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Não confundir com** [`fitness/`](../fitness/README.md) (treino, dieta e métricas metabólicas). O Personal Style trata **imagem, arquétipo e estilo pessoal** — o que você é, o que deseja ser e o gap até a melhor versão alinhada às suas metas.

---

## Visão

O **Personal Style** é o app em que a pessoa **descreve quem é** (características, desejos, metas), **recebe arquétipos** que materializam essa direção e, a partir do que já tem e do que falta, **vê o que melhorar**, **tira fotos** (corpo, rosto, dentes, olhos, cabelo), **dá nota 0–10** em cada aspecto e **acompanha as ações** até chegar à melhor versão dada as metas.

## Problema

Quem quer evoluir a própria imagem e presença costuma ficar sem mapa:

| Dor | O que acontece hoje |
|-----|---------------------|
| **Desejo sem arquétipo** | “Quero parecer mais confiante / atraente / profissional” fica vago — sem persona-alvo clara. |
| **Gap invisível** | A pessoa não nomeia o que já tem de bom nem o que falta para o arquétipo desejado. |
| **Fotos soltas** | Selfies e álbuns não viram diagnóstico por região (sorriso, cabelo, postura, dentes…). |
| **Nota sem plano** | Sabe que “o sorriso poderia melhorar”, mas não vira ação acompanhável. |
| **Progresso sem evidência** | Sem reavaliação e comparação, a evolução some e a motivação cai. |

A pessoa **já tem características, desejos e metas**. Falta um sistema que **defina arquétipos**, **contraste presente × alvo** e **traduza o gap em notas + ações**.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Explorador de estilo** | Quem quer entender a própria imagem e direção | Descrever características/desejos/metas e ver arquétipos possíveis |
| **Em evolução** | Quem já escolheu um arquétipo e quer fechar o gap | Fotos, notas 0–10, lista do que falta e ações no dia a dia |
| **Mantenedor** | Quem já chegou perto do alvo e quer sustentar | Reavaliar, acompanhar progresso e ajustar o plano |

## Objetivo

Ser o **mapa pessoal da melhor versão**: arquétipos derivados dos teus objetivos + diagnóstico (o que tens / o que falta) + fotos + notas + ações acompanháveis.

## Proposta de valor

O Personal Style trata a evolução de estilo como um **sistema**: perfil → arquétipos → características-alvo → evidência fotográfica → notas → ações → progresso.

| Necessidade | O que o Personal Style faz |
|-------------|----------------------------|
| Nomear quem sou e o que quero | Registrar **características**, **desejos** e **metas** |
| Ter um alvo claro de presença | **Definir arquétipos** alinhados aos objetivos |
| Saber o padrão do arquétipo | Descrever as **características que o arquétipo deve ter** |
| Ver o gap com honestidade | Contrastar **o que já tens** × **o que falta** para a melhor versão |
| Evidência visual | Tirar / guardar **fotos** de corpo, rosto, dentes, olhos, cabelo |
| Priorizar o que melhorar | Dar **nota 0–10** por aspecto (sorriso, cabelo, postura, etc.) |
| Saber o que fazer | Listar e acompanhar as **ações** a executar |
| Não perder o fio | **Acompanhar progresso** (notas, fotos, ações concluídas) |

### Exemplos

**Perfil → arquétipo** — Ana descreve características (cabelo ondulado, porte médio), desejos (presença mais marcante) e metas (entrevistas + vida social). O app sugere arquétipos (ex.: *Executiva afiada*, *Criativa urbana*) e ela escolhe um como alvo.

**Gap do arquétipo** — No arquétipo escolhido, o app lista características-alvo (sorriso alinhado, cabelo definido, postura aberta…). Ana marca o que já tem; o restante vira gap — o que falta para a melhor versão dada as metas.

**Fotos + notas** — Ela fotografa rosto, sorriso, cabelo e corpo. Dá nota 6 no sorriso, 8 no cabelo, 4 na postura. O app destaca prioridade e liga cada nota baixa a ações.

**Ações e acompanhamento** — Ações (ortodontista / branqueamento, corte, treino de postura) entram no plano. Semanas depois, novas fotos e novas notas mostram a evolução.

## Princípios

1. **Arquétipo a partir de metas** — o alvo não é moda genérica; deriva dos objetivos da pessoa.
2. **Presente × alvo** — toda recomendação parte do que já existe e do que falta.
3. **Evidência visual** — foto por região sustenta nota e progresso; opinião solta não basta.
4. **Nota com ação** — 0–10 sem próximo passo não fecha o ciclo.
5. **Melhor versão, não cópia** — o arquétipo orienta; não apaga a identidade base.
6. **Acompanhamento contínuo** — reavaliar notas/fotos/ações é parte do produto, não um extra.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Perfil** | Características, desejos e metas |
| **Arquétipos** | Gerar / sugerir / escolher arquétipos alinhados aos objetivos |
| **Características do arquétipo** | Descrever o padrão-alvo; marcar o que a pessoa já tem e o que falta |
| **Fotos** | Captura/upload de corpo, rosto, dentes, olhos, cabelos (e outras regiões relevantes) |
| **Notas 0–10** | Avaliar aspectos melhoráveis (sorriso, cabelo, pele, postura, etc.) |
| **Ações** | Lista de ações a executar ligadas ao gap / às notas baixas |
| **Acompanhamento** | Histórico de notas, fotos e status das ações; visão de progresso |

### Fora de escopo (v1)

- Prescrição médica, odontológica ou dermatológica automatizada
- Cirurgia / procedimentos invasivos como recomendação clínica (no máximo *sinalizar* área + “buscar profissional”)
- Marketplace de profissionais (agendamento/pagamento)
- Rede social / feed público de evolução
- Treino e dieta detalhados (fica no [`fitness/`](../fitness/README.md); aqui só o que impacta imagem/arquétipo)
- Consultoria de moda completa (guarda-roupa / looks) além do necessário para o arquétipo

## Modelo conceitual

### Perfil

Quem a pessoa é hoje (características) + o que deseja + metas concretas.

### Arquétipo

Persona-alvo de presença/estilo derivada das metas; carrega um conjunto de **características-alvo**.

### Gap

Diferença entre características atuais e as do arquétipo escolhido — o mapa do que falta.

### Evidência

Foto (e opcionalmente nota) associada a uma região ou aspecto.

### Aspecto

Dimensão avaliável (ex.: sorriso, cabelo, olhos, dentes, corpo/postura) com nota 0–10.

### Ação

Passo concreto ligado a um gap ou aspecto (ex.: “agendar avaliação odontológica”, “definir corte”).

### Progresso

Evolução no tempo: notas, fotos novas, ações concluídas vs pendentes.

## Critérios de sucesso (visão)

- A pessoa registra características, desejos e metas e **recebe arquétipos** coerentes.
- No arquétipo escolhido, vê **o que já tem** e **o que falta** para a melhor versão.
- Consegue **fotografar** regiões relevantes e **notar** aspectos em 0–10.
- Cada prioridade vira **ação** acompanhável; o progresso fica visível ao longo do tempo.

## Fora / adjacências

| Projeto | Papel |
|---------|--------|
| [`fitness/`](../fitness/README.md) | Treino, dieta, TMB, métricas corporais — complementar, não substituto |
| [`clozzy/`](../clozzy/README.md) | Rede / conteúdo — outro produto |
| Plans (esta árvore) | Orquestração do trabalho de construção do produto |

## Próximos passos

1. Validar e refinar **este** documento de visão.
2. [`docs/`](docs/README.md) → funcionalidades / PRD.
3. Discovery (épicos / stories) só depois da visão estável.
