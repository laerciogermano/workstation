## Objetivo

Automatizar o **processo de cobrança** usando o **portal de envio de e-mail** ao cliente (franqueado / ConectMax), sem follow-up manual título a título.

## Contexto

Títulos em aberto / inadimplentes ficam em contas a receber. Hoje a cobrança depende de alguém abrir o portal, montar e disparar o e-mail. O portal já tem (ou deve expor) o fluxo de **envio de e-mail para o cliente** — a automação deve **reusar esse canal**, não inventar SMTP paralelo.

Card irmão (mais amplo, canal a definir): [Enviar cobrança automatizada](../../Priorizados/Enviar%20cobran%C3%A7a%20automatizada/descricao.md).

## Escopo (v1)

- Identificar títulos elegíveis (vencidos / a vencer em X dias) a partir do CR do portal
- Montar mensagem no template do portal (cliente, valor, vencimento, boleto/ref quando houver)
- Disparar o envio **pelo portal de e-mail** (mesma UI/API que o operador usaria)
- Registrar envio (quando, para quem, título) e respeitar cadência (ex.: D-3, D0, D+3, D+7)
- Parar a cadência quando o título quitar

## Aceite

- [ ] Cobrança elegível dispara e-mail pelo portal sem intervenção manual
- [ ] Título quitado não recebe novo e-mail de cobrança
- [ ] Não há disparo duplicado no mesmo passo da cadência
- [ ] Operador consegue ver fila enviada / pendente

## Fora de escopo

- WhatsApp / outros canais (ver card irmão)
- Negociação, acordo, protesto / jurídica
- Redesign do template de e-mail do portal (só preencher/usar o existente)
