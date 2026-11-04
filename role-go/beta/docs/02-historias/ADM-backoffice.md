# Backoffice mínimo (transversal)

| ID | História | RF | Prio | Pts | Telas |
|---|---|---|---|---|---|
| US-ADM.01 | Entrar como admin | RF-ADM-01 | M | 1 | T-60 |
| US-ADM.02 | Moderar denúncias | RF-ADM-02 | M | 3 | T-61 |
| US-ADM.03 | Bloquear usuário | RF-ADM-03 | M | 2 | T-62 |
| US-ADM.04 | Publicar em nome de parceiro | RF-ADM-04 | S | 3 | T-63 |

Rota `/admin`, visual desktop simples (tabela). O papel `admin` é atribuído só por seed/CLI (`npm run admin:grant -- email`).

```gherkin
Funcionalidade: Moderação

  Cenário: Remover evento denunciado
    Dado que o evento "Festa X" tem 3 denúncias abertas
    Quando abro a denúncia e toco em "Remover evento" com a nota "golpe"
    Então o evento vira REMOVED, sai da descoberta
    E as 3 denúncias ficam RESOLVED com a ação registrada em audit_log

  Cenário: Descartar
    Quando toco em "Descartar"
    Então a denúncia fica DISMISSED e o conteúdo continua no ar

  Cenário: Bloquear usuário
    Quando bloqueio "user@x.com" com motivo
    Então todos os refresh tokens dele são revogados e o `sub` entra na denylist (sai na hora, sem esperar o access token expirar)
    E os eventos futuros dele saem da descoberta (RN-10)

  Cenário: Publicar em nome de parceiro
    Quando crio o organizador "Club Central" com e-mail de contato
    E publico um evento com ele
    Então o evento aparece com o organizador "Club Central"
    E um convite "Assuma seu perfil no RoleGo" é enviado para o e-mail de contato
```

Toda ação de admin grava `audit_log(actorId, action, entity, entityId, payload, at)`.
