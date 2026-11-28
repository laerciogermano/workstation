# Clozzy — Telas

Fonte: [visão](../README.md) · [épicos](epics.md) · [protótipo v2](prototipo-v2/README.md)  
Regra: rede primeiro; exclusivo no privado; área pública sem +18.

---

## TELA-01 — Reels

- Feed vertical na entrada (sem login)
- Sessão por fingerprint
- Curtir, comentar, salvar
- Abrir perfil a partir do reel
- Publicar clip (corte, capa, legenda)
- Sem +18

## TELA-02 — MMTV

- Canal / grade contínua (sem login)
- Entrar e sair do canal
- Abrir perfil de quem aparece
- Sem +18
- Ordem home vs Reels configurável

## TELA-03 — Age gate 18+

- Confirmar 18+ ou sair
- Uma vez por aparelho

## TELA-04 — Explorar

- Grade de perfis (presença, sem preço na capa)
- Filtro por categoria
- Abrir perfil
- Sem ranking de vendas

## TELA-05 — Busca

- Busca por nome / @
- Recentes no aparelho
- Limite progressivo até enriquecer conta

## TELA-06 — Perfil

- Foto, capa, nome, @, bio, links
- Público / privado
- Prévia pública; trancado sem entregar pago
- Seguir / deixar de seguir
- Entrar no close sem preço na capa
- Compartilhar link
- Sem packs na capa; sem +18

## TELA-07 — Quem visualizou

- Lista de visualizações do perfil
- Pode pedir mais dados da conta

## TELA-08 — Pedidos de seguir

- Aceitar / recusar pedido
- Pedir seguir de volta

## TELA-09 — Close friends / listas

- Criar e editar círculos / listas
- Incluir quem segue e foi aceito
- Remover membro

## TELA-10 — Stories

- Publicar e ver story
- Reagir; destaques
- Público vs close / lista

## TELA-11 — Conversas

- Lista de DMs e não lidas
- Pedido de mensagem entre desconhecidos
- Abrir conversa

## TELA-12 — Conversa 1:1

- Texto e foto
- Foto temporária
- Bloquear / denunciar
- Convite para ligação
- Oferta de exclusivo no fio (sem cartaz)

## TELA-13 — Bate-papo (salas)

- Salas por categoria
- Entrar na sala

## TELA-14 — Sala

- Mensagens da sala
- Sair
- Moderação básica
- Abrir perfil / pedir DM

## TELA-15 — Roleta

- Parear com desconhecido
- Aceitar / pular / encerrar
- Denunciar / bloquear
- Caminho opcional para DM

## TELA-16 — Ligação / videochamada

- Convite 1:1 com consentimento
- Áudio e vídeo; encerrar
- Denunciar

## TELA-17 — Oferta no privado

- Close / pack / item com preço
- Preview sem entregar o pago
- CTA pagar

## TELA-18 — Checkout / Pix

- Resumo da oferta
- Pix (QR / copia-cola) com status
- Sem cobrança duplicada
- Liberado → biblioteca / conteúdo
- Expirado: novo código, nada cobrado

## TELA-19 — Conteúdo

- Viewer do liberado
- Lista dos itens do pack / close

## TELA-20 — Biblioteca

- Close / packs / itens
- Status: ativa / expirada / cancelada
- Abrir, renovar, recomprar

## TELA-21 — Passe do close

- Próxima cobrança
- Cancelar mantém acesso até o fim do período

## TELA-22 — Conta

- Dados e identidade progressiva
- Preferências de notificação
- Sair / desativar / excluir
- Atalho quero vender

## TELA-23 — Identidade / login

- Cadastro progressivo
- Login / recuperação / código
- Aceite Termos + Privacidade (versão + data)
- Vincular histórico da sessão à conta

## TELA-24 — Avisos

- Mensagem, aceite, close, pagamento, vencimento, saque
- Preferências por tipo
- Sem preço/mídia na tela bloqueada

## TELA-25 — Ajuda / legal

- Termos, privacidade, cookies, 18+, FAQ, contato
- LGPD (acesso, correção, exclusão)
- DMCA

## TELA-26 — Denunciar / bloquear

- Denúncia (perfil, conteúdo, mensagem, sala, roleta)
- Bloquear / restringir / silenciar

## TELA-27 — Onboarding criador

- Dados mínimos + verificação
- Chave Pix
- Aceite termos de criador
- Status: análise → ativa

## TELA-28 — Studio

- Resumo: saldo, vendas, membros
- Editar perfil
- Ofertas e conteúdos (prévia / close / pago)
- Círculos / listas; remover membro
- Extrato e saque Pix

## Landing

- Headline de rede / presença
- CTA explorar / criar presença
- Lista de espera sem preço na capa
- Links legais

---

## Rollback

```bash
git checkout -- clozzy/docs/screens.md
```
