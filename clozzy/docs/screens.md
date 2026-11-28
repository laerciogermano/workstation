# Clozzy — Telas (funcionalidades por superfície)

**Por quê:** separar as capacidades da visão em superfícies de UI antes de histórias e BDD por tela.  
**Importante:** vale o [documento de visão](../README.md) e os [épicos](epics.md). Onde o mapa antigo P01–P15 / protótipo v2 (marketplace) divergir, **esta visão vence**.  
**No fluxo:** [visão](../README.md) → [funcionalidades](functionalities.md) → [épicos](epics.md) → **telas** → `screens-bdd` → componentes → protótipo.

Anexo espelho da atividade: `attachments/a888a2dc-1679-4cfb-9c1c-cf106489bd59/output/telas.md`.

**Fontes:** visão (superfícies) · [`epics.md`](epics.md) · [`prototipo-v2/`](prototipo-v2/README.md) (C-xx, onde ainda couber).  
**Regra de capa:** rede primeiro; exclusivo no privado; área pública sem +18.  
**Auth:** ver de cara com sessão por fingerprint; cadastro progressivo.

28 telas · 6 grupos · ordem ≈ ondas dos épicos

---

## Mapa de navegação

```text
Clozzy (web)
├── Entrada / presença
│   ├── Reels (carro-forte; pode ser home)
│   ├── MMTV (carro-forte; ordem vs Reels aberta)
│   └── Age gate 18+ (uma vez por aparelho)
├── Descobrir
│   ├── Explorar
│   └── Busca
├── Perfil e grafo
│   ├── Perfil
│   ├── Quem visualizou
│   ├── Pedidos de seguir / aceite
│   └── Close friends / listas
├── Relacionamento
│   ├── Stories (ver / publicar)
│   ├── Conversas (lista DM)
│   ├── Conversa 1:1 (+ foto temporária)
│   ├── Bate-papo (salas por categoria)
│   ├── Sala de bate-papo
│   ├── Roleta
│   └── Ligação / videochamada
├── Exclusivo (privado — sem cartaz na capa)
│   ├── Oferta no privado
│   ├── Checkout Pix
│   ├── Pix (QR) / expirado
│   ├── Liberado
│   ├── Conteúdo (viewer)
│   ├── Biblioteca
│   └── Passe do close
├── Conta e confiança
│   ├── Conta / configurações
│   ├── Identidade progressiva (login / vínculo)
│   ├── Recuperar / código
│   ├── Avisos
│   ├── Ajuda / legal
│   └── Denunciar / bloquear
└── Criador (Studio)
    ├── Quero vender / onboarding
    ├── Studio · resumo
    ├── Studio · perfil / ofertas / conteúdos
    └── Studio · financeiro / saque
```

Landing de marketing (lista de espera / divulgação) é superfície à parte da home de presença.

---

## Índice — tela · épicos · protótipo

| Tela | Épicos | Protótipo v2 (C-xx) | Nota vs mapa antigo |
|------|--------|---------------------|---------------------|
| TELA-01 Reels | EP-02, EP-03, EP-06 | — (gap) | Substitui “feed pós-v1”; vira carro-forte |
| TELA-02 MMTV | EP-02, EP-03, EP-07 | — (gap) | Novo |
| TELA-03 Age gate 18+ | EP-03 | C-02 | Mantém |
| TELA-04 Explorar | EP-03, EP-09 | C-12 | Sem “preço a partir de” na capa |
| TELA-05 Busca | EP-09 | C-13 | Limite progressivo possível |
| TELA-06 Perfil | EP-03, EP-08, EP-10 | C-20 (parcial) | Sem vitrine de packs na capa pública |
| TELA-07 Quem visualizou | EP-08 | — (gap) | Novo |
| TELA-08 Pedidos de seguir | EP-10 | — (gap) | Novo |
| TELA-09 Close friends / listas | EP-10 | — (gap) | Novo (gestão) |
| TELA-10 Stories | EP-11 | C-11 (parcial) | Relacionamento, não só close pago |
| TELA-11 Conversas | EP-11 | C-33 (era pós-v1) | Entra no escopo da visão |
| TELA-12 Conversa 1:1 | EP-04, EP-11 | C-34 | Foto temporária / mídia leve |
| TELA-13 Bate-papo (salas) | EP-12 | — (gap) | Novo |
| TELA-14 Sala | EP-12 | — (gap) | Novo |
| TELA-15 Roleta | EP-13 | — (gap) | Novo |
| TELA-16 Ligação / videochamada | EP-14 | — (gap) | Novo |
| TELA-17 Oferta no privado | EP-15 | C-21/C-22 (reposicionar) | Oferta some da capa pública |
| TELA-18 Checkout / Pix / liberado | EP-16 | C-22…C-26 | Mantém fluxo |
| TELA-19 Conteúdo (viewer) | EP-15, EP-17 | C-25 | Mantém |
| TELA-20 Biblioteca | EP-17 | C-30 | Mantém |
| TELA-21 Passe do close | EP-17 | C-31 | Mantém |
| TELA-22 Conta | EP-02, EP-05 | C-35 | Cadastro progressivo |
| TELA-23 Identidade / login | EP-02 | C-03…C-06 | Vínculo à sessão fingerprint |
| TELA-24 Avisos | EP-19 | C-32 | Sem expor preço/mídia na lockscreen |
| TELA-25 Ajuda / legal | EP-05 | C-36 | Mantém |
| TELA-26 Denunciar / bloquear | EP-04 | C-37 | Ampliar a DM/sala/roleta |
| TELA-27 Onboarding criador | EP-15, EP-18 | C-40…C-44 | Mantém |
| TELA-28 Studio | EP-18 | C-50…C-58 | + círculos/listas |
| Landing marketing | EP-20 | C-01 (reescrever) | Sem cara de loja de packs |

---

## Grupo A — Entrada / presença

### TELA-01 — Reels

**Objetivo:** abrir o site e rolar presença vertical sem login formal (área pública sem +18).  
**Personas:** atenção · relacionamento · visitante implícito.

**Funcionalidades**

- Feed vertical na entrada (clip / foto / vídeo)
- Rolar sem cadastro; sessão por fingerprint
- Curtir, comentar, salvar (conforme regra de progressão de conta)
- Abrir perfil a partir do reel
- Publicar clip com corte, capa e legenda
- Bloquear conteúdo +18 nesta superfície

**Navegação:** home (ou aba) ↔ MMTV · perfil · explorar.  
**Gap protótipo:** sem C-xx; C-10 (início close) não substitui.

---

### TELA-02 — MMTV

**Objetivo:** presença contínua (canal / grade) ao lado dos reels.  
**Personas:** atenção · visitante implícito.

**Funcionalidades**

- Grade ou canal ao vivo / contínuo (sem +18)
- Entrar e sair do canal
- Relação com perfil de quem aparece
- Ordem home Reels ↔ MMTV configurável (ambos carro-forte)

**Navegação:** home / aba ↔ Reels · perfil.  
**Gap protótipo:** sem C-xx.

---

### TELA-03 — Age gate 18+

**Objetivo:** uma pergunta por aparelho antes da superfície adulta.  
**Épicos:** EP-03 · **C-02**

**Funcionalidades**

- Confirmar 18+ / sair
- Persistência da escolha no aparelho
- Remoção / bloqueio de menor (fluxo de confiança)

---

## Grupo B — Descobrir

### TELA-04 — Explorar

**Objetivo:** achar gente além da bolha, sem ranking de vendas.  
**Épicos:** EP-09 · **C-12** (ajustar)

**Funcionalidades**

- Grade / lista de perfis (presença, não preço)
- Filtro por categoria / interesse (opcional)
- Sem “preço a partir de” e sem ranking de vendas na superfície
- Card abre perfil

---

### TELA-05 — Busca

**Objetivo:** achar por nome / @.  
**Épicos:** EP-09 · **C-13**

**Funcionalidades**

- Busca por nome e @ (sem acento / case)
- Recentes no aparelho
- Limite progressivo até a conta enriquecer (se a visão pedir)

---

## Grupo C — Perfil e grafo

### TELA-06 — Perfil

**Objetivo:** ser visto como pessoa (atenção), não como loja.  
**Épicos:** EP-08, EP-10 · **C-20** (reposicionar)

**Funcionalidades**

- Foto, capa, nome, @, bio, links
- Perfil público e privado
- Prévia pública; itens trancados sem entregar o pago
- Seguir / deixar de seguir
- “Entrar no close” **sem preço na capa** do perfil público
- Compartilhar link do perfil
- Área pública sem +18
- Ofertas de pack **não** ocupam a capa (vão ao privado — TELA-17)

---

### TELA-07 — Quem visualizou

**Objetivo:** ver quem visitou o perfil (progressão de conta).  
**Épicos:** EP-08 · **gap**

**Funcionalidades**

- Lista de visualizações
- Gate / pedido de mais dados se a conta ainda for implícita

---

### TELA-08 — Pedidos de seguir

**Objetivo:** aceite em perfil privado e pedir seguir de volta.  
**Épicos:** EP-10 · **gap**

**Funcionalidades**

- Inbox de pedidos
- Aceitar / recusar
- Pedir seguir de volta

---

### TELA-09 — Close friends / listas

**Objetivo:** círculos e listas de transmissão com controle.  
**Épicos:** EP-10 · **gap** (Studio também edita)

**Funcionalidades**

- Criar / editar círculos e listas
- Incluir quem segue e foi aceito (regra do criador)
- Remover membro

---

## Grupo D — Relacionamento

### TELA-10 — Stories

**Objetivo:** mídia leve com prazo (ver / publicar / reagir).  
**Épicos:** EP-11 · **C-11** (ampliar além do close pago)

**Funcionalidades**

- Publicar story; ver com barras de progresso
- Reagir; destaques
- Respeitar público vs close / lista

---

### TELA-11 — Conversas (lista DM)

**Objetivo:** inbox 1:1 sem forçar quem só quer atenção.  
**Épicos:** EP-11 · **C-33** (sai de “pós-v1” na visão)

**Funcionalidades**

- Lista de threads; não lidas
- Entrar na conversa
- Pedido de mensagem / aceite entre desconhecidos

---

### TELA-12 — Conversa 1:1

**Objetivo:** texto, foto, foto temporária; denúncia de dentro.  
**Épicos:** EP-11, EP-04 · **C-34**

**Funcionalidades**

- Mensagem texto e foto
- Foto temporária
- Bloquear / denunciar
- Convite para ligação (→ TELA-16)
- Oferta de exclusivo no fio (→ TELA-17), sem virar cartaz

---

### TELA-13 — Bate-papo (salas)

**Objetivo:** conhecer gente por tema (espírito Bate-papo UOL).  
**Épicos:** EP-12 · **gap**

**Funcionalidades**

- Lista de salas por categoria
- Entrar / pré-visualizar sala

---

### TELA-14 — Sala de bate-papo

**Objetivo:** conversar no tema; caminho para perfil / DM.  
**Épicos:** EP-12 · **gap**

**Funcionalidades**

- Mensagens da sala
- Sair
- Moderação básica
- Abrir perfil / pedir DM

---

### TELA-15 — Roleta

**Objetivo:** encontro ao vivo com desconhecidos (espírito OmeTV).  
**Épicos:** EP-13 · **gap**

**Funcionalidades**

- Parear / aceitar / pular / encerrar
- Denúncia e bloqueio
- Idade / proteções
- Opcional: caminho para DM se ambos quiserem

---

### TELA-16 — Ligação / videochamada

**Objetivo:** passar da mensagem para a chamada com consentimento.  
**Épicos:** EP-14 · **gap**

**Funcionalidades**

- Convite 1:1; áudio e vídeo; encerrar
- Denúncia / limites anti-gravação no que a web permitir

---

## Grupo E — Exclusivo (privado)

### TELA-17 — Oferta no privado

**Objetivo:** close / pack / item com preço **fora da capa pública**.  
**Épicos:** EP-15 · **C-21 / C-22** (contexto: chat / círculo, não vitrine)

**Funcionalidades**

- Mostrar oferta (tipo, o que inclui, preço)
- Preview sem entregar o pago
- CTA pagar → checkout
- Consentimento / autoria no envio

---

### TELA-18 — Checkout · Pix · liberado · expirado

**Objetivo:** pagar e abrir no mesmo fio.  
**Épicos:** EP-16 · **C-22…C-26**

**Funcionalidades**

- Resumo da oferta; conta vinculada (ou progressão)
- Pix (QR / copia-cola); contador; status
- Sem cobrança duplicada no mesmo ciclo
- Liberado com caminho para biblioteca / conteúdo
- Expirado / falhou: novo código, nada cobrado
- Estorno / contestação com registro (fluxo de suporte)

---

### TELA-19 — Conteúdo (viewer)

**Objetivo:** consumir o liberado com proteção básica.  
**Épicos:** EP-15, EP-17 · **C-25**

**Funcionalidades**

- Player / viewer (stream-only se for política)
- Marca d’água / hotlink conforme stack
- Lista dos itens do pack / close

---

### TELA-20 — Biblioteca

**Objetivo:** saber o que pode ver e até quando.  
**Épicos:** EP-17 · **C-30**

**Funcionalidades**

- Seções: close / packs / itens
- Status: ativa / expirada / cancelada
- Abrir conteúdo; renovar / recomprar

---

### TELA-21 — Passe do close

**Objetivo:** assinatura como passe (renovar / cancelar).  
**Épicos:** EP-17 · **C-31**

**Funcionalidades**

- Desde quando; próxima cobrança
- Cancelar mantém acesso até o fim do período

---

## Grupo F — Conta, confiança e criador

### TELA-22 — Conta / configurações

**Objetivo:** identidade progressiva, preferências, sair.  
**Épicos:** EP-02, EP-05 · **C-35**

**Funcionalidades**

- Dados já coletados; completar identidade
- Preferências de notificação
- Sair / desativar / excluir
- Atalho “quero vender” → onboarding

---

### TELA-23 — Identidade / login / recuperação

**Objetivo:** vincular fingerprint à conta sem perder histórico.  
**Épicos:** EP-02 · **C-03…C-06**

**Funcionalidades**

- Cadastro progressivo (e-mail, telefone, sexo, identidade…)
- Login / recuperação / código
- Aceite Termos + Privacidade com versão e data
- Ao completar, histórico da sessão liga à conta

---

### TELA-24 — Avisos

**Objetivo:** saber o que aconteceu sem expor preço/mídia na tela bloqueada.  
**Épicos:** EP-19 · **C-32**

**Funcionalidades**

- Central: mensagem, aceite, conteúdo no close, pagamento, vencimento, saque
- Preferências por tipo

---

### TELA-25 — Ajuda / legal

**Objetivo:** regras claras.  
**Épicos:** EP-05 · **C-36**

**Funcionalidades**

- Termos, privacidade, cookies, 18+, FAQ, contato
- LGPD: acesso, correção, exclusão
- DMCA / direitos autorais

---

### TELA-26 — Denunciar / bloquear

**Objetivo:** confiança em perfil, conteúdo, mensagem, sala, roleta.  
**Épicos:** EP-04 · **C-37**

**Funcionalidades**

- Denúncia com motivo + fila
- Bloquear / restringir / silenciar
- Protocolo íntima sem consentimento / deepfake (entrada do caso)

---

### TELA-27 — Onboarding criador

**Objetivo:** ativar venda a partir da mesma conta.  
**Épicos:** EP-15, EP-18 · **C-40…C-44**

**Funcionalidades**

- Dados mínimos, verificação (selfie/doc), chave Pix
- Aceite termos de criador / repasse
- Status: em análise → ativa (rascunho permitido)

---

### TELA-28 — Studio (painel do criador)

**Objetivo:** publicar, precificar, círculos, vendas e sacar.  
**Épicos:** EP-18 · **C-50…C-58**

**Funcionalidades**

- Resumo: saldo, vendas, membros, atalhos
- Editar perfil público (sem cartaz de packs)
- CRUD ofertas e conteúdos; visibilidade prévia / close / pago
- Gerir círculos / listas; remover / bloquear membro
- Extrato; saque Pix do mesmo titular

---

### Landing / marketing (EP-20)

**Objetivo:** aquisição sem cara de marketplace.  
**C-01** (reescrever copy)

**Funcionalidades**

- Headline de rede / presença; CTA explorar e criar presença
- Lista de espera / convite sem preço na capa
- Links legais

---

## Transversais (não são tela cheia)

| Capacidade | Onde aparece |
|------------|--------------|
| Sessão fingerprint | Todas as telas públicas de presença |
| Progressão de conta (pedir dado) | Explorar, quem visualizou, seguir, chat, compra |
| Tab bar / dock | Reels · MMTV · Explorar · Conversas · Conta (composição final no protótipo) |
| Age gate | Uma vez; bloqueia menor |
| Denúncia / bloqueio | Perfil, conteúdo, DM, sala, roleta, chamada |
| Preferências de aviso | Conta + central de avisos |

---

## Cobertura da visão (superfícies → telas)

| Superfície (visão) | Telas |
|--------------------|-------|
| Reels | TELA-01 |
| MMTV | TELA-02 |
| Explorar / busca | TELA-04, TELA-05 |
| Perfil | TELA-06, TELA-07 |
| Seguir / conectar | TELA-06, TELA-08 |
| Close friends / listas | TELA-09, TELA-28 |
| Bate-papo | TELA-13, TELA-14 |
| Roleta | TELA-15 |
| Relacionamento | TELA-10…12, TELA-16 |
| Exclusivo | TELA-17…21, TELA-27…28 |

---

## Antes → depois

| Antes (`functionalities.md` P01–P15 / protótipo v2) | Depois (este mapa) |
|----------------------------------------------------|-------------------|
| Home = explorar criadoras / close | Home = Reels / MMTV |
| Perfil = vitrine de packs com preço | Perfil = presença; oferta no privado |
| Chat / stories / feed = pós-v1 | Relacionamento e presença no escopo |
| Sem salas / roleta / chamada | TELA-13…16 |
| P01–P15 como contrato | TELA-01…28 alinhadas à visão; P* legado até realinhar `functionalities.md` |

## Rollback

```bash
git checkout -- clozzy/docs/screens.md clozzy/docs/README.md
rm -f attachments/a888a2dc-1679-4cfb-9c1c-cf106489bd59/output/telas.md
```

## Próximo na esteira

1. Realinhar [`functionalities.md`](functionalities.md) a estas telas (hoje ainda é o mapa marketplace).  
2. `user-stories.md` / `bdd.md` por épico (onda 1).  
3. `screens-bdd.md` — mesmos critérios agrupados por TELA.  
4. Atualizar [`prototipo-v2/`](prototipo-v2/README.md) para cobrir gaps (Reels, MMTV, salas, roleta, grafo) e tirar packs da capa do perfil.
