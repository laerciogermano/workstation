# CRM — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do CRM multi-canal antes de histórias, telas ou código.  
**Importante:** fonte de verdade do produto — sem ela, operação e derivados divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → PRD / discovery → implementação.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Não confundir com** Connect / ConnectMax (só LinkedIn), Mauricio (Tinder pontual no board), [`OmTV`](../omtv/README.md) (market OmeTV) ou [`low-chat`](../low-chat/README.md) (só camada de reply). O CRM é a **pessoa única** + **canais conectados** + **automação de mensagem** + **perfil unificado**.

---

## Visão

O **CRM** é o hub de pessoas e canais: conecta **WhatsApp**, **Tinder**, **Instagram** e demais apps possíveis; dá a cada pessoa um **identificador único**; guarda **foto, nome e informações**; e permite **automatizar mensagens** sobre esses canais.

## Problema

Contatos vivem espalhados: um match no Tinder, um DM no Instagram, um fio no WhatsApp. Sem identidade única, não há histórico unificado nem automação segura entre apps.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Pessoa fragmentada** | Mesma pessoa = vários handles; sem ID comum. |
| **Dados incompletos** | Foto/nome/bio em um app; telefone em outro; nada consolidado. |
| **Mensagem manual por canal** | Operador troca de app e digita à mão. |
| **Automação isolada** | Scripts por app (Tinder, LinkedIn, OmeTV) sem CRM no centro. |
| **Sem vista 360°** | Não dá para ver “tudo que sei / mandei / recebi” de uma pessoa. |

Já existem automações por canal no lab. Falta o **produto de identidade + perfil + mensagem multi-canal**.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Operador** | Quem fala com pessoas em vários apps | Ver a pessoa, canais ligados, mandar mensagem (manual ou auto) |
| **Dono da operação** | Quem define cadência e limites | Políticas de automação, o que pode ser enviado por canal |
| **Operação lab** | Quem mantém CDP / sessões | Contas/sessões saudáveis plugadas no CRM |

## Objetivo

Ser o **CRM padrão** da workstation: **um ID por pessoa**, conexões com **WhatsApp / Tinder / Instagram / outros apps**, perfil com **foto, nome e atributos**, e **automação de mensagens** sobre esses canais.

## Proposta de valor

O CRM trata cada pessoa como **registro único** e cada app como **canal**: identidade estável, dados agregados, mensagem automatizável — sem misturar “conta do app” com “pessoa”.

| Necessidade | O que o CRM faz |
|-------------|-----------------|
| Identificar a pessoa | **ID único** + aliases por canal (handle, telefone, profile URL…) |
| Conectar apps | Ligar sessões/contas de **WhatsApp, Tinder, Instagram** e extensível a outros |
| Perfil rico | **Foto, nome**, bio, tags, notas e campos livres |
| Automatizar | Enviar / agendar / templates de mensagem por canal |
| Histórico | Thread e eventos por pessoa, independente do app de origem |

### Exemplos

**Match vira pessoa** — Novo match no Tinder cria (ou faz merge em) um contato com ID; foto e nome entram no perfil.

**Mesma pessoa no Instagram** — Operador liga o perfil do Instagram ao mesmo ID; o CRM passa a mostrar os dois canais.

**Mensagem no WhatsApp** — A partir do contato, dispara template ou fila automática no WhatsApp conectado.

**Vista 360°** — Abrir o ID mostra foto, nome, canais, atributos e histórico de mensagens.

## Princípios

1. **Pessoa ≠ conta de app** — o ID é da pessoa; canais são vínculos.
2. **Multi-canal por design** — WhatsApp, Tinder, Instagram são os primeiros; o modelo admite outros apps.
3. **Perfil primeiro** — foto, nome e informações são cidadãos de primeira classe, não detalhe do chat.
4. **Automação com política** — mensagem automática respeita canal, limites e handoff humano.
5. **Reusar stack do lab** — CDP / `human-cdp`, low-chat (persona/reply), automações existentes como adaptadores — não reinventar cada app no núcleo.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Identidade** | ID único; merge/aliases por canal |
| **Canais** | Conectar WhatsApp, Tinder, Instagram (modelo extensível) |
| **Perfil** | Foto, nome, atributos e notas |
| **Mensagem** | Enviar e automatizar mensagens por canal ligado |
| **Histórico** | Eventos e threads associados ao ID |
| **Operação** | Ligar/desligar canal; status da sessão/conta |

### Fora de escopo (v1)

- ERP / billing / funil B2B completo (pode vir depois)
- Substituir ConnectMax (LinkedIn continua lá; o CRM pode *vincular* depois)
- App mobile nativo do CRM
- Marketplace de conectores de terceiros
- Criação em massa de contas (fica nos projetos de conta por app)

## Modelo conceitual

### Pessoa (Contact)

Registro com **ID estável**. Núcleo do produto.

### Canal / vínculo

Ligação pessoa ↔ app (ex.: `tinder:profileId`, `whatsapp:phone`, `instagram:handle`) + sessão/conta usada para operar.

### Perfil

Foto(s), nome exibido, campos estruturados e livres derivados dos canais ou editados à mão.

### Mensagem / automação

Ação de envio (manual, template, fila) roteada pelo canal ativo da pessoa.

### Adaptador de app

Conector técnico (CDP, API, etc.) que lê perfil e envia mensagem num app específico.

## Critérios de sucesso (visão)

- Toda pessoa no CRM tem um **ID** e pode ter **vários canais**.
- Dá para ligar pelo menos **WhatsApp, Tinder e Instagram** ao modelo (mesmo que a profundidade de cada adaptador evolua).
- Perfil mostra **foto, nome e informações** agregadas.
- É possível **automatizar envio de mensagem** para um contato num canal conectado.
- Operador abre um ID e vê a vista unificada (canais + perfil + histórico básico).

## Fora / adjacências

| Projeto | Papel |
|---------|--------|
| [`low-chat`](../low-chat/README.md) | Persona + LLM barato (candidato a motor de reply) |
| [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) | Interação web com foco + trajetória |
| Mauricio / Tinder lab | Adaptador Tinder candidato |
| Connect / ConnectMax | LinkedIn — outro canal (integração futura) |
| [`OmTV`](../omtv/README.md) / [`ov`](../ov/README.md) | OmeTV market/contas — não são o CRM |

## Próximos passos

1. Validar e refinar **este** documento de visão.
2. [`docs/`](docs/README.md) → PRD / funcionalidades (modelo de ID, canais, perfil, mensagem).
3. Discovery (épicos / stories) só depois da visão estável.
