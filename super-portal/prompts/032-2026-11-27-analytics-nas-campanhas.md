# 032 — Analytics nas campanhas

| Campo | Valor |
|-------|--------|
| Número | 032 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Rastreio de abertura e clique no E14 |

## Prompt original

```
em campanhas do portal super deve ter track de analytics tbm pra saber se abriram
```

Em seguida, texto colado como referência:

```
Se é só saber se abriu (e talvez clique), não precisa de plataforma de e-mail marketing completa.

Com o envio já no teu sistema, o caminho mais simples é o pixel na própria API — pouca coisa, sem migrar campanhas/listas.

Plataforma externa só vale se você passar o envio por ela (Resend, SES, etc.) e consumir o webhook de open. Só para “abriu?” costuma ser overkill.

Resumo: para esse escopo, desenvolver o tracking no email-marketing é o mais direto.


Sim. Em geral caem em 3 tipos:

1. Provedor de envio com tracking embutido
Resend, Postmark, SendGrid, Amazon SES (+ configuração), Mailgun, Brevo
→ enviam por eles e já dão open/click/bounce no painel ou via webhook.

2. Plataforma de e-mail marketing
Mailchimp, Brevo, Klaviyo, ActiveCampaign
→ campanha + lista + relatório de quem abriu/clicou (produto completo).

3. Só analytics em cima do teu envio
Menos comum “só pixel SaaS” sem enviar por eles. O usual é: ou você manda pela ferramenta, ou você mesmo coloca o pixel.

Para o teu caso (já envia no ConnectMax e só quer saber se abriu): ferramenta externa só de track quase sempre exige mandar o e-mail por ela. Sem isso, o caminho é o pixel no teu sistema.


Google Analytics / GA4 no e-mail HTML: não de forma útil.

E-mail não roda JavaScript. Tags gtag, GTM, pixel do GA não executam no Gmail, Outlook, etc.

O que dá para fazer:

Técnica    O que mede
Pixel de abertura (img 1×1 no teu servidor)
Abriu (aproximado)
Links com UTM (?utm_source=email&utm_campaign=...)
Clique → visita no site no GA
Redirect de clique (/t/c/token → URL)
Quem clicou, no teu sistema
Resumo: analytics “de verdade” no e-mail = pixel + links rastreados. O GA entra depois do clique, na landing page — não na abertura do e-mail.


Sim — para abertura, a imagem 1×1 (pixel) é o padrão.

Complementos úteis:

clique → links rastreados (mais confiável que abertura)
UTM → se quiser ver no GA o que aconteceu no site depois do clique
Abertura = pixel. Clique = link.


Não. No email-marketing não está configurado.

Abertura/clique está explícito como fora do escopo v1 — não há rota /t/o, nem pixel no HTML, nem tabela de opens.
```

Depois:

```
nao crie agora, mas ajuste no epico
```

## Interpretação

Registrar no E14 o rastreio de abertura e clique, sem criar a funcionalidade agora.

## O que foi feito

- [`docs/epics.md`](../docs/epics.md): E14 ganha abertura e clique por destinatário, pixel 1×1, link rastreado, UTM e os limites de cada medida.
- [`prototipo/js/epicos.js`](../prototipo/js/epicos.js): mesma lista do E14.
- Telas e modelagem sem mudança.
