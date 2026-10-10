# Hurble — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/README.md).  
Pesquisa das referências (Omegle, Chatroulette, OmeTV): [`docs/pesquisa-referencias.md`](docs/pesquisa-referencias.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Hurble** é a rede social para **conhecer pessoas diferentes** — no espírito do Omegle, Chatroulette e OmeTV — e **continuar a relação** depois do “próximo”. Em um lado: match aleatório (vídeo ou texto), interesses, país e o botão de pular. No outro: perfil com fotos, amigos, mensagens, posts e stories. O acaso abre a porta; a rede social impede que a conversa morra no Next.

## Problema

Conhecer gente nova online hoje cai em dois extremos ruins:

| Dor | O que acontece hoje |
|-----|---------------------|
| **Roulette sem memória** | Omegle / Chatroulette / OmeTV conectam rápido, mas a conversa some ao pular. Não há perfil forte, amizade nem feed para retomar. |
| **Rede social sem acaso** | Instagram, Facebook e similares otimizam para quem você já conhece ou para conteúdo — não para “conheça alguém diferente agora”. |
| **Pouco contexto no match** | Estranho sem foto, bio ou interesses vira roleta de Next; abuso e tédio sobem. |
| **Segurança frágil no formato clássico** | Anonimato sem conta e moderação fraca (caso Omegle) tornaram o formato tóxico e legalmente arriscado. |
| **Social pela metade** | OmeTV adicionou fotos e followers, mas não fecha o ciclo de amizade + DM + posts + stories como produto principal. |

As pessoas **já querem** o frisson do estranho e **já querem** manter quem deu certo. O que falta é um produto que una **descoberta por acaso** e **relação persistente** no mesmo lugar.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Curioso** | Quem quer conversar com alguém novo agora | Roulette rápida (vídeo/texto), pular sem culpa, filtros leves |
| **Conector** | Quem quer transformar chat em amizade | Perfil, pedido de amizade, DM e acompanhar posts/stories |
| **Criador casual** | Quem se expressa com foto, post e story | Publicar e ser encontrado além do match aleatório |
| **Operação** | Quem opera o Hurble | Conta 18+, moderação, denúncia e bloqueio |

## Objetivo

Ser o lugar padrão para **conhecer pessoas diferentes ao acaso** e **construir relação depois**: roulette + perfil + amigos + mensagens + posts + stories, com segurança mínima desde o dia um.

## Proposta de valor

O Hurble trata o estranho como **início de grafo social**, não como descartável. O match abre; o perfil e o feed mantêm.

| Necessidade | O que o Hurble faz |
|-------------|--------------------|
| Conhecer alguém agora | Roulette 1:1 (vídeo e texto) com Next |
| Conversar com mais afinidade | Match por interesses (preferência + fallback), filtro de país |
| Ver quem está do outro lado | Preview/aceite mútuo opcional; fotos e bio no perfil |
| Não perder quem deu certo | Amizade, seguir e DM após o chat |
| Existir além do chat | Posts no feed e stories efêmeros |
| Falar com o mundo | Tradução no chat (meta alinhada ao OmeTV) |
| Sentir-se menos exposto | Conta, denúncia, bloqueio, moderação IA + humana |

### Exemplos

**Roulette que vira amizade** — Lia entra no modo vídeo, dá match com alguém que também marcou “fotografia” e “viagem”. Conversam, pedem amizade, trocam DM e passam a ver stories um do outro.

**Só texto, mesmos interesses** — Pedro está sem câmera: usa chat de texto com tags `guitarra, jazz`. O sistema prefere overlap; se não achar, cai no aleatório (padrão Omegle).

**Aceite antes de ligar** — No modo “conhecer”, Ana vê a foto do outro; só inicia vídeo se os dois aceitarem (padrão Chatroulette).

**Feed depois do acaso** — Depois de três amigos feitos no roulette, o feed do Hurble mostra posts e stories deles — a rede social sustenta o que o acaso começou.

## Princípios

1. **Acaso + continuidade** — roulette sem grafo é brinquedo; grafo sem acaso é rede fechada. O produto precisa dos dois.
2. **Interesses importam** — tags preferenciais (com fallback) batem random puro em qualidade de conversa.
3. **Pessoa visível, não só “Stranger”** — foto, bio e perfil reduzem Next e abuso; anonimato total não é o default.
4. **Next sem culpa** — pular é feature; amizade é opt-in, nunca forçada.
5. **18+ e moderação desde v1** — o formato roulette exige conta, denúncia e bloqueio; não repetir o erro do Omegle.
6. **Social de verdade** — amigos, DM, posts e stories são núcleo, não adesivo de marketing.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Conta** | Cadastro / login, idade 18+, perfil básico |
| **Perfil** | Foto(s), bio, interesses, país / região |
| **Roulette** | Match aleatório 1:1 em **vídeo** e **texto**; botão Next |
| **Matching** | Interesses (prefer-match + fallback); filtro de país |
| **Aceite mútuo** | Preview de foto e aceite dos dois antes do vídeo (modo conhecer) |
| **Amigos** | Pedido, aceitar, recusar, listar, remover |
| **Mensagens** | DM 1:1 entre amigos (e/ou após chat, conforme regras) |
| **Posts** | Publicar no feed (texto/imagem); curtir / comentar (mínimo) |
| **Stories** | Publicação efêmera visível a amigos / rede |
| **Segurança** | Denunciar, bloquear, moderação (IA + fila humana) |
| **Presença** | Indicação simples de online / disponível para roulette |

### Fora de escopo (v1)

- Modo Couple / dois no mesmo lado (OmeTV)
- Spy / Question mode (Omegle histórico)
- Moeda virtual (Quids) e loja de créditos
- Lives, grupos grandes, canais públicos
- App nativo (v1 pode ser web; apps depois)
- Matching por gênero com garantia (evitar promessa falsa)
- Pagamento / assinatura premium completa
- Geolocalização precisa / “pessoas perto” em tempo real

## Modelo conceitual

### Roulette

Sessão 1:1 com estranho (vídeo ou texto). Qualquer lado pode encerrar ou dar **Next**. É o motor de descoberta.

### Match

Pareamento: aleatório, por **interesses** (preferência) e/ou **país**. Pode exigir **aceite mútuo** no modo conhecer.

### Perfil

Identidade persistente: fotos, bio, interesses, país. Substitui o “Stranger” anônimo como default.

### Amizade

Aresta no grafo social após (ou fora do) roulette: pedido → aceito → DM, feed e stories compartilhados conforme privacidade.

### Post

Conteúdo no feed (mais duradouro que story).

### Story

Conteúdo efêmero para manter presença sem poluir o feed.

### DM

Mensagem direta persistente — o oposto do chat que some no Next.

## Critérios de sucesso

- Usuário consegue **entrar no roulette e falar com alguém novo** em poucos cliques.
- Uma fração relevante dos chats **gera amizade ou DM** (a conversa não morre só no Next).
- Perfil com foto e interesses **reduz skips** vs. perfil vazio.
- Posts e stories fazem o usuário **voltar** mesmo sem abrir o roulette naquele dia.
- Denúncia e bloqueio funcionam; violações graves levam a restrição/ban.
- Comparado às referências: tem o acaso do Omegle/Chatroulette/OmeTV **e** a continuidade que eles não entregam.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Roulette** | Fluxo de match aleatório 1:1 com opção de Next |
| **Next** | Encerrar o chat atual e pedir outro match |
| **Interesses** | Tags do perfil usadas no prefer-match |
| **Prefer-match** | Tentar overlap de interesses antes do aleatório puro |
| **Aceite mútuo** | Os dois veem preview e aceitam antes do vídeo |
| **Grafo social** | Amigos, seguidores e relações persistentes |
| **Feed** | Linha do tempo de posts |
| **Story** | Publicação de curta duração |
| **DM** | Mensagem direta persistente |

## Regras de negócio (v1)

- Conta obrigatória; uso declarado **18+**.
- Roulette exige pessoa disponível; Next encerra a sessão atual para os dois.
- Interesses influenciam o match, mas **não garantem** overlap (fallback aleatório).
- Filtro de país restringe o pool quando houver gente online naquele país; senão informa escassez.
- Pedido de amizade pode nascer do chat ou do perfil; DM entre não-amigos segue regra explícita (ex.: só após chat recente ou só amigos).
- Story expira; post permanece até o autor remover (ou moderação).
- Bloqueio impede novo match e DM entre as partes.
- Conteúdo sexual explícito / abuso: denúncia + moderação; reincidência → ban.

## Pesquisa (resumo)

Detalhe completo: [`docs/pesquisa-referencias.md`](docs/pesquisa-referencias.md).

- **Omegle:** texto/vídeo, tags de interesse, anonimato — fraco em continuidade e segurança.
- **Chatroulette:** vídeo, Next, país, aceite mútuo, Quids, moderação IA — fraco como rede social.
- **OmeTV:** país, tradução, couple, fotos/followers — social incompleto vs. amigos + DM + posts + stories.

O Hurble herda **roulette + interesses + país + aceite + moderação** e acrescenta **perfil forte, amigos, DM, posts e stories** como núcleo.

## Próximos passos

→ [`docs/README.md`](docs/README.md) → inventário de funcionalidades (a produzir)
