### 1. laerciogermano — 2026-11-01T13:24:56.268Z

Benchmarking executado (2026-11-01) — soluções similares ao notinhas.org / e-notas.

Ranking (prioridade de olhar):
1. Busca Preço — https://buscapreco.net/ (QR → histórico EAN → compare; freemium; MG/SP/RJ)
2. Menor Preço · Nota Paraná — https://menorpreco.notaparana.pr.gov.br/ (base SEFAZ-PR; rival oficial no PR)
3. Mercado Certo — https://mercadocerto.app.br/ (cesta + data/fonte + missões)
4. Nota Preço — https://notapreco.com.br/ (híbrido encarte+NFC-e; UX estratégia RJ)
5. GoMarket — https://gomarket.app.br/ (moedas/cashback ao contribuinte; lançamento)
6. PoupApp — https://poupapp.app.br/ (PWA + IPC; 100% grátis)
7. Menor Preço Brasil (Procergs) — app gov multi-UF (PR usa Nota Paraná)

Aprendizados-chave:
• No PR o gov já cobre “menor preço por NFC-e” — diferencial = UX, histórico, EAN claro, contribuição web
• Cold start exige incentivo ao contribuinte (ranking/moedas) antes de cesta complexa
• Sempre loja+data; “sem preço” > inventar
• Cesta/split = estágio 2; v1 item/EAN ok
• Híbrido encarte foge do princípio “dado da nota”

Anexo: 00-curadoria.html / 00-curadoria.pdf · pasta e-notas/marca/benchmarking-solucoes/

### 2. laerciogermano — 2026-11-01T13:31:38.328Z

Requisitos de produto acrescentados na descrição do card:

• Comparação de preços (EAN entre estabelecimentos)
• Histórico de preços (produto × mercado ao longo do tempo)
• Montagem apartada (cesta + divisão 2+ lojas p/ reduzir custo)
• Integrações via API para empresas (B2B)

Espelho canônico: e-notas/docs/requisitos.md → REQ-012

### 3. laerciogermano — 2026-11-01T13:35:19.177Z

PRD + benchmarking v3 atualizados.

Novos eixos no PRD / matriz:
• Tela da loja (vitrine e-commerce read-only)
• Busca geo — item → lojas físicas perto (GPS ou região, ex. centro)

Os 6 requisitos agora:
1. Comparação de preços
2. Histórico
3. Montagem apartada
4. Vitrine da loja
5. Busca geo / onde comprar perto
6. API empresas

Arquivos: e-notas/docs/prd.md · marca/benchmarking-solucoes/ · REQ-014
Anexos: 00-curadoria.html/pdf + prd.md

### 4. laerciogermano — 2026-11-01T13:36:49.187Z

PRD: acrescentado §4.7 Sistema de delivery (*future*) — pedido + entrega após vitrine/API/parceria com lojas; fora da v1.
