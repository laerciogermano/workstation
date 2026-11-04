# RoleGo Beta — PRD (Product Requirements Document)

| Campo | Valor |
|---|---|
| Produto | RoleGo — "Viva o Rolê" |
| Versão do documento | 1.0 (2026-11-03) |
| Release alvo | **Beta 1.0** (beta fechado → beta aberto em Curitiba) |
| Épicos no escopo | **E01** Conta, onboarding e perfil · **E02** Publicação e descoberta de eventos · **E03** Ciclo de vida do evento |
| Fora do escopo | E04 Ingressos e pagamento · E05 Cardápio · E06 Gamificação/Wallet · E07 Influenciadores · E08 Publicidade · E09 Premium · E10 Notificações push · E11 Reputação anfitrião–convidado |
| Fontes | [Visão](../README.md) · [Épicos](../epics.md) · [Identidade visual](../identidade-visual.md) · [Wireframes MVP](../input/rolego_mvp_completo_dark.pdf) · [Slides](../input/rolego_slides_publico.pdf) · [App v0.1](../app/README.md) |

---

## 1. Resumo

O RoleGo junta num app só o que hoje está espalhado entre Instagram, Google, sites de bilheteria e grupos de WhatsApp: **descobrir o que está rolando perto**. O Beta valida o **loop central de oferta e demanda**:

> **Organizador publica um evento → usuário descobre por raio (feed / swipe / lista) → abre a página do evento → demonstra interesse ou confirma presença → vai ao rolê → avalia.**

O Beta não vende ingresso. Eventos pagos mostram os **valores informativos** (pista, VIP, bebida) e, se o organizador quiser, um **link externo de compra**. A venda dentro do app fica para a próxima release (E04).

## 2. Problema

1. Para descobrir o que está rolando numa cidade, a pessoa precisa procurar em vários lugares, e isso é ainda pior para quem está viajando ou acabou de chegar.
2. Não há como saber **quem vai** a um evento antes de decidir ir.
3. Bares, casas e produtores não têm uma **vitrine unificada** com dados de interesse do público.
4. Eventos privados (social, churrasco) não têm **controle de lista** simples nem revelação segura do endereço.

## 3. Objetivos do Beta

| # | Objetivo | Como sabemos que deu certo (métrica-alvo, 8 semanas após abrir o beta em Curitiba) |
|---|---|---|
| O1 | Provar que existe **oferta** suficiente | ≥ 30 organizadores parceiros ativos · ≥ 150 eventos publicados |
| O2 | Provar que a **descoberta** engaja | ≥ 500 usuários ativos mensais (MAU) · ≥ 60% dos que concluem o onboarding dão ≥ 1 like na primeira sessão |
| O3 | Provar a **intenção de ir** | ≥ 25% dos MAU confirmam presença em ≥ 1 evento · taxa evento-visto → presença-confirmada ≥ 8% |
| O4 | Provar **retenção** | Retenção D7 ≥ 20% · D30 ≥ 10% |
| O5 | Coletar sinal pós-evento | ≥ 30% das presenças confirmadas recebem avaliação |

**North Star Metric:** *presenças confirmadas por semana* (RSVPs em eventos que ainda não aconteceram).

> As metas são hipóteses iniciais tiradas da visão ("500 primeiros usuários ativos", "30 primeiros parceiros"). Elas devem ser revistas ao fim do beta fechado.

### Não-objetivos (Beta)
- Monetização de qualquer tipo (taxa, ads, premium).
- App nativo nas lojas. O Beta é **PWA mobile-first** (ver [ADR-001](04-adrs.md#adr-001)).
- Social entre pessoas (amigos, match coletivo, chat, direct, Modo Solo). Vai para a release seguinte.
- Mapa de eventos (decisão estratégica ainda pendente na visão, e depende de E08/E09).
- Push notifications (E10). No Beta só existem **e-mails transacionais** mínimos.

## 4. Personas no Beta

| Persona | Papel no Beta | Épicos |
|---|---|---|
| **Usuário Explorador** | Descobre, curte, confirma presença, avalia | E01, E02, E03 |
| **Usuário Solo / viajante** | Mesmo fluxo; usa o raio e a cidade para explorar onde está | E01, E02, E03 |
| **Anfitrião de evento privado (PF)** | Publica evento privado, aprova a lista e revela o endereço só aos aprovados | E02, E03 |
| **Convidado de evento privado** | Acessa por link/código, pede para entrar, vê o endereço depois de aprovado | E02, E03 |
| **Bar / Casa / Produtor** | Publica eventos públicos, mostra valores, acompanha interessados e confirmados | E02, E03 |
| **Admin RoleGo (interno)** | Cadastra parceiros, faz curadoria e modera denúncias | transversal |

Influenciadores (E07) não entram no Beta.

## 5. Escopo funcional

Prioridade **MoSCoW**: **M** = Must (bloqueia o beta), **S** = Should (entra se couber, senão vai para a 1.1), **C** = Could.
O detalhamento com histórias e critérios de aceite em Gherkin fica em [`02-historias/`](02-historias/).

### 5.1 E01 — Conta, onboarding e perfil

| ID | Requisito | Prio |
|---|---|---|
| RF-E01-01 | Criar conta com e-mail, senha e confirmação de senha (mín. 8 caracteres) e aceitar Termos e Política de Privacidade | M |
| RF-E01-02 | Entrar com Google | M |
| RF-E01-03 | Entrar com Apple | S |
| RF-E01-04 | Login com e-mail e senha (erro genérico) | M |
| RF-E01-05 | Recuperar e redefinir senha por e-mail (token de uso único, 1 h) | M |
| RF-E01-06 | Logout (neste aparelho ou em todos) | M |
| RF-E01-07 | Onboarding: tipos de evento preferidos (≥ 1) | M |
| RF-E01-08 | Onboarding: cidade (sugestões + busca) | M |
| RF-E01-09 | Onboarding: permissão de localização (grava lat/lng; se negada, usa o centro da cidade) | M |
| RF-E01-10 | Onboarding: raio contínuo de 1 a 100 km (padrão 20 km) | M |
| RF-E01-11 | Concluir onboarding e cair na descoberta com as preferências aplicadas | M |
| RF-E01-12 | Perfil: foto (JPG/PNG/WebP até 5 MB). Ao escolher o arquivo, abre o **editor de recorte** (arrastar, zoom e girar 90°) com moldura quadrada; ao confirmar, envia o recorte e a API gera WebP 512. Nome e e-mail | M |
| RF-E01-13 | Editar preferências de descoberta depois do onboarding (tipos, cidade, raio) | M |
| RF-E01-14 | Privacidade: "Mostrar minha presença nos eventos" (padrão ligado, explicado no onboarding) | M |
| RF-E01-15 | Excluir conta (LGPD): anonimiza o perfil e remove fotos | M |
| RF-E01-16 | Verificar e-mail (link de confirmação). É obrigatório para publicar evento, não para explorar | S |
| RF-E01-17 | Perfil mostra "Rolês que fui" (presenças em eventos encerrados) | S |
| RF-E01-18 | **Passkeys** (Face ID/digital via WebAuthn): criar depois do onboarding e entrar sem senha, inclusive pelo autofill | S |

### 5.2 E02 — Publicação e descoberta de eventos

**Lado oferta (organizador)**

| ID | Requisito | Prio |
|---|---|---|
| RF-E02-01 | Ativar o **Modo organizador** a partir do perfil: nome público, tipo (Pessoa física / Bar / Casa de eventos / Produtor), bio, Instagram | M |
| RF-E02-02 | Criar evento em passos: básico (título, tipo, descrição, capa) → quando (início/fim) → onde (local, CEP/endereço → coordenadas) → acesso (público/privado, capacidade) → valores (lista informativa + link externo opcional) → revisão. A **capa** passa pelo mesmo editor de recorte da foto de perfil, com moldura **4:5** (arrastar, zoom, girar); a API gera WebP 1080×1350 + thumb 360×450 | M |
| RF-E02-03 | Salvar rascunho e retomar depois | M |
| RF-E02-04 | Publicar evento (validação completa; o início precisa estar no futuro) | M |
| RF-E02-05 | Evento **privado**: acesso por link/código; o endereço exato só aparece para quem foi aprovado; na descoberta aparece só o bairro e a distância aproximada | M |
| RF-E02-06 | Controle de lista: aprovação manual ou automática de pedidos de presença em evento privado | M |
| RF-E02-07 | Editar evento publicado. Mudar data ou local dispara e-mail para os confirmados | M |
| RF-E02-08 | Painel "Meus eventos": rascunhos, próximos e passados, com contagem de interessados e confirmados | M |
| RF-E02-09 | Galeria de fotos do evento (até 20 fotos). Cada foto passa pelo **editor de recorte** (moldura 1:1, arrastar, zoom, girar) antes do envio | S |
| RF-E02-10 | **Série/edições**: marcar o evento como nova edição de um anterior (copia os dados e agrupa a galeria) | S |
| RF-E02-11 | Duplicar evento | C |

**Lado demanda (usuário)**

| ID | Requisito | Prio |
|---|---|---|
| RF-E02-20 | **Feed**: cards de eventos públicos e privados-descobríveis dentro do raio, a partir de agora, agrupados em "Hoje", "Amanhã", "Este fim de semana", "Próximos" | M |
| RF-E02-21 | **Swipe** ("Tinder de eventos"): um card por vez; direita/♥ = interesse; esquerda/✕ = passar (o evento some do swipe); desfazer o último | M |
| RF-E02-22 | **Lista**: visão compacta e ordenável (data / distância) | M |
| RF-E02-23 | Filtros: tipo de evento, dia (hoje, amanhã, sex, sáb, dom, intervalo) e raio 1–100 km. São persistidos por usuário | M |
| RF-E02-24 | Origem da busca: localização atual (se permitida) ou cidade escolhida. Trocar a cidade na hora, para quem está viajando | M |
| RF-E02-25 | Estado vazio útil: sugere aumentar o raio ou trocar o dia | M |
| RF-E02-26 | Busca por texto (nome do evento ou do local) | S |
| RF-E02-27 | Ranking simples: início mais próximo → distância → preferência de tipo. Sem patrocínio no Beta | M |
| RF-E02-28 | Mapa de eventos | **Fora** (decisão pendente) |

### 5.3 E03 — Ciclo de vida do evento

| ID | Requisito | Prio |
|---|---|---|
| RF-E03-01 | **Página do evento**: capa, título, tipo, organizador, data/hora, local (ou bairro, se privado), distância, descrição, valores informativos, classificação etária, link externo de ingresso | M |
| RF-E03-02 | **Interessados** (quem deu like) e **confirmados** (quem confirmou presença): contagens e avatares de quem deixou a presença visível | M |
| RF-E03-03 | **Tenho interesse** (toggle, mesmo dado do like do swipe) | M |
| RF-E03-04 | **Confirmar presença** (RSVP). Público: imediato, respeitando a capacidade. Privado: vira pedido até o anfitrião aprovar. Cancelar presença | M |
| RF-E03-05 | Estados do evento: Rascunho → Publicado → Ao vivo → Encerrado; Cancelado; Removido (moderação). "Ao vivo" e "Encerrado" são calculados pelo horário | M |
| RF-E03-06 | **Cancelar evento** (organizador): informa o motivo, envia e-mail aos confirmados e mostra a faixa "Cancelado" na página | M |
| RF-E03-07 | **Promover**: link público `/e/{slug}` com preview (Open Graph) para WhatsApp/Instagram, compartilhamento nativo e botão copiar link | M |
| RF-E03-08 | Banner "Ao vivo agora" na página e no feed durante o evento | S |
| RF-E03-09 | **Pós-evento**: quem confirmou presença pode avaliar (1–5 estrelas + comentário opcional) até 7 dias depois do fim | M |
| RF-E03-10 | Nota média e comentários na página do evento e na página do organizador | M |
| RF-E03-11 | **Fotos de edições anteriores** na página do evento (quando faz parte de uma série) | S |
| RF-E03-12 | Página pública do organizador: bio, próximos eventos, passados, nota média | S |
| RF-E03-13 | Denunciar evento ou comentário. O admin pode remover o conteúdo e bloquear o usuário | M |
| RF-E03-14 | Organizador vê a lista de confirmados e de pedidos pendentes (privado) e consegue aprovar/recusar | M |
| RF-E03-15 | Selos pós-evento | **Fora** (E06) |
| RF-E03-16 | Influenciadores confirmados na página | **Fora** (E07) |

### 5.4 Backoffice mínimo (transversal)

| ID | Requisito | Prio |
|---|---|---|
| RF-ADM-01 | Login de admin (papel `admin`, sem cadastro público) | M |
| RF-ADM-02 | Fila de denúncias: ver, remover conteúdo, descartar a denúncia | M |
| RF-ADM-03 | Bloquear/desbloquear usuário | M |
| RF-ADM-04 | Criar conta de organizador para um parceiro e publicar em nome dele (curadoria de lançamento, contra o problema do ovo e da galinha) | S |
| RF-ADM-05 | Painel de métricas do beta (contagens básicas) | C |

## 6. Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF-01 | Plataforma | PWA instalável (Android/iOS 16.4+), mobile-first 360–430 px; desktop mostra o layout centralizado |
| RNF-02 | Performance | Feed p95 < 400 ms na API com 10 mil eventos ativos; LCP < 2,5 s em 4G; bundle inicial < 250 KB gzip |
| RNF-03 | Disponibilidade | 99% no beta (uma VPS); backup diário do banco com retenção de 14 dias; RPO 24 h, RTO 4 h |
| RNF-04 | Segurança | OWASP ASVS nível 1; JWT EdDSA de 10 min + refresh rotativo com detecção de reuso em cookies httpOnly; rate limit; validação por schema em toda entrada; ver [10-seguranca](10-seguranca-privacidade-lgpd.md) |
| RNF-05 | Privacidade/LGPD | Base legal documentada, consentimento de localização, exclusão de conta, endereço privado nunca vaza na API |
| RNF-06 | Acessibilidade | WCAG 2.1 AA: contraste, foco visível, alvos ≥ 44 px, swipe com alternativa por botões |
| RNF-07 | Observabilidade | OpenTelemetry + Grafana (Loki, Prometheus, Tempo, Faro para erros do front e Web Vitals), `/health`, uptime via blackbox, alertas no Grafana |
| RNF-08 | Qualidade | Cobertura ≥ 80% em domínio e serviços; e2e dos fluxos críticos; CI verde obrigatório para merge |
| RNF-09 | i18n | pt-BR apenas, mas com strings centralizadas; datas em `America/Sao_Paulo`; guardar em UTC |
| RNF-10 | Escala | Projetado para 1 cidade e até 50 mil usuários sem mudar a arquitetura |

## 7. Jornadas principais (Beta)

1. **Primeiro acesso:** Splash → Criar conta / Google → Preferências → Cidade → Localização → Raio → Feed.
2. **Descobrir e decidir:** Feed/Swipe → ♥ interesse → Página do evento → vê confirmados → **Confirmar presença** → compartilha no WhatsApp.
3. **Evento privado:** recebe link → abre (login se preciso) → "Pedir para entrar" → anfitrião aprova → endereço revelado + e-mail.
4. **Organizador:** Perfil → Modo organizador → Criar evento (passos) → Publicar → compartilha o link → acompanha interessados/confirmados → aprova pedidos.
5. **Pós-evento:** depois do fim, o card "Como foi?" aparece no topo do feed e em "Rolês que fui" → avaliação.

Os diagramas de sequência dessas jornadas estão em [07-diagramas](07-diagramas.md).

## 8. Regras de negócio-chave

| ID | Regra |
|---|---|
| RN-01 | Na descoberta só aparecem eventos `PUBLISHED` com `endsAt > agora`, dentro do raio, a partir da origem (GPS ou centro da cidade) |
| RN-02 | Distância calculada no servidor (PostGIS `ST_DWithin`/`ST_Distance`), arredondada para 0,1 km; em eventos privados não aprovados, arredondada para 1 km |
| RN-03 | Endereço exato e coordenadas de evento privado só voltam na API para: organizador, admin, convidado com RSVP `APPROVED` |
| RN-04 | Interesse e presença são independentes; confirmar presença marca interesse automaticamente |
| RN-05 | Capacidade: quando `confirmados = capacidade`, novos pedidos de presença são recusados com "Lotado" (sem lista de espera no Beta) |
| RN-06 | "Passar" no swipe esconde o evento só no swipe daquele usuário; o feed continua mostrando |
| RN-07 | Avaliar: só quem tinha RSVP `CONFIRMED`/`APPROVED`, entre `endsAt` e `endsAt + 7 dias`, uma vez por evento (pode editar dentro da janela) |
| RN-08 | Mudar `startsAt`, `endsAt` ou o local de evento com confirmados gera e-mail; mudança de título/descrição não gera |
| RN-09 | Evento cancelado continua acessível pelo link (faixa "Cancelado"), mas sai da descoberta; os RSVPs ficam `CANCELLED_BY_EVENT` |
| RN-10 | Usuário bloqueado não loga; os eventos dele saem da descoberta |
| RN-11 | Classificação etária: o usuário confirma a maioridade no cadastro (autodeclaração). Eventos 18+ exigem essa confirmação para RSVP |
| RN-12 | Evento precisa ter `startsAt` no futuro para publicar, duração ≤ 48 h e `endsAt > startsAt` |

## 9. Premissas e dependências

- A cidade piloto é **Curitiba**; o catálogo de cidades é extensível pelo admin.
- O time comercial traz os 30 primeiros parceiros **antes** do beta aberto; o admin cadastra os eventos iniciais (RF-ADM-04).
- Domínio `rolego.com.br` e a VPS Contabo já existem ([deploy](../deploy/README.md)).
- Google OAuth e Apple Sign-in precisam de contas de desenvolvedor configuradas.
- E-mail transacional: **Mailcow** numa VPS dedicada (`mail.rolego.com.br`) com SPF, DKIM, DMARC e PTR/rDNS configurados e o IP aquecido antes do beta aberto ([ADR-011](04-adrs.md#adr-011)).
- Observabilidade: stack Grafana self-hosted ([ADR-012](04-adrs.md#adr-012)).

## 10. Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Problema do ovo e da galinha (pouca oferta) | Alta | Alto | Curadoria pelo admin, onboarding de parceiros antes, foco numa cidade só |
| PWA no iOS com limitações (instalação, push) | Média | Médio | Sem push no Beta; guia de "Adicionar à tela inicial"; nativo planejado |
| Vazamento do endereço de evento privado | Baixa | Alto | Serializer por perfil de acesso + testes de contrato específicos ([09](09-estrategia-de-testes.md)) |
| E-mails do Mailcow caindo no spam (IP novo) | Média | Alto | SPF/DKIM/DMARC/PTR, aquecimento, verificação de blocklists, plano B com smarthost (SES/Brevo) sem mudar código |
| Geocodificação imprecisa (Nominatim) | Média | Médio | O organizador confere o endereço; adapter trocável por Google ([ADR-006](04-adrs.md#adr-006)) |
| Conteúdo impróprio | Média | Alto | Denúncia + remoção pelo admin + termos de uso |
| Sem venda in-app, o organizador perde o interesse | Média | Médio | Link externo de ingresso; dados de interesse como valor; E04 logo depois |

## 11. Perguntas em aberto

| # | Pergunta | Dono | Proposta padrão adotada nestes docs |
|---|---|---|---|
| Q1 | Match coletivo/amigos/chat entram no Beta? É o diferencial dos slides | Produto | **Não**: release 1.1 logo depois do beta fechado |
| Q2 | Mapa no Beta? | Produto | **Não** (risco de "virar Google", depende de E08/E09) |
| Q3 | Link externo de ingresso é permitido? | Produto/Comercial | **Sim**, opcional |
| Q4 | Presença visível por padrão? | Produto/Jurídico | **Sim**, com aviso claro no onboarding e toggle no perfil |
| Q5 | Telefone no cadastro? | Produto | **Não** (decisão do E01 já tomada) |
| Q6 | Lista de espera quando lota? | Produto | **Não** no Beta |
| Q7 | Moderação prévia de eventos (aprovação antes de publicar)? | Produto/Ops | **Não**: moderação posterior por denúncia + curadoria |

## 12. Critérios de lançamento

**Beta fechado** (convidados + parceiros, cerca de 100 pessoas):
- Todos os requisitos **M** implementados, com critérios de aceite passando nos e2e.
- Zero bug crítico ou alto em aberto; zero vazamento de endereço privado nos testes de contrato.
- Termos de Uso e Política de Privacidade publicados.
- Backup testado com restauração; dashboards e alertas do Grafana ativos; e-mails do Mailcow chegando na caixa de entrada (Gmail/Outlook/iCloud) com DKIM/DMARC `pass`.

**Beta aberto** (Curitiba):
- ≥ 50 eventos futuros publicados na cidade.
- Feedback do beta fechado triado; p95 do feed dentro do RNF-02.

## 13. Fora do Beta (próximas releases)

| Release | Conteúdo |
|---|---|
| 1.1 | Social: amigos, match coletivo, chat do evento, Modo Solo |
| 1.2 | E04 Ingressos e pagamento (Pix/cartão, QR, check-in) |
| 1.3 | E10 Push + E06 gamificação básica (selos pós-evento) |
| 2.x | E08 Ads/Mapa, E09 Premium, E05 Cardápio, E07 Influenciadores, E11 Reputação, app nativo |

Os documentos de arquitetura e modelo de dados já deixam **pontos de extensão** para essas releases, sem implementá-las.
