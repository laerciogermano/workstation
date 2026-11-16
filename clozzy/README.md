# Clozzy — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Timeline de prompts: [`prompts/`](prompts/).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Clozzy** é a **rede social do close**: o lugar onde a influencer conduz, no **privado**, o relacionamento e o **processo de vendas** com o cliente — com atenção **exclusiva**, não diluída num feed compartilhado nem num catálogo genérico de packs.

Há conteúdo **bloqueado** (só quem entra no close ou compra vê). A unidade não é “mais um pack na prateleira”; é a **proximidade** entre criadora e fã: conversa, oferta, liberação e consumo no mesmo círculo.

## Problema

Influencers já monetizam desejo e exclusividade, mas o caminho atual empurra para **vitrine compartilhada** (packs, marketplaces, DMs soltas) em vez de um espaço onde a atenção ao cliente é **dela**, contínua e privada.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Atenção diluída** | Packs e canais abertos tratam o fã como comprador de lote — não como alguém no círculo próximo. |
| **Venda fora do relacionamento** | O processo de vendas fica espalhado (DM, link, tip, plataforma genérica), sem um lugar privado onde a criadora conduz do interesse à compra. |
| **Exclusivo sem “close”** | Conteúdo trancado existe, mas sem a sensação de rede social íntima: perfil, presença, bloqueio e liberação no mesmo fio. |
| **Acesso confuso** | Quem paga não sabe bem o que liberou, onde abre e até quando vale. |

O fã já quer **mais perto**. A criadora já quer **vender no privado**. Falta a rede pensada para esse close — não só para empilhar packs.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Influencer / criadora** | Quem tem audiência e quer monetizar com atenção exclusiva | Conduzir no privado o relacionamento, o conteúdo bloqueado e a venda |
| **Fã / cliente** | Quem segue e quer proximidade paga | Entrar no close, comprar o que estiver bloqueado e sentir atenção exclusiva |
| **Operação / dono da plataforma** | Quem opera o Clozzy | Cadastro, close, pagamento, bloqueio/liberação e acesso sob controle |

## Objetivo

Ser a **rede social padrão do close pago**: proximidade privada entre criadora e cliente, com conteúdo bloqueado, processo de vendas no mesmo espaço e acesso claro ao que foi liberado.

## Proposta de valor

O Clozzy não é “mais um marketplace de packs”. É o **círculo próximo** da criadora: ela atende o cliente com exclusividade; o conteúdo sensível fica bloqueado até a compra ou a entrada no close; a venda acontece **dentro** dessa relação — não à margem dela.

| Necessidade | O que o Clozzy faz |
|-------------|--------------------|
| Proximidade exclusiva | Close privado: atenção da criadora para o cliente, não feed massificado |
| Venda no privado | Processo de vendas (interesse → oferta → pagamento → liberação) no mesmo espaço da relação |
| Conteúdo bloqueado | Prévia pública; o resto trancado até assinar o close ou comprar |
| Clareza do produto | O que está no close, o que é avulso/pack, o que libera e por quanto tempo |
| Acesso pós-liberação | Biblioteca / área do fã com o que ele tem direito de ver |
| Confiança | Status do pedido, acesso válido e regras do exclusivo visíveis |

### Exemplos

**Close da Marina** — o fã entra no close dela: vê o que estava bloqueado, recebe a atenção privada e acompanha drops exclusivos enquanto a relação estiver ativa.

**Venda no privado** — no close, Marina conduz a conversa, oferece um conteúdo ou um pack, recebe o Pix e libera — sem mandar o cliente para outra plataforma.

**Conteúdo bloqueado na vitrine** — no perfil, parte da mídia aparece borrada/trancada; só quem está no close ou comprou abre.

**Pack como complemento** — o pack continua existindo, mas como oferta **dentro** da lógica de proximidade — não como o centro do produto.

## Princípios

1. **Close primeiro** — a unidade é a proximidade exclusiva entre criadora e cliente; pack é oferta, não a alma do produto.
2. **Atenção exclusiva, não compartilhada** — o cliente no close sente o círculo privado, não a prateleira pública.
3. **Venda no privado** — o processo de vendas vive na relação (close / conversa / liberação), não só num checkout solto.
4. **Bloqueado até liberar** — conteúdo pago fica trancado; preview não entrega o exclusivo.
5. **Rede social de proximidade** — perfil, presença, bloqueio e acesso no mesmo fio; não marketplace genérico nem feed infinito de massa.
6. **Acesso honestamente delimitado** — o fã sabe o que pode ver e sob qual regra.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Perfis de criadora** | Página pública com bio, prévias e o que está bloqueado |
| **Close** | Assinatura / entrada no círculo privado da criadora |
| **Conteúdo bloqueado** | Liberação por close, pack ou item; preview sem entregar o pago |
| **Ofertas** | Close, pack e avulso com preço e o que inclui |
| **Venda no privado** | Fluxo de oferta → pagamento → liberação ligado à relação com a criadora |
| **Compra** | Checkout e confirmação de pagamento |
| **Acesso** | Área do fã com o conteúdo liberado |
| **Biblioteca** | Lista do que o fã já adquiriu / tem no close |
| **Conta** | Login / cadastro de fã e de criadora |
| **Gestão da criadora** | Publicar, bloquear por regra, precificar, ver fãs e vendas |

### Fora de escopo (v1)

- Feed infinito massificado (rede “aberta” como produto principal)
- Live streaming como núcleo
- App nativo (pode vir depois; v1 é site)
- Marketplace genérico de produto físico
- Moderação avançada / compliance completo de todas as jurisdições no dia um (tratar como evolução)

## Modelo conceitual

### Criadora

Influencer que conduz o close, publica conteúdo bloqueado e vende no privado.

### Fã / cliente

Quem entra no close, compra o que estiver bloqueado e consome o liberado.

### Close

Círculo privado e pago da criadora: atenção exclusiva + acesso ao que ela libera para quem está dentro.

### Conteúdo bloqueado

Mídia ou oferta visível como trancada até close, pack ou compra avulsa.

### Oferta

Unidade vendável: close (recorrente), pack ou item — com metadados, preço e regra de acesso.

### Pedido / compra

Transação que liga fã → oferta → pagamento → direito de acesso.

### Biblioteca

Conjunto de conteúdos que o fã tem direito de ver após compra ou close ativo.

## Critérios de sucesso

- A criadora consegue **abrir um close**, publicar conteúdo **bloqueado** e conduzir uma venda até a liberação.
- O fã consegue **entrar no close**, **comprar** o que estiver trancado e **abrir** o conteúdo sem sair do fluxo.
- Fica claro o que é **atenção exclusiva** (close) versus oferta pontual (pack/item).
- A vitrine comunica exclusividade **sem** expor o conteúdo pago no preview.
- Contas de criadora e fã cobrem o caminho mínimo de proximidade, venda e consumo.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Close** | Círculo privado e pago da criadora; atenção exclusiva + conteúdo liberado para quem está dentro |
| **Exclusivo** | Conteúdo pago / bloqueado, fora do feed gratuito principal |
| **Bloqueado** | Visível como trancado até close ou compra |
| **Oferta** | Produto à venda (close, pack, item) |
| **Preview** | Trecho ou capa pública que não entrega o conteúdo pago |
| **Biblioteca** | Área do fã com o que ele tem direito de acessar |
| **Pack** | Bundle pontual de mídias; complemento do close, não o centro |
| **Drop** | Novo conteúdo publicado no close ou no catálogo |

## Próximos passos

→ [`docs/README.md`](docs/README.md) — índice da esteira; em seguida alinhar `functionalities.md` a esta visão (close + venda no privado)
