# Glossário (domínio ↔ código)

| Termo (pt-BR, UI) | Código (inglês) | Definição |
|---|---|---|
| Rolê / evento | `Event` | Qualquer acontecimento publicado: festa, show, bar, social privado |
| Organizador | `Organizer` | Perfil que publica eventos (pessoa física, bar, casa, produtor). Pode existir sem usuário, quando criado pelo admin |
| Anfitrião | `Organizer` (kind=`person`) | Organizador pessoa física, geralmente de evento privado |
| Série / edições | `EventSeries` | Eventos recorrentes agrupados ("Neon Pulse #3, #4") |
| Interesse / like / ♥ | `Interest` | Sinal leve de "curti"; vem do swipe ou da página |
| Passar / ✕ | `SwipePass` | Esconde o evento só no swipe daquele usuário |
| Confirmar presença / "Vou" | `Rsvp` (`confirmed`/`approved`) | Intenção firme de ir; conta para a capacidade e dá direito a avaliar |
| Pedido para entrar | `Rsvp` (`pending`) | Presença em evento privado aguardando o anfitrião |
| Lista de convidados | `guests` | RSVPs de um evento, vistos pelo organizador |
| Código de acesso | `accessCode` | 6 caracteres que dão acesso a um evento privado |
| Interessados / Quem vai | `people?kind=` | Prova social da página do evento |
| Presença visível | `showPresence` | Preferência que exibe ou oculta o avatar do usuário nas listas |
| Raio | `radiusKm` | Distância máxima da busca (1–100 km) |
| Origem | `origin` | Ponto de onde a distância é medida: cidade escolhida > GPS > cidade base |
| Fase | `phase` | `upcoming` / `live` / `ended`, calculada pelo horário |
| Status | `status` | `draft` / `published` / `cancelled` / `removed`, persistido |
| Ao vivo / "Estou aqui" | `phase=live` / `Rsvp.hereAt` | Evento acontecendo; check-in leve do usuário |
| Avaliação / "Como foi?" | `Review` | Nota de 1–5 + comentário pós-evento |
| Valores | `priceItems` | Lista informativa de preços (sem venda no beta) |
| Link de venda externo | `externalTicketUrl` | Site do organizador para comprar o ingresso |
| Denúncia | `Report` | Sinalização de conteúdo para moderação |
| Access token | `AccessToken` (JWT) | Credencial curta (10 min) assinada com EdDSA |
| Refresh token | `RefreshToken` | Credencial longa, rotacionada a cada uso, agrupada em família (`sid`) |
| Passkey | `Passkey` | Credencial WebAuthn (Face ID/digital) para entrar sem senha |
| Wizard | — | Fluxo de criação do evento em 6 passos |
