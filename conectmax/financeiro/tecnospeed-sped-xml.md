# TecnoSpeed — SPED XML (PlugDFe)

**Fonte:** [tecnospeed.com.br/plugdfe/sped-xml](https://tecnospeed.com.br/plugdfe/sped-xml/)  
**Capturado:** 2026-11-17  
**Para quem:** software houses / ERPs que precisam entregar SPED sem virar especialista tributário.

## O que é

Módulo da TecnoSpeed (família **PlugDFe**, integrado ao **PlugStorage**) que **gera SPED Fiscal e Contribuições a partir dos XMLs** das notas emitidas e recebidas.

Em vez do ERP montar à mão centenas de registros/campos do SPED, o fluxo típico é:

1. Guardar XMLs no PlugStorage (ou enviar via API)
2. A TecnoSpeed interpreta os XMLs
3. Devolve **blocos fiscais** prontos para integrar no ERP / entregar à Receita

**Não é** emissor de NF-e nem gerador de boleto. É a camada de **escrituração digital (SPED)** em cima dos XMLs já existentes.

## Problema que resolve

Gerar SPED exige contabilidade + apuração (ICMS, IPI, PIS, Cofins) + milhares de regras. Erro no arquivo vira problema fiscal do cliente final. O módulo assume interpretação + geração + validações; o software house foca no ERP.

## O que entrega (claims do site)

| Recurso | Detalhe |
|---------|---------|
| API REST | Integração HTTP em qualquer linguagem |
| Geração automática | Blocos SPED a partir dos XMLs no PlugStorage |
| Apuração | ICMS, IPI, PIS e Cofins |
| Validações | +25k regras na geração |
| Rotas auxiliares | Blocos H e K; notas de entrada; registro 1601 (pagamentos eletrônicos); LMC; DePara configurável |
| PlugStorage | Armazenamento de XMLs + consulta de notas destinadas |
| Suporte | Dev para dev |
| Webhooks | Citado nas FAQs do produto (confirmar na doc técnica na integração) |

## O que não cobre sozinho

- Complementos além dos XMLs ainda podem ser necessários (cadastros, inventário, parâmetros — ver FAQ 2 no site)
- **Boleto / cobrança bancária** → produto TecnoSpeed **PlugBank**, não este módulo
- Emissão de DF-e em si → outras peças PlugDFe / stack fiscal do ERP

## Posição na ConectMax

No portal franqueado já existem **Notas fiscais** (PDF/XML) e **Contas a receber → Gerar boleto**. Este doc registra o SPED XML como opção de **terceirizar a geração do arquivo SPED** se/quando o ERP Conect precisar de conformidade SPED sem implementar as regras internamente.

Relacionados:

- Portal NF / CR / boleto: [`../connectmax/docs/portal-franqueado.md`](../connectmax/docs/portal-franqueado.md)
- Mapa Contas a receber: [`../connectmax/docs/portal-mapa/README.md`](../connectmax/docs/portal-mapa/README.md)
- Extratos Inter: [`../extratos/README.md`](../extratos/README.md)

## Contato comercial (site)

- Comercial: comercial@tecnospeed.com.br  
- Atendimento: atendimento@tecnospeed.com.br  
- Tel: 0800 006 9500  
- Lead: formulário na landing (retorno em até 24h úteis)  
- CNPJ TecnoSpeed: 08.187.168/0001-60 · Maringá–PR

## Outros produtos TecnoSpeed (contexto)

PlugBank · PlugDFe · PlugSign · TecnoSign · Plug4Market · Wifire · Decision IT
