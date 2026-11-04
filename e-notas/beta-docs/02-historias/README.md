# Histórias de usuário e critérios de aceite — Notinhas Beta

Cada história segue o formato **Como / Quero / Para** e traz critérios de aceite em **Gherkin** (pt-BR). Esses cenários são a especificação viva de produto e a base para os testes ponta a ponta e unitários.

| Arquivo | Épico | Histórias |
|---|---|---|
| [E01-conta-deposito-vinculo.md](E01-conta-deposito-vinculo.md) | E01 — Conta, depósito NFC-e e vínculo EAN | US-01.01 → US-01.12 |
| [E02-descoberta-precos.md](E02-descoberta-precos.md) | E02 — Descoberta de preços e comparação | US-02.01 → US-02.07 |
| [E03-geo-ranking-vitrine.md](E03-geo-ranking-vitrine.md) | E03 — Geo, ranking e vitrine da loja | US-03.01 → US-03.06 |
| [E04-cesta-gestao-financeira.md](E04-cesta-gestao-financeira.md) | E04 — Cesta, split e gestão financeira | US-04.01 → US-04.06 |
| [ADM-backoffice.md](ADM-backoffice.md) | ADM — Backoffice e moderação mínima | US-ADM.01 → US-ADM.03 |

## Convenções

- **ID:** `US-<épico>.<nn>`, indexado aos requisitos de produto (`RF-*`).
- **Prioridade:** MoSCoW (M = Must, S = Should, C = Could, W = Won't no Beta).
- **Estimativa:** Pontos relativos Fibonacci (1, 2, 3, 5, 8). Histórias que excederem 8 pontos devem ser fatiadas.
- **Telas:** Identificadores padronizados das interfaces (`T-xx`), garantindo rastreabilidade do fluxo de usuário.
- **Definition of Ready (DoR):** História descrita com personas claras, critérios em Gherkin com múltiplos cenários (positivos, limites e falhas), contratos de API mapeados em [06-contratos-api.md](../06-contratos-api.md), modelo de dados previsto em [05-modelo-de-dados.md](../05-modelo-de-dados.md) e tela mapeada.
- **Definition of Done (DoD):** Cenários Gherkin automatizados ou validados em homologação, conformidade com a identidade visual Notinhas (`#0069B4` azul institucional e `#00984B` verde destaque de menor preço), migração idempotente de banco de dados e documentação atualizada no repositório.

## Mapeamento de Telas (T-xx)

| Código | Nome da Tela | Escopo Principal |
|---|---|---|
| `T-02` | Criar conta | Cadastro com e-mail, senha e aceite de termos |
| `T-03` | Entrar | Login por e-mail e senha com tratamento de bloqueio e rate-limit |
| `T-04` | Recuperar senha | Solicitação e redefinição de credenciais |
| `T-05` | Onboarding local | Permissão de geolocalização e seleção de cidade-base |
| `T-10` | Home destaques | Feed de menores preços e destaques de concorrência |
| `T-11` | Busca | Pesquisa por EAN textual, leitor de código de barras ou nome do produto |
| `T-12` | Comparação | Matriz comparativa de preços entre concorrentes para o mesmo item |
| `T-13` | Histórico | Linha temporal de preços observados por mercado e período |
| `T-14` | Detalhe produto | Ficha com foto representativa, especificações, menor preço e histórico |
| `T-20` | Scan QR live | Câmera ao vivo para leitura da URL da NFC-e |
| `T-21` | Scan QR foto | Captura de foto ou upload de imagem do QR Code da NFC-e |
| `T-22` | Nota ok | Confirmação de ingestão com resumo da empresa, data e itens importados |
| `T-23` | Vincular EAN | Modal/fluxo cooperativo para associar código de barras ao item da nota |
| `T-24` | Foto EAN | Galeria de candidatas para escolha da imagem do produto |
| `T-30` | Perto | Descoberta de itens e ofertas ordenadas por distância física |
| `T-31` | Ranking | Tabela comparativa de mercados no raio (mais baratos x mais caros) |
| `T-32` | Mapa | Visualização geográfica dos estabelecimentos físicos com pins e status |
| `T-33` | Vitrine | Catálogo em grade do sortimento de balcão do mercado (e-commerce sem checkout) |
| `T-40` | Cesta | Composição de lista de compras e cotação consolidada por loja |
| `T-41` | Split | Sugestão inteligente de divisão da compra entre múltiplos mercados |
| `T-50` | Extrato financeiro | Painel financeiro pessoal: extrato de notas, gasto mensal e lojas |
| `T-51` | Perfil | Dados do usuário, preferências de raio e opção LGPD de exclusão |
| `T-61` | Admin | Backoffice: fila de notas com falha, moderação de spam e métricas |

## Contexto Gherkin comum

```gherkin
# language: pt
Contexto:
  Dado que o relógio do sistema está em "2026-11-04 10:00" no fuso "America/Sao_Paulo"
  E a cidade base ativa é "Curitiba - PR" com centro em (-25.4284, -49.2733)
  E a base contém dados vigentes da SEFAZ Paraná para NFC-e
```
