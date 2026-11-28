# Clozzy — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de história, tela ou código.  
**Importante:** fonte de verdade do produto — derivados divergem sem ela.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`).

Derivados: [`docs/`](docs/).  
Timeline: [`prompts/`](prompts/).  
Regras IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **Clozzy** é uma **rede social** com **três usos na mesma conta** (referências em [Referências](#referências)):

1. **Atenção** — publicar e ser visto (fotos, vídeos, reels); sem interesse em relacionamento dentro da plataforma.
2. **Relacionamento** — conhecer gente, DM, bate-papo por salas/categorias, foto, foto temporária, stories, ligação / videochamada; mais privado, publica pouco.
3. **Conteúdo exclusivo** — close, packs e liberação no privado; existe, mas **não é a ideia principal**.

O núcleo é **encontrar pessoas, seguir, conectar e acompanhar presença** (reels, MMTV, perfil). A venda de exclusivo fica por dentro, discreta. Na **área pública**, o site **proíbe conteúdo +18**.

## Problema

Quem quer atenção, quem quer se relacionar e quem vende exclusivo hoje vivem em produtos separados — ou caem em marketplace de packs sem rede, ou em rede que reforça só a bolha já conhecida.

| Dor | Hoje |
|-----|------|
| **Atenção sem rede própria** | Influencer / quem quer ser visto depende de TikTok/IG alheio; não há casa onde publicar e crescer público sem vender. |
| **Relacionamento sem profundidade na mesma rede** | Dating e DM ficam fora do feed; salas tipo Bate-papo UOL sumiram; quem quer conhecer gente não tem reels + salas + DM + chamada no mesmo produto. |
| **Venda como cartaz** | Plataformas de pack anunciam o pago de cara — espantam quem só quer ver ou flertar. |
| **Entrada com fricção** | Cadastro pesado antes de ver qualquer coisa; perde o público trazido pelo link do perfil. |

## Para quem

Três perfis de uso (mesma conta; a pessoa pode misturar papéis).

| Perfil | Quem | Quer |
|--------|------|------|
| **Atenção** | Quem publica e quer ser visto; não vende (ou ainda não) e não busca relacionamento | Público, seguir, presença — sem obrigação de chat |
| **Relacionamento** | Quem entra mais privado; publica pouco | Conhecer gente, DM, salas de bate-papo, foto, stories, ligação / videochamada |
| **Conteúdo exclusivo** | Quem monetiza no privado; quem compra | Close, pack, liberação e acesso claro |

O **público final** chega em geral pelo link de alguém (ex.: menina divulgando o perfil): abre o site, cai em reels / MMTV, rola, pesquisa, segue — e só depois completa identidade.

## Objetivo

**Ser a rede onde se encontra gente, se acompanha presença e se conecta** — reels e MMTV de cara; seguir / close friends / listas; relacionamento e venda de exclusivo por dentro, sem a capa gritar marketplace.

## Estratégia

**Rede social primeiro; relacionamento e venda como camadas.** Entrada sem login formal; conta implícita por dispositivo; identidade completa ao longo do uso.

| Camada | Papel |
|--------|--------|
| **Atenção / presença** | Reels, MMTV, perfil público, seguir |
| **Relacionamento** | DM, bate-papo (salas), roleta/OmeTV-like, mídia, stories, chamada |
| **Exclusivo** | Close, bloqueio, oferta e liberação no privado |

## Conta e sessão

- **Ver sem cadastro formal** — o site abre e mostra conteúdo (reels / MMTV).
- **Sessão por fingerprint (ou identificador de dispositivo)** — persistente; o uso já cria conta implícita.
- **Vínculo** — ao completar cadastro (e-mail, telefone, sexo, identidade…), o histórico da sessão liga à conta.
- **Progressivo** — a plataforma pede mais dados aos poucos, conforme a pessoa usa (pesquisar, ver quem visualizou, seguir, chat, etc.).

## Referências

O que o Clozzy **toma emprestado** de cada produto (não é cópia; é norte de UX/comportamento).

| Referência | O que inspira no Clozzy |
|------------|-------------------------|
| **TikTok** | Abrir de cara em feed vertical (reels); rolar conteúdo de presença |
| **Instagram** | Explorar, perfil, seguir, stories, close friends, DM |
| **Instagram Reels** | Formato e linguagem do feed de clips |
| **Bate-papo UOL** | Salas de chat por **categoria** — entrar, conversar, conhecer por tema |
| **OmeTV** | Conhecer desconhecidos ao vivo (espírito roleta / videochat com gente nova) |
| **Snapchat** | Foto temporária; leveza de mídia que some |
| **Close Friends (IG)** | Círculo privado + listas; sensação de quem está “dentro” |
| **OnlyFans / Privacy** (como contraste) | Venda de exclusivo **existe**, mas no Clozzy **não é a capa** — fica no privado |

Referências máximas da capa: **TikTok + Instagram Reels**. Relacionamento: **Bate-papo UOL + OmeTV + IG DM**. Exclusivo: lógica de close/pack no privado, sem cartaz de marketplace.

## Superfície (o que a pessoa encontra)

| Superfície | Essência | Ref. principal |
|------------|----------|----------------|
| **Reels** | Feed vertical de cara (dança, clips, presença) — sem +18 | TikTok / IG Reels |
| **MMTV** | Canal / TV ao vivo ou grade — presença contínua forte — sem +18 | presença contínua (TV / live) |
| **Explorar / busca** | Encontrar pessoas; pode ter limite até a conta enriquecer | Instagram |
| **Perfil** | Fotos públicas e privadas; bio; quem visualizou; seguir — área pública sem +18 | Instagram |
| **Seguir / conectar** | Público: segue direto. Privado: precisa aceitar; pode pedir seguir de volta | Instagram |
| **Close friends / listas** | Círculos e listas de transmissão; influenciador pode ter grupo — ao seguir e ser aceito, a pessoa pode entrar na lista/grupo | Close Friends (IG) |
| **Bate-papo** | Salas por categoria — entrar, conversar, conhecer gente por tema | Bate-papo UOL |
| **Roleta / conhecer ao vivo** | Encontro com desconhecidos (espírito videochat / roleta) | OmeTV |
| **Relacionamento** | DM 1:1, foto, foto temporária, reação a stories, ligação / videochamada | IG DM · Snapchat · OmeTV |
| **Exclusivo** | Conteúdo trancado; close / pack / liberação no privado | close privado (não OnlyFans-capa) |

Ordem exata da home (MMTV vs Reels primeiro) fica aberta — **os dois são carro-forte**.

## Proposta de valor

Não é “só marketplace de packs” nem “só dating”. É rede social de presença + conexão, com relacionamento e venda discreta no mesmo fio.

| Necessidade | Clozzy |
|-------------|--------|
| Entrar e ver | Sem login; sessão por fingerprint |
| Atenção / público | Publicar e ser encontrado sem obrigação de vender ou flertar |
| Relacionamento | Conhecer gente, DM, salas de bate-papo, mídia, chamada |
| Seguir com controle | Perfil privado + aceite; listas / close friends |
| Exclusivo discreto | Close e packs por dentro; capa não é loja |
| Área pública limpa | Sem conteúdo +18 na superfície pública |
| Acesso claro | O que liberou, onde abre, sob qual regra |

## Princípios

1. **Rede primeiro** — capa = presença (reels / MMTV / perfil), não catálogo de packs.
2. **Três usos, uma conta** — atenção, relacionamento e exclusivo no mesmo produto.
3. **Exclusivo não é o cartaz** — venda existe e importa; não é a ideia principal da capa.
4. **Entrada sem fricção** — ver de cara; conta implícita por fingerprint; identidade progressiva.
5. **Seguir com regra** — público vs privado; aceite e listas de transmissão fazem parte do close.
6. **Relacionamento opcional** — quem só quer atenção não é forçado a chat.
7. **Venda no privado** — oferta → pagamento → liberação no círculo próximo.
8. **Público sem +18** — área pública (reels, MMTV, explorar, perfil público) proíbe conteúdo +18.
9. **Bloqueado até liberar** — preview não entrega o pago.
10. **Acesso delimitado** — a pessoa sabe o que pode ver e sob qual regra.

## Escopo da visão

### Em escopo (produto)

| Área | Capacidade |
|------|------------|
| **Sessão / conta** | Fingerprint → sessão persistente; cadastro progressivo e vínculo |
| **Presença** | Reels, MMTV, perfil (público / privado), explorar / busca — área pública sem +18 |
| **Grafo social** | Seguir, aceite em perfil privado, quem visualizou, close friends, listas / grupos de transmissão |
| **Relacionamento** | DM, bate-papo (salas), roleta (espírito OmeTV), foto, foto temporária, stories, ligação / videochamada |
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
| **Bate-papo** | Área de salas por categoria (Bate-papo UOL) para conversa em grupo / tema |
| **Roleta** | Encontro ao vivo com desconhecidos (espírito OmeTV) |
| **Close / lista** | Círculo ou transmissão; seguir+aceite pode incluir a pessoa no grupo do criador |
| **Conteúdo bloqueado** | Mídia trancada até close ou compra |
| **Oferta** | Close, pack ou item com preço e regra de acesso |
| **Biblioteca** | O que a conta tem direito de ver |

## Critérios de sucesso

- Pessoa chega pelo link, **vê reels/MMTV sem login** (sem +18 na área pública) e mantém sessão por fingerprint.
- Perfis de **atenção** crescem público sem serem obrigados a chat ou venda.
- Perfis de **relacionamento** conseguem conhecer gente (DM + salas de bate-papo), conversar e usar chamada / mídia.
- Seguir em perfil **privado** exige aceite; listas / close friends funcionam.
- Exclusivo vende e libera **no privado**, sem a capa parecer loja de packs.
- Ao completar cadastro, o histórico da sessão **fica vinculado** à conta.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Atenção** | Perfil/uso de quem publica para ser visto |
| **Relacionamento** | Uso de conhecer gente + DM / bate-papo / mídia / chamada |
| **Bate-papo** | Salas por categoria (Bate-papo UOL) — conversa temática / em grupo |
| **Roleta** | Encontro ao vivo com desconhecidos (OmeTV) |
| **Reels** | Feed vertical (espírito TikTok / IG Reels) |
| **MMTV** | Canal / TV de presença contínua |
| **Fingerprint** | Identificador de dispositivo que cria a sessão implícita |
| **Close** | Círculo privado (atenção exclusiva ± conteúdo liberado) |
| **Lista de transmissão** | Grupo/lista do criador; pode incluir quem segue e foi aceito |
| **Exclusivo** | Conteúdo pago / bloqueado |
| **Área pública** | Superfície aberta (reels, MMTV, explorar, perfil público) — **proíbe +18** |
| **Preview** | Trecho público que não entrega o pago |
| **Pack** | Bundle pontual; complemento do close, não a capa |

## Próximos passos

→ [`docs/README.md`](docs/README.md) — alinhar `functionalities.md` e épicos a esta visão (fingerprint · reels/MMTV · bate-papo · três usos · exclusivo secundário)
