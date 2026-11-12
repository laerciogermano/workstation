## Objetivo
Automatizar o envio de cobrança para títulos em aberto / inadimplentes (contas a receber), reduzindo follow-up manual e atrasando menos o caixa.

## Contexto
Hoje a venda faturada gera CR/boleto no portal franqueado; a inadimplência fica em contas a receber até quitar. A cobrança ainda é manual.

## Entrega (v1)
- Lista priorizada de títulos elegíveis (vencidos / a vencer em X dias)
- Mensagem padronizada (template) com valor, vencimento, cliente e link/ref do boleto quando houver
- Envio automatizado por canal definido (começar por 1 canal: WhatsApp ou e-mail)
- Registro do que foi enviado (quando, para quem, qual título) para não cobrar de novo no mesmo ciclo
- Regras simples de cadência (ex.: D-3, D0, D+3, D+7) e stop quando quitar

## Critérios de pronto
- Operador vê fila de cobranças a enviar / já enviadas
- Título quitado sai da cadência
- Não dispara cobrança duplicada no mesmo passo da cadência
- Template editável sem redeploy

## Fora de escopo (neste card)
- Negociação / acordo / renegociação
- Protesto / jurídica
- Integração bancária completa além do necessário para link/status do boleto
- Multi-canal avançado (vários canais + IA conversacional)

## Dependências / insumos
- Contas a receber (+ boletos) no portal / planilhas CR
- Contato do cliente (telefone e/ou e-mail)