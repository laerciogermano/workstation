# Clozzy — Épicos (bullets)

**Fonte:** [documento de visão](../../../attachments/d76dc6cb-c71e-4199-99fb-3b32ec3e2ec2/output/documento-de-visao.md) (transcrição).  
**Por quê:** recortar a visão em blocos de valor antes das histórias.  
**Regra de capa:** rede primeiro; exclusivo no privado; área pública sem +18.

20 épicos · ordem = prioridade de entrega

---

## EP-01 — Fundação da plataforma

**Valor:** ter onde publicar, medir e voltar atrás.

- Repositórios, ambientes (dev / homolog / prod) e pipeline
- Armazenamento privado de mídia + entrega por link assinado
- Tokens / componentes da identidade
- Monitoramento, logs, backup e caminho de rollback
- Decidir o que reaproveitar do código anterior

**Pronto quando:** commit chega a produção com teste, monitoramento e rollback.

---

## EP-02 — Sessão implícita e conta progressiva

**Valor:** ver de cara; identidade completa só quando o uso pedir.

- Abrir o site e ver conteúdo sem cadastro formal
- Fingerprint (ou ID de dispositivo) cria sessão persistente / conta implícita
- Cadastro progressivo (e-mail, telefone, sexo, identidade…) conforme o uso
- Vincular o histórico da sessão à conta ao completar identidade
- Login / recuperação quando já houver vínculo
- Configurações, sair, desativar e excluir

**Pronto quando:** visitante vê reels/MMTV sem login e, ao cadastrar, não perde o que já fez.

---

## EP-03 — Área pública limpa e idade

**Valor:** superfície pública adulta sem +18; só 18+ no produto.

- Proibir +18 em reels, MMTV, explorar e perfil público
- Aferição de idade alinhada ao jurídico (autodeclaração não basta como única barreira)
- Remoção / bloqueio de menor
- Aviso 18+ onde couber

**Pronto quando:** conteúdo +18 não aparece na área pública e conta de menor não permanece.

---

## EP-04 — Confiança, segurança e moderação

**Valor:** conhecer gente sem ficar exposto.

- Bloquear, restringir, silenciar
- Denúncia de perfil, conteúdo e mensagem + fila
- Protocolo para imagem íntima sem consentimento / deepfake
- Limites contra spam, assédio e contas falsas
- DMCA / direitos autorais

**Pronto quando:** toda denúncia vira caso com responsável, prazo e resultado.

---

## EP-05 — Legal, privacidade e ajuda

**Valor:** regras claras e aceite rastreável.

- Termos de uso, privacidade, cookies
- LGPD: acesso, correção, exclusão
- FAQ e contato
- Registro de versão e data de cada aceite

**Pronto quando:** cada aceite fica com versão e data.

---

## EP-06 — Reels (presença de cara)

**Valor:** entrar e rolar presença vertical (espírito TikTok / IG Reels).

- Feed vertical na entrada (sem +18)
- Publicar clip / foto / vídeo com corte, capa e legenda
- Curtir, comentar, salvar
- Levar do reel ao perfil

**Pronto quando:** pessoa chega pelo link, rola reels sem login e abre um perfil.

---

## EP-07 — MMTV (presença contínua)

**Valor:** canal / TV de presença contínua ao lado dos reels.

- Grade ou canal ao vivo / contínuo (sem +18)
- Entrada e saída do canal
- Relação com perfil de quem aparece
- Ordem home (MMTV vs Reels) configurável — os dois são carro-forte

**Pronto quando:** dá para acompanhar presença contínua sem login formal.

---

## EP-08 — Perfil e presença

**Valor:** ser visto como pessoa (atenção), não como loja.

- Foto, capa, nome, @, bio, links
- Perfil público e privado
- Quem visualizou
- Prévia pública; itens trancados sem entregar o pago
- “Entrar no close” sem preço na capa do perfil público
- Compartilhar link do perfil

**Pronto quando:** perfil de atenção cresce público sem obrigação de chat ou venda.

---

## EP-09 — Explorar e busca

**Valor:** encontrar gente além da bolha.

- Explorar perfis / conteúdo
- Busca por nome e @
- Limites progressivos até a conta enriquecer (se a visão pedir)
- Sem “preço a partir de” e sem ranking de vendas na superfície

**Pronto quando:** conta nova acha desconhecido e abre o perfil sem ter rede prévia.

---

## EP-10 — Seguir, close friends e listas

**Valor:** grafo social com controle (público vs privado).

- Seguir / deixar de seguir
- Perfil privado exige aceite
- Pedir seguir de volta
- Close friends / círculos
- Listas / grupos de transmissão; influenciador pode incluir quem segue e foi aceito

**Pronto quando:** seguir em privado exige aceite e listas / close friends funcionam.

---

## EP-11 — Conversas privadas e mídia leve

**Valor:** relacionamento 1:1 no mesmo produto (DM · Snap-like).

- DM texto e foto
- Foto temporária
- Stories: publicar, ver, reagir; prazo e destaques
- Pedido de mensagem / aceite entre desconhecidos
- Bloquear e denunciar de dentro da conversa
- Quem só quer atenção não é forçado a chat

**Pronto quando:** dois desconhecidos conversam após aceite e podem usar mídia leve.

---

## EP-12 — Bate-papo (salas por categoria)

**Valor:** conhecer gente por tema (espírito Bate-papo UOL).

- Salas por categoria
- Entrar, conversar, sair
- Moderação básica da sala
- Caminho da sala → perfil / DM

**Pronto quando:** pessoa entra numa sala por tema e conversa sem já ter rede.

---

## EP-13 — Roleta / conhecer ao vivo

**Valor:** encontro com desconhecidos ao vivo (espírito OmeTV).

- Parear com desconhecido
- Aceitar / pular / encerrar
- Proteções (denúncia, bloqueio, idade)
- Opcional: caminho para DM se ambos quiserem

**Pronto quando:** dá para conhecer alguém ao vivo e sair a qualquer momento.

---

## EP-14 — Ligação e videochamada

**Valor:** passar da mensagem para a chamada.

- Convite 1:1 com consentimento dos dois
- Áudio e vídeo; encerrar
- Denúncia / limites anti-gravação no que a web permitir
- (Onda seguinte) chamada paga no close, se fizer sentido

**Pronto quando:** chamada marcada acontece no Clozzy, sem link externo.

---

## EP-15 — Exclusivo (close, pack, bloqueio)

**Valor:** venda existe e libera no privado — sem a capa gritar marketplace.

- Ativar modo criador / vender
- Conteúdo bloqueado; preview sem entregar o pago
- Close, pack e item avulso com preço e regra
- Oferta no privado (chat / círculo), não no cartaz público
- Consentimento / autoria no envio

**Pronto quando:** exclusivo vende e libera no privado; capa pública não parece loja de packs.

---

## EP-16 — Pagamento e liberação

**Valor:** pagar e abrir no mesmo fio.

- Checkout (Pix na v1; cartão depois)
- Confirmação automática; sem cobrança duplicada
- Liberação imediata do direito de acesso
- Estorno / contestação com registro
- Nome discreto na fatura

**Pronto quando:** Pix confirmado libera o acesso sozinho.

---

## EP-17 — Biblioteca e acesso

**Valor:** saber o que pode ver e até quando.

- Direito por compra ou close ativo
- Biblioteca: ativo, vencido, cancelado
- Cancelar mantém acesso até o fim do período
- Avisos de vencimento / renovação

**Pronto quando:** status na biblioteca bate com o pagamento.

---

## EP-18 — Studio do criador e carteira

**Valor:** publicar, precificar, ver vendas e sacar.

- Painel: saldo, vendas, membros, atalhos
- Gerir círculos / listas, ofertas e conteúdo
- Extrato (bruto, taxa, líquido)
- Saque Pix do mesmo titular
- Remover / bloquear membro

**Pronto quando:** criador responde quanto vendeu, para quem e quanto pode sacar.

---

## EP-19 — Notificações

**Valor:** saber o que aconteceu sem expor preço/mídia na tela bloqueada.

- Central no app + e-mail dos eventos críticos
- Eventos: mensagem, aceite, conteúdo no close, pagamento, vencimento, saque
- Preferências por tipo
- Push web depois

**Pronto quando:** eventos de conversa e compra chegam e podem ser desligados (quando não obrigatórios).

---

## EP-20 — Lançamento, backoffice e aquisição

**Valor:** operar e trazer as primeiras pessoas.

- Landing / lista de espera sem preço na capa
- Convite de criadores e medição de origem → ativação
- Filas: verificação, moderação, saque, estorno
- Contas: buscar, suspender, reativar + auditoria
- (Depois) indicação / assessoria / nível do criador

**Pronto quando:** dá para operar sem mexer no banco e ver de onde veio cada cadastro.

---

## Ordem sugerida (ondas)

1. EP-01 → EP-02 → EP-03 → EP-05  
2. EP-06 → EP-07 → EP-08 → EP-09 → EP-10  
3. EP-04 (cresce junto) → EP-11 → EP-12  
4. EP-15 → EP-16 → EP-17 → EP-18  
5. EP-13 → EP-14 → EP-19 → EP-20  

---

## Fora da v1 (visão)

- App nativo
- Marketplace de produto físico
- Vitrine pública centrada em catálogo de packs
- Moderação / compliance de todas as jurisdições no dia um

---

## Cobertura dos critérios de sucesso da visão

| Critério | Épicos |
|----------|--------|
| Ver reels/MMTV sem login + fingerprint | EP-02, EP-06, EP-07 |
| Atenção sem obrigação de chat/venda | EP-06, EP-08, EP-10 |
| Relacionamento (DM + salas + mídia + chamada) | EP-11, EP-12, EP-13, EP-14 |
| Seguir privado + close friends / listas | EP-10 |
| Exclusivo no privado, capa sem loja | EP-15, EP-16, EP-17, EP-18 |
| Histórico da sessão vinculado à conta | EP-02 |
| Área pública sem +18 | EP-03, EP-06, EP-07, EP-08, EP-09 |

---

## Antes → depois

| Antes (`docs/epics.md` antigo) | Depois (este anexo) |
|--------------------------------|---------------------|
| Close / venda como eixo forte da R1 | Rede (reels/MMTV/seguir) primeiro; exclusivo secundário |
| Conta = cadastro formal de cara | Fingerprint + conta progressiva |
| Chat em grupo / lista fora | Bate-papo por salas e listas / close friends dentro |
| Sem roleta | Roleta (OmeTV) como épico |
| Feed/stories adiados | Reels e stories no núcleo de presença / relacionamento |

## Rollback

Remover este anexo; manter `clozzy/docs/epics.md` antigo até republicar.
