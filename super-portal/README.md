# Super Portal — Documento de visão

**Também chamado** Super Traço Portal.  
**Por quê:** fixar o *quê* e o *porquê* do portal que substitui o portal ConnectMax antes de histórias, telas ou código.  
**Importante:** fonte de verdade do produto — sem ela, operação e derivados divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → PRD / discovery → implementação.

Derivados: [`docs/`](docs/README.md).  
Inputs (processos + prints do portal): [`inputs/`](inputs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Não confundir com** o portal PHP atual do franqueado ([`conectmax/connectmax/docs/portal-franqueado.md`](../conectmax/connectmax/docs/portal-franqueado.md)), o hub Connect/ConnectMax de automação LinkedIn ([`connectmax/`](../conectmax/connectmax/README.md)) ou Connect Tech (consultoria). O Super Portal é o **produto de portal white-label** que **substitui** o portal operacional da ConnectMax.

---

## Visão

O **Super Portal** (Super Traço Portal) é o portal **white-label** que substitui o portal da ConnectMax: operação desenhada para ser **o mais automatizada e otimizada possível**, deixando o humano **apenas na parte humana**. Tudo que puder ser automatizado será — com **templates** e **tudo configurável**.

## Contexto

O portal atual da ConnectMax concentra a operação do franqueado (pedidos, notas, financeiro, etc.) num painel onde muita coisa ainda depende de trabalho manual repetitivo. Queremos um portal **novo**, nosso, que:

1. **Substitua** o portal ConnectMax como superfície operacional.
2. Seja **white-label** — marca, identidade e aparência configuráveis por cliente/franquia, sem fork por marca.
3. Trate **automação como default**: fluxos, templates e regras configuráveis cobrem o que for automatizável; o operador intervém só onde julgamento humano é necessário.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Portal legado** | Portal franqueado PHP acoplado à marca/operação ConnectMax. |
| **Trabalho repetitivo** | Etapas que poderiam ser template/regra ainda passam por clique humano. |
| **Pouco white-label** | Difícil oferecer o mesmo portal sob outra marca sem reescrever. |
| **Configuração rígida** | Pouca superfície para templates e parâmetros por operação/cliente. |
| **Humano no meio do automático** | Pessoas fazem o que máquina + template resolveriam. |

Já existem mapa e APIs de apoio ao portal atual no lab. Falta o **produto de portal** pensado desde o início como **substituto white-label + automação máxima**.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Operador** | Quem roda o dia a dia no portal | Fluxos curtos; só entra quando a etapa é humana |
| **Gestor / franquia** | Quem define processo e marca | White-label, templates e regras configuráveis |
| **Operação lab / produto** | Quem mantém o portal nosso | Um produto configurável, não um clone por cliente |

## Objetivo

Ser o **portal padrão white-label** que **substitui o portal ConnectMax**: maximizar automação e otimização da operação; **humano só no que é humano**; **templates** e **configuração** para tudo que puder ser automatizado.

## Proposta de valor

Um único portal, marca plugável, operação puxada por automação e configuração — não por trabalho braçal no miolo do fluxo.

| Necessidade | O que o Super Portal faz |
|-------------|--------------------------|
| Substituir o portal ConnectMax | Nova superfície operacional no lugar do portal legado |
| White-label | Marca, tema e textos configuráveis por tenant/cliente |
| Automatizar o automatizável | Fluxos, filas e regras sem intervenção humana desnecessária |
| Templates | Modelos prontos e editáveis para comunicações e etapas |
| Configurável | Parâmetros, regras e templates por operação — sem hardcode |
| Humano só no humano | Handoff explícito nas etapas que exigem julgamento |

### Exemplos

**Troca de marca** — Cliente sobe logo/cores/nome; o portal aparece como o dele, sem fork de código.

**Fluxo automático** — Etapa que hoje é clique repetido vira regra + template; só para se faltar dado ou decisão humana.

**Template configurável** — Mensagem, documento ou passo padrão editável por gestor; operadores usam o template, não reinventam o texto.

**Handoff humano** — Fila “precisa de humano” com contexto; o resto segue sozinho.

## Princípios

1. **Substitui o portal ConnectMax** — é o produto destino, não um espelho eterno do PHP legado.
2. **White-label por design** — marca e aparência são configuração, não branch.
3. **Automação first** — default é automatizar; humano é exceção justificada.
4. **Humano só no humano** — etapas manuais são explícitas e mínimas.
5. **Templates + configurável** — o que varia entre clientes/operações vira template ou parâmetro.
6. **Otimizar a operação** — menos cliques, menos espera, menos retrabalho.

## Escopo da visão

### Capacidades (visão)

| Área | Em escopo |
|------|-----------|
| **Substituição** | Portal operacional no lugar do portal ConnectMax |
| **White-label** | Identidade (marca, tema, naming) por tenant |
| **Automação** | Fluxos e regras para o que for automatizável |
| **Templates** | Modelos configuráveis para etapas/comunicações |
| **Configuração** | Parâmetros e regras sem redeploy por variação comum |
| **Handoff humano** | Superfície clara para o que só o humano resolve |

### Fora de escopo (visão v1)

- Manter o PHP legado como produto de longo prazo
- Detalhar módulo a módulo do portal atual (fica para PRD / migração)
- App mobile nativo dedicado
- Redesenhar Connect Tech ou o agente LinkedIn ConnectMax

## Critérios de sucesso (visão)

- Dá para operar no Super Portal **sem** depender do portal franqueado legado como UI principal (meta de substituição).
- Um tenant consegue aparência **white-label** (marca própria) via configuração.
- Fluxos automatizáveis rodam com **templates/regras**; humano só nas etapas marcadas como humanas.
- Gestores alteram templates e configurações sem fork de código.

## Fora / adjacências

| Projeto / artefato | Papel |
|--------------------|--------|
| [`portal-franqueado`](../conectmax/connectmax/docs/portal-franqueado.md) / [`portal-mapa`](../conectmax/connectmax/docs/portal-mapa/README.md) | Legado a substituir / referência de domínio |
| [`portal-api`](../conectmax/portal-api/README.md) | Apoio/integração ao portal atual — não é o Super Portal |
| [`connectmax/`](../conectmax/connectmax/README.md) | Agente LinkedIn / vendas — adjacente, não o portal |
| [`connect-tech/`](../connect-tech/README.md) | Consultoria + software — oferta distinta |

## Próximos passos

1. Validar e refinar **este** documento de visão.
2. [`docs/`](docs/README.md) → PRD (white-label, automação, templates, handoff humano, migração do portal atual).
3. Discovery (épicos / stories) só depois da visão estável.
