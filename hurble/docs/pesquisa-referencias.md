# Hurble — Pesquisa de referências

**Por quê:** ancorar o produto no que Omegle, Chatroulette e OmeTV já validaram (e no que falhou).  
**Importante:** features da visão vêm desta comparação; sem ela o escopo vira lista genérica de rede social.  
**No fluxo:** pesquisa → [`visão`](../README.md) → [`docs/`](README.md).

Fontes consultadas (2026): sites oficiais, FAQ OmeTV, Wikipedia (Omegle/Chatroulette), reviews e histórico de interest tags / spy mode.

---

## Comparativo

| Capacidade | Omegle (histórico → 2023) | Chatroulette | OmeTV | Hurble (proposta) |
|------------|---------------------------|--------------|-------|-------------------|
| Match aleatório 1:1 | Sim (texto + vídeo) | Sim (vídeo-first) | Sim (vídeo) | Sim (vídeo + texto) |
| Pular / Next | Sim | Sim | Sim (start / swipe) | Sim |
| Tags / interesses | Sim (prefer-match + fallback) | Parcial (país, top users) | Não (oficial) | Sim (interesses) |
| Filtro de país | Não (core) | Sim | Sim | Sim |
| Preferência de gênero | Não | Premium / parcial | Declaração própria (sem garantia) | Opcional, sem garantia falsa |
| Sem cadastro | Sim | Sim (básico) | Login / social | Cadastro obrigatório (rede social) |
| Preview / aceite mútuo | Não | Sim (foto → ambos aceitam) | Não (conecta direto) | Sim (modo “conhecer” + roulette) |
| Modo casal | Não | Não | Sim (Couple) | Depois da v1 |
| Tradução no chat | Não | Não | Sim | Sim (v1 ou logo após) |
| Spy / Question mode | Sim (histórico) | Não | Não | Fora de escopo v1 |
| Moeda virtual | Não | Quids | Créditos / premium | Fora de escopo v1 |
| Rede social anexada | Não | Fraca | Fotos, conectar, followers | Núcleo: perfil, amigos, DM, posts, stories |
| Moderação | Fraca (fechou por segurança) | IA + humanos | IA + humanos | IA + humanos + denúncia + idade 18+ |

---

## Features por produto

### Omegle

- Pairing anônimo 1:1 (“You” / “Stranger”).
- Chat de texto (2009) e vídeo (2010).
- **Interest tags**: lista de interesses; preferência por overlap; fallback aleatório se não houver match.
- Spy / Question mode (dois estranhos discutem uma pergunta; um observa) — recurso de nicho, não core.
- Sem cadastro; fricção baixa; segurança e menores foram o ponto fraco até o encerramento em 2023.

**Lição para o Hurble:** matching por interesses reduz “next” e aumenta conversas que viram amizade; anonimato total sem conta impede amizade persistente.

### Chatroulette

- Roulette de vídeo desde 2009; web + apps.
- **Next** a qualquer momento.
- Filtro de país; lista de países com gente online.
- Preview de fotos e **aceite mútuo** antes da chamada.
- Top users + moeda **Quids**.
- Moderação IA (ex.: Hive) + revisão humana; anti-nudez.
- Opção de cair para texto se não quiser câmera.

**Lição para o Hurble:** aceite mútuo e preview baixam choque e abuso; país ajuda idioma/cultura; moeda virtual não é necessária no dia um.

### OmeTV

- Alternativa Omegle: match rápido, sem limite de tempo, web + mobile.
- Seleção de **país**; declaração de gênero (privada; FAQ diz que **não garante** match).
- Modo **Couple** (dois no mesmo lado).
- **Tradução** de mensagens no chat.
- Camada social: fotos, conectar, **followers**.
- Conta / login (mais fricção que Omegle puro).

**Lição para o Hurble:** a direção certa é “roulette + rede social”; OmeTV para no follower/foto — Hurble completa com amigos, DM, feed e stories.

---

## Gaps que o Hurble fecha

| Gap nas referências | Como o Hurble responde |
|---------------------|------------------------|
| Conversa some ao dar Next | Amizade, DM e perfil persistentes |
| Pouco contexto da pessoa | Fotos, bio, interesses, posts |
| Relação não continua | Pedido de amizade pós-chat; seguir / stories |
| Só efêmero ou só feed | Dois modos: **Roulette** (conhecer) + **Social** (manter) |
| Segurança frágil (Omegle) | Conta 18+, moderação, denúncia, bloqueio desde v1 |

---

## Próximos passos

→ [`../README.md`](../README.md) (visão alinhada a esta pesquisa)
