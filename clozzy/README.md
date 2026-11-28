# Clozzy — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Timeline de prompts: [`prompts/`](prompts/).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Clozzy** é uma **rede social B2C** — no espírito de um Instagram — onde **criadores de conteúdo** e **pessoas comuns** se encontram no mesmo lugar. Cada pessoa tem uma **conta**. O foco não é a bolha de amigos e seguidores conhecidos: é **conhecer desconhecidos** — descobrir perfis novos, conversar e se aproximar.

A superfície é rede social de pessoas (perfil, presença, descoberta). Por dentro, a mesma plataforma permite **vender conteúdo de forma discreta**: a monetização e o exclusivo vivem no privado (close, oferta, liberação), sem transformar a vitrine pública numa prateleira de packs. Conhecer desconhecidos é o **pretexto**; a venda de conteúdo é o **motor** que acontece no círculo próximo.

Há conteúdo **bloqueado** (só quem entra no close ou compra vê). A unidade não é “mais um pack na prateleira”; é a **proximidade** entre pessoas — criador ↔ comum, e entre quem cria e quem paga: conversa, oferta, liberação e consumo no mesmo círculo.

## Problema

Redes sociais misturam criadores e comuns, mas empurram para a **bolha do já conhecido** (amigos, seguidores, algoritmo de quem você já curte). Quem quer **conhecer desconhecidos** cai em dating ou em marketplace de packs — um sem capa de rede social, o outro sem gente “comum” no mesmo fio.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Rede só para quem você já conhece** | Instagram e similares reforçam o círculo atual; descobrir gente nova de verdade não é o centro. |
| **Criador e comum em mundos separados** | Criador vive em plataforma de pack; pessoa comum vive em feed de amigos — não há um lugar único para os dois se conhecerem. |
| **Entrar só para comprar** | Plataformas de conteúdo anunciam o pago de cara — espantam quem só quer conhecer pessoas e estigmatizam quem vende. |
| **Encontro sem profundidade paga** | Apps de conhecer gente param na conversa; não há caminho discreto para exclusivo e venda no privado. |
| **Atenção diluída** | Packs e canais abertos tratam o outro como comprador de lote — não como alguém no círculo próximo. |
| **Venda fora do relacionamento** | O processo de vendas fica espalhado (DM, link, tip, plataforma genérica), sem um lugar privado onde a relação conduz do interesse à compra. |
| **Exclusivo sem “close”** | Conteúdo trancado existe, mas sem a sensação de rede social íntima: perfil, presença, bloqueio e liberação no mesmo fio. |
| **Acesso confuso** | Quem paga não sabe bem o que liberou, onde abre e até quando vale. |

Criadores e pessoas comuns já querem **se cruzar**. Ambos querem **conhecer desconhecidos**. Quem monetiza já quer **vender no privado**. Falta a rede social pensada para esse encontro — com o close + conteúdo por dentro.

## Para quem

Personas separadas por aplicação (mesmo produto, dois usos).

### Rede social (similar Instagram/TikTok)

Pessoas comuns que querem se conhecer.

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Viewers** | Quem assiste e visualiza, mas não paga | Ver o público, conhecer gente e acompanhar perfis — sem close nem pack |
| **Influencer** | Quem quer atenção e maior base, ainda **sem** vender conteúdo | Ser encontrado, crescer presença na rede |

### Vendas de conteúdos exclusivos

Criadores / influencers que monetizam; quem compra o exclusivo.

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Cliente** (comprador) | Quem paga close, pack ou avulso | Conteúdo liberado, saber o que comprou e acompanhar no privado |
| **Influencer** (vendedor) | Criador que já vende | Abrir close, bloquear exclusivo, oferecer, receber e liberar — no privado |

## Objetivo

Ser a **rede social padrão onde criadores e pessoas comuns se conhecem** — estilo Instagram, focada em **desconhecidos** — com conta para cada pessoa; o pretexto é o encontro social e, por dentro, a venda de conteúdo acontece de forma **discreta** no close privado, com acesso claro ao que foi liberado.

## Estratégia

**Encontro social como pretexto; venda de exclusivo como motor.** A superfície não grita marketplace — a monetização mora no close e no privado.

| Lado do produto | Papel |
|-----------------|--------|
| **Rede social de conhecer pessoas** | Capa: desconhecidos, perfil, aproximação — criador e comum no mesmo lugar |
| **Venda de conteúdo exclusivo** | Motor: close, bloqueio, oferta e liberação no privado |

## Proposta de valor

O Clozzy não é “mais um marketplace de packs” nem só “mais um app de match”. É uma **rede social** (como um Instagram) para **criadores e pessoas comuns** se conhecerem — com foco em **gente que você ainda não conhece**. A venda de conteúdo fica **dentro** da relação, discreta — prévia pública só o suficiente; o pago no privado.

| Necessidade | O que o Clozzy faz |
|-------------|--------------------|
| Rede social (capa) | Perfis, presença e descoberta no espírito Instagram — motivo de entrada |
| Criadores + pessoas comuns | Mesmo espaço social; os dois tipos de conta se cruzam |
| Foco em desconhecidos | Descoberta e aproximação de gente nova — não bolha de amigos/seguidores já conhecidos |
| Conta por pessoa | Cada usuário tem conta própria (entrar, perfil, close, comprar e/ou vender) |
| Venda discreta de conteúdo | Monetização no privado; a superfície não se apresenta como loja de packs |
| Proximidade exclusiva | Close privado: atenção entre pessoas, não prateleira pública |
| Venda no privado | Processo de vendas (interesse → oferta → pagamento → liberação) no mesmo espaço da relação |
| Conteúdo bloqueado | Prévia pública; o resto trancado até assinar o close ou comprar |
| Clareza do produto | O que está no close, o que é avulso/pack, o que libera e por quanto tempo |
| Acesso pós-liberação | Biblioteca / área da conta com o que a pessoa tem direito de ver |
| Confiança | Status do pedido, acesso válido e regras do exclusivo visíveis |

### Exemplos

**Rede para se cruzar** — criador e pessoa comum estão na mesma rede; alguém cria conta, explora perfis de desconhecidos e conversa — como num Instagram voltado a gente nova, não à bolha atual.

**Close da Marina** — a pessoa entra no close dela: vê o que estava bloqueado, recebe a atenção privada e acompanha drops exclusivos enquanto a relação estiver ativa.

**Venda discreta no privado** — no close, Marina conduz a conversa, oferece um conteúdo ou um pack, recebe o Pix e libera — sem transformar o perfil público numa prateleira.

**Conteúdo bloqueado na vitrine** — no perfil, parte da mídia aparece borrada/trancada; só quem está no close ou comprou abre.

**Pack como complemento** — o pack continua existindo, mas como oferta **dentro** da lógica de proximidade — não como o centro nem como a capa do produto.

## Princípios

1. **Rede social primeiro** — a superfície é rede (estilo Instagram): criadores e pessoas comuns no mesmo lugar.
2. **Foco em desconhecidos** — o centro é conhecer gente nova, não reforçar a bolha de quem você já segue.
3. **Criador e comum no mesmo fio** — uma só rede social; monetização não separa os mundos na entrada.
4. **Encontro como pretexto** — o cartaz de entrada é conhecer pessoas; a venda de conteúdo não é o anúncio da home.
5. **Conta por pessoa** — B2C com conta individual; quem conhece, quem compra e quem vende são o mesmo tipo de conta, com papéis que se ativam no uso.
6. **Venda discreta** — conteúdo e checkout vivem no privado / close; a descoberta pública não grita marketplace.
7. **Close primeiro (monetização)** — a unidade de monetização é a proximidade exclusiva; pack é oferta, não a alma do produto.
8. **Atenção exclusiva, não compartilhada** — quem está no close sente o círculo privado, não a prateleira pública.
9. **Venda no privado** — o processo de vendas vive na relação (close / conversa / liberação), não só num checkout solto.
10. **Bloqueado até liberar** — conteúdo pago fica trancado; preview não entrega o exclusivo.
11. **Acesso honestamente delimitado** — a pessoa sabe o que pode ver e sob qual regra.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Conta** | Cadastro / login B2C — cada pessoa com conta própria (criador ou comum) |
| **Rede social** | Perfis e presença no espírito Instagram — criadores e pessoas comuns no mesmo lugar |
| **Conhecer desconhecidos** | Descoberta e aproximação de gente nova (não bolha de amigos já conhecidos) |
| **Perfis** | Página pública com bio, prévias e o que está bloqueado — sem cara de loja |
| **Close** | Assinatura / entrada no círculo privado |
| **Conteúdo bloqueado** | Liberação por close, pack ou item; preview sem entregar o pago |
| **Ofertas** | Close, pack e avulso com preço e o que inclui |
| **Venda discreta no privado** | Fluxo de oferta → pagamento → liberação ligado à relação — não à vitrine de massa |
| **Compra** | Checkout e confirmação de pagamento |
| **Acesso** | Área da conta com o conteúdo liberado |
| **Biblioteca** | Lista do que a pessoa já adquiriu / tem no close |
| **Gestão do criador** | Publicar, bloquear por regra, precificar, ver círculos e vendas |

### Fora de escopo (v1)

- Rede centrada em amigos/seguidores já conhecidos (o foco é desconhecido)
- Feed de conteúdo massificado como produto principal (a capa é pessoa ↔ pessoa, não timeline infinita tipo TikTok)
- Live streaming como núcleo
- App nativo (pode vir depois; v1 é site)
- Marketplace genérico de produto físico
- Vitrine pública centrada em catálogo de packs (a capa é rede social / conhecer gente)
- Moderação avançada / compliance completo de todas as jurisdições no dia um (tratar como evolução)

## Modelo conceitual

### Conta / pessoa

Usuário B2C com perfil na rede. Pode ser criador, pessoa comum, ou ambos no uso: conhecer desconhecidos, entrar em closes, comprar e — se quiser — vender conteúdo no privado.

### Criador de conteúdo

Conta que publica, pode abrir close e vender conteúdo de forma discreta — no mesmo espaço social das pessoas comuns.

### Pessoa comum

Conta que entra pela rede social para conhecer desconhecidos; pode aproximar, comprar e consumir o liberado, sem obrigação de vender.

### Close

Círculo privado e pago: atenção exclusiva + acesso ao que se libera para quem está dentro.

### Conteúdo bloqueado

Mídia ou oferta visível como trancada até close, pack ou compra avulsa — apresentada com discreção na superfície.

### Oferta

Unidade vendável: close (recorrente), pack ou item — com metadados, preço e regra de acesso.

### Pedido / compra

Transação que liga conta → oferta → pagamento → direito de acesso.

### Biblioteca

Conjunto de conteúdos que a conta tem direito de ver após compra ou close ativo.

## Critérios de sucesso

- Criador e pessoa comum conseguem **criar conta** e **se cruzar** na mesma rede social.
- Uma pessoa consegue **conhecer desconhecidos** como motivo principal de uso (não a bolha de já conhecidos).
- O criador consegue **abrir um close**, publicar conteúdo **bloqueado** e conduzir uma venda até a liberação — **sem** a superfície parecer loja de packs.
- Quem busca consegue **aproximar**, **entrar no close**, **comprar** o que estiver trancado e **abrir** o conteúdo sem sair do fluxo.
- Fica claro o que é **capa (rede social / desconhecidos)** versus **motor discreto (venda de conteúdo)**.
- Fica claro o que é **atenção exclusiva** (close) versus oferta pontual (pack/item).
- A vitrine comunica exclusividade **sem** expor o conteúdo pago no preview.
- Contas cobrem o caminho mínimo de rede, encontro, proximidade, venda e consumo.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Rede social** | Capa do produto: perfis e presença (espírito Instagram) onde criadores e pessoas comuns se cruzam |
| **Desconhecido** | Pessoa que você ainda não conhece; o foco da descoberta no Clozzy |
| **Criador** | Conta que publica e pode monetizar no privado |
| **Pessoa comum** | Conta que usa a rede para conhecer gente; pode comprar sem obrigação de vender |
| **B2C** | Produto para a pessoa final: cada usuário tem conta |
| **Pretexto** | Motivo de entrada na superfície: rede social para conhecer desconhecidos |
| **Venda discreta** | Monetização de conteúdo no privado/close, sem cartaz de marketplace na descoberta pública |
| **Close** | Círculo privado e pago; atenção exclusiva + conteúdo liberado para quem está dentro |
| **Exclusivo** | Conteúdo pago / bloqueado, fora do que é público na rede |
| **Bloqueado** | Visível como trancado até close ou compra |
| **Oferta** | Produto à venda (close, pack, item) |
| **Preview** | Trecho ou capa pública que não entrega o conteúdo pago |
| **Biblioteca** | Área da conta com o que a pessoa tem direito de acessar |
| **Pack** | Bundle pontual de mídias; complemento do close, não o centro nem a capa |
| **Drop** | Novo conteúdo publicado no close ou no catálogo |

## Próximos passos

→ [`docs/README.md`](docs/README.md) — índice da esteira; em seguida alinhar `functionalities.md` a esta visão (rede social criador+comum · desconhecidos · close · venda discreta)
