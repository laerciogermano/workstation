# Clozzy — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de história, tela ou código.  
**Importante:** fonte de verdade do produto — derivados divergem sem ela.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`).

Derivados: [`docs/`](docs/).  
Timeline: [`prompts/`](prompts/).  
Regras IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Clozzy** é uma **rede social** (referências máximas: TikTok + Instagram Reels) com **três usos na mesma conta**:

1. **Atenção** — publicar e ser visto (fotos, vídeos, reels); sem interesse em relacionamento dentro da plataforma.
2. **Relacionamento** — conhecer gente, chat, foto, foto temporária, stories, ligação / videochamada; mais privado, publica pouco.
3. **Conteúdo exclusivo** — close, packs e liberação no privado; existe, mas **não é a ideia principal**.

O núcleo é **encontrar pessoas, seguir, conectar e acompanhar presença** (reels, MMTV, perfil). A venda de exclusivo fica por dentro, discreta.

## Problema

Quem quer atenção, quem quer se relacionar e quem vende exclusivo hoje vivem em produtos separados — ou caem em marketplace de packs sem rede, ou em rede que reforça só a bolha já conhecida.

| Dor | Hoje |
|-----|------|
| **Atenção sem rede própria** | Influencer / quem quer ser visto depende de TikTok/IG alheio; não há casa onde publicar e crescer público sem vender. |
| **Relacionamento sem profundidade na mesma rede** | Dating e DM ficam fora do feed; quem quer conhecer gente nova não tem reels + chat + chamada no mesmo produto. |
| **Venda como cartaz** | Plataformas de pack anunciam o pago de cara — espantam quem só quer ver ou flertar. |
| **Entrada com fricção** | Cadastro pesado antes de ver qualquer coisa; perde o público trazido pelo link do perfil. |

## Para quem

Três perfis de uso (mesma conta; a pessoa pode misturar papéis).

| Perfil | Quem | Quer |
|--------|------|------|
| **Atenção** | Quem publica e quer ser visto; não vende (ou ainda não) e não busca relacionamento | Público, seguir, presença — sem obrigação de chat |
| **Relacionamento** | Quem entra mais privado; publica pouco | Conhecer gente, mensagem, foto, stories, ligação / videochamada |
| **Conteúdo exclusivo** | Quem monetiza no privado; quem compra | Close, pack, liberação e acesso claro |

O **público final** chega em geral pelo link de alguém (ex.: menina divulgando o perfil): abre o site, cai em reels / MMTV, rola, pesquisa, segue — e só depois completa identidade.

## Objetivo

**Ser a rede onde se encontra gente, se acompanha presença e se conecta** — reels e MMTV de cara; seguir / close friends / listas; relacionamento e venda de exclusivo por dentro, sem a capa gritar marketplace.

## Estratégia

**Rede social primeiro; relacionamento e venda como camadas.** Entrada sem login formal; conta implícita por dispositivo; identidade completa ao longo do uso.

| Camada | Papel |
|--------|--------|
| **Atenção / presença** | Reels, MMTV, perfil público, seguir |
| **Relacionamento** | Chat, mídia, stories, chamada; descoberta de gente nova |
| **Exclusivo** | Close, bloqueio, oferta e liberação no privado |

## Conta e sessão

- **Ver sem cadastro formal** — o site abre e mostra conteúdo (reels / MMTV).
- **Sessão por fingerprint (ou identificador de dispositivo)** — persistente; o uso já cria conta implícita.
- **Vínculo** — ao completar cadastro (e-mail, telefone, sexo, identidade…), o histórico da sessão liga à conta.
- **Progressivo** — a plataforma pede mais dados aos poucos, conforme a pessoa usa (pesquisar, ver quem visualizou, seguir, chat, etc.).

## Superfície (o que a pessoa encontra)

Referências: **TikTok** (abre em reels) e **Instagram** (explorar, perfil, seguir, close friends).

| Superfície | Essência |
|------------|----------|
| **Reels** | Feed vertical de cara (dança, clips, presença) |
| **MMTV** | Canal / TV ao vivo ou grade — presença contínua forte |
| **Explorar / busca** | Encontrar pessoas; pode ter limite até a conta enriquecer |
| **Perfil** | Fotos públicas e privadas; bio; quem visualizou; seguir |
| **Seguir / conectar** | Público: segue direto. Privado: precisa aceitar; pode pedir seguir de volta |
| **Close friends / listas** | Círculos e listas de transmissão; influenciador pode ter grupo — ao seguir e ser aceito, a pessoa pode entrar na lista/grupo |
| **Relacionamento** | Chat, foto, foto temporária, reação a stories, ligação / videochamada |
| **Exclusivo** | Conteúdo trancado; close / pack / liberação no privado |

Ordem exata da home (MMTV vs Reels primeiro) fica aberta — **os dois são carro-forte**.

## Proposta de valor

Não é “só marketplace de packs” nem “só dating”. É rede social de presença + conexão, com relacionamento e venda discreta no mesmo fio.

| Necessidade | Clozzy |
|-------------|--------|
| Entrar e ver | Sem login; sessão por fingerprint |
| Atenção / público | Publicar e ser encontrado sem obrigação de vender ou flertar |
| Relacionamento | Conhecer gente, chat, mídia, chamada |
| Seguir com controle | Perfil privado + aceite; listas / close friends |
| Exclusivo discreto | Close e packs por dentro; capa não é loja |
| Acesso claro | O que liberou, onde abre, sob qual regra |

## Princípios

1. **Rede primeiro** — capa = presença (reels / MMTV / perfil), não catálogo de packs.
2. **Três usos, uma conta** — atenção, relacionamento e exclusivo no mesmo produto.
3. **Exclusivo não é o cartaz** — venda existe e importa; não é a ideia principal da capa.
4. **Entrada sem fricção** — ver de cara; conta implícita por fingerprint; identidade progressiva.
5. **Seguir com regra** — público vs privado; aceite e listas de transmissão fazem parte do close.
6. **Relacionamento opcional** — quem só quer atenção não é forçado a chat.
7. **Venda no privado** — oferta → pagamento → liberação no círculo próximo.
8. **Bloqueado até liberar** — preview não entrega o pago.
9. **Acesso delimitado** — a pessoa sabe o que pode ver e sob qual regra.

## Escopo da visão

### Em escopo (produto)

| Área | Capacidade |
|------|------------|
| **Sessão / conta** | Fingerprint → sessão persistente; cadastro progressivo e vínculo |
| **Presença** | Reels, MMTV, perfil (público / privado), explorar / busca |
| **Grafo social** | Seguir, aceite em perfil privado, quem visualizou, close friends, listas / grupos de transmissão |
| **Relacionamento** | Chat, foto, foto temporária, stories, ligação / videochamada |
| **Exclusivo** | Close, conteúdo bloqueado, pack/avulso, checkout, biblioteca / acesso |
| **Gestão** | Publicar, gerenciar círculos/listas, precificar, ver vendas |

### Fora de escopo (v1)

- App nativo (v1 é site; app depois)
- Marketplace de produto físico
- Vitrine pública centrada em catálogo de packs
- Moderação / compliance completo de todas as jurisdições no dia um

## Modelo conceitual

| Conceito | Significado |
|----------|-------------|
| **Conta implícita** | Sessão criada pelo fingerprint / dispositivo antes do cadastro formal |
| **Conta** | Identidade vinculada (dados progressivos + histórico da sessão) |
| **Atenção** | Uso focado em publicar e ser visto |
| **Relacionamento** | Uso focado em conhecer e conversar |
| **Close / lista** | Círculo ou transmissão; seguir+aceite pode incluir a pessoa no grupo do criador |
| **Conteúdo bloqueado** | Mídia trancada até close ou compra |
| **Oferta** | Close, pack ou item com preço e regra de acesso |
| **Biblioteca** | O que a conta tem direito de ver |

## Critérios de sucesso

- Pessoa chega pelo link, **vê reels/MMTV sem login** e mantém sessão por fingerprint.
- Perfis de **atenção** crescem público sem serem obrigados a chat ou venda.
- Perfis de **relacionamento** conseguem conhecer gente, conversar e usar chamada / mídia.
- Seguir em perfil **privado** exige aceite; listas / close friends funcionam.
- Exclusivo vende e libera **no privado**, sem a capa parecer loja de packs.
- Ao completar cadastro, o histórico da sessão **fica vinculado** à conta.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Atenção** | Perfil/uso de quem publica para ser visto |
| **Relacionamento** | Uso de conhecer gente + chat / mídia / chamada |
| **Reels** | Feed vertical (espírito TikTok / IG Reels) |
| **MMTV** | Canal / TV de presença contínua |
| **Fingerprint** | Identificador de dispositivo que cria a sessão implícita |
| **Close** | Círculo privado (atenção exclusiva ± conteúdo liberado) |
| **Lista de transmissão** | Grupo/lista do criador; pode incluir quem segue e foi aceito |
| **Exclusivo** | Conteúdo pago / bloqueado |
| **Preview** | Trecho público que não entrega o pago |
| **Pack** | Bundle pontual; complemento do close, não a capa |

## Próximos passos

→ [`docs/README.md`](docs/README.md) — alinhar `functionalities.md` e épicos a esta visão (fingerprint · reels/MMTV · três usos · exclusivo secundário)
