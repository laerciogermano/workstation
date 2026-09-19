# Clozzy — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Timeline de prompts: [`prompts/`](prompts/).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Clozzy** é o site onde **influencers** vendem **conteúdo exclusivo** direto para fãs — e onde o fã **compra, acessa e acompanha** esse conteúdo num só lugar. Em vez de depender só de feed gratuito, DM ou plataformas genéricas, a relação vira **catálogo pago + acesso claro**: o criador monetiza o exclusivo; o fã sabe o que compra e onde consome.

## Problema

Criadores e fãs já trocam atenção e desejo de conteúdo “por trás das cortinas”, mas a venda e o acesso ficam fragmentados.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Monetização frágil do exclusivo** | O melhor conteúdo do influencer fica no gratis, em tip avulso ou em canal difícil de organizar — sem vitrine clara de venda. |
| **Acesso confuso para o fã** | Quem paga não sabe bem o que comprou, onde abre e até quando vale. |
| **Plataformas genéricas** | Marketplaces e redes sociais não foram feitos para o fluxo *perfil → exclusivo → compra → biblioteca*. |
| **Confiança e entrega** | Sem produto bem definido (o que é exclusivo, o que está incluso, o que é recorrente), a compra vira risco para os dois lados. |

O influencer **já produz** conteúdo que o público quer além do feed. O fã **já quer** pagar por isso. O que falta é um **site de venda e consumo** pensado para esse exclusivo.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Influencer / criador** | Quem tem audiência e conteúdo exclusivo para monetizar | Publicar, precificar e vender o exclusivo com vitrine e entrega simples |
| **Fã / comprador** | Quem segue o criador e quer o conteúdo pago | Descobrir, comprar e acessar o exclusivo sem fricção |
| **Operação / dono da plataforma** | Quem opera o Clozzy | Cadastro de criadores, catálogo, pagamento e acesso sob controle |

## Objetivo

Ser o **lugar padrão** para **vender e consumir conteúdo exclusivo de influencers**: catálogo claro, compra simples e acesso garantido ao que foi pago.

## Proposta de valor

O Clozzy trata o exclusivo como **produto de vitrine**, não como favor na DM. O criador monta o que vende; o fã compra e entra na biblioteca.

| Necessidade | O que o Clozzy faz |
|-------------|--------------------|
| Vitrine do exclusivo | Perfil do influencer com ofertas e preview permitido |
| Venda direta | Compra (avulsa e/ou assinatura, conforme escopo) com confirmação clara |
| Acesso pós-compra | Biblioteca / área logada com o conteúdo liberado |
| Clareza do produto | Título, descrição, tipo de mídia, o que está incluso |
| Confiança | Status do pedido, acesso válido e regras do exclusivo visíveis |

### Exemplos

**Criador publica um pack** — Marina sobe um pack de fotos/vídeos exclusivos, define preço e preview. O pack aparece no perfil dela no Clozzy.

**Fã compra e acessa** — João segue Marina, vê o pack, paga e passa a ver o conteúdo na biblioteca dele.

**Assinatura do canal** (se no escopo) — o fã assina o canal exclusivo e recebe novos drops enquanto a assinatura estiver ativa.

## Princípios

1. **Exclusivo é produto** — tem nome, preço, escopo e entrega; não é tip sem definição.
2. **Vitrine → compra → acesso** — o fluxo canônico não se perde em chat ou link avulso.
3. **Criador no centro** — a unidade de descoberta é o perfil / canal do influencer.
4. **Acesso honestamente delimitado** — o fã sabe o que pode ver e por quanto tempo / sob qual regra.
5. **Plataforma de venda, não rede social completa** — foco em catálogo, pagamento e consumo do exclusivo.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Perfis de criador** | Página pública do influencer com bio e catálogo |
| **Ofertas de conteúdo** | Cadastro de itens exclusivos (pack, post, mídia) com preço e preview |
| **Compra** | Checkout e confirmação de pagamento |
| **Acesso** | Liberação do conteúdo comprado na área do fã |
| **Biblioteca** | Lista do que o fã já adquiriu |
| **Conta** | Login / cadastro de fã e de criador |
| **Gestão do criador** | Publicar, editar, precificar e ver o que está à venda |

### Fora de escopo (v1)

- Rede social completa (feed infinito, stories, DMs como produto principal)
- Live streaming como núcleo
- App nativo (pode vir depois; v1 é site)
- Marketplace genérico de qualquer tipo de produto físico
- Moderação avançada / compliance completo de todas as jurisdições no dia um (tratar como evolução)

## Modelo conceitual

### Criador

Influencer (ou conta de marca/pessoa) que publica e vende conteúdo exclusivo no Clozzy.

### Fã

Usuário que descobre, compra e consome o exclusivo.

### Oferta / produto exclusivo

Unidade vendável: pack, post, coleção ou acesso a canal — com metadados, preço e regra de acesso.

### Pedido / compra

Transação que liga fã → oferta → pagamento → direito de acesso.

### Biblioteca

Conjunto de conteúdos que o fã tem direito de ver após compra (ou assinatura ativa).

### Canal (opcional na v1)

Agrupamento recorrente de drops do mesmo criador sob assinatura ou catálogo contínuo.

## Critérios de sucesso

- O criador consegue **publicar e precificar** ao menos um exclusivo e vê-lo na própria vitrine.
- O fã consegue **encontrar, comprar e abrir** o conteúdo sem sair do fluxo do site.
- Fica claro **o que foi comprado** e **onde acessar** depois.
- A vitrine do criador comunica o exclusivo sem expor o conteúdo pago no preview.
- Contas de criador e fã cobrem o caminho mínimo de venda e consumo.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Exclusivo** | Conteúdo pago, fora do feed gratuito principal do criador |
| **Oferta** | Produto à venda (pack, post, assinatura…) |
| **Preview** | Trecho ou capa pública que não entrega o conteúdo pago |
| **Biblioteca** | Área do fã com o que ele tem direito de acessar |
| **Canal** | Agrupamento contínuo de conteúdo de um criador |
| **Drop** | Novo conteúdo publicado no canal ou catálogo |

## Próximos passos

→ [`docs/README.md`](docs/README.md) — índice da esteira; em seguida `functionalities.md` a partir desta visão
