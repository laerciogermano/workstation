# ADM — Backoffice e moderação mínima

Objetivo: permitir que a equipe operacional monitore e reprocesse notas com falhas na consulta à SEFAZ, modere preços anômalos ou marcados como spam/inconsistentes e acompanhe os indicadores vitais de tração e qualidade do Notinhas Beta.

| ID | História | RF | Prio | Pts | Telas |
|---|---|---|---|---|---|
| US-ADM.01 | Fila e reprocessamento de notas com falha na ingestão | RF-ADM-01 | M | 3 | T-61 |
| US-ADM.02 | Ocultar observação ou preço classificado como spam / inconsistente | RF-ADM-02 | M | 2 | T-61 |
| US-ADM.03 | Painel de métricas operacionais e engajamento do Beta | RF-ADM-03 | S | 2 | T-61 |

Acesso restrito ao papel `admin` em rota `/admin` ou tela `T-61`. Toda ação administrativa registra log de auditoria na tabela `audit_log`.

---

## US-ADM.01 — Fila e reprocessamento de notas com falha na ingestão
**Como** operador do sistema Notinhas,  
**quero** visualizar uma fila de notas fiscais cuja importação falhou (timeout da SEFAZ, CAPTCHA temporário ou HTML alterado) e acionar o reprocessamento,  
**para** garantir que nenhuma contribuição de usuário seja perdida devido a instabilidades momentâneas da Fazenda.

**Regras de negócio:**
- As requisições de ingestão que recebem erro de rede, timeout (>10s) ou erro 5xx da SEFAZ são salvas na tabela `notas_falhas`.
- A tela de administração (`T-61`) exibe a lista de notas pendentes com: URL/chave, data da tentativa, código do erro e quantidade de tentativas.
- O operador pode disparar:
  - Reprocessamento individual ("Tentar novamente").
  - Reprocessamento em lote de todas as falhas das últimas 24 horas.
- Ao reprocessar com sucesso: a nota é transferida para as tabelas oficiais (`notas` e `itens`) e removida da fila de falhas.

```gherkin
# language: pt
Funcionalidade: Fila e reprocessamento de notas com falha

  Cenário: Reprocessamento de nota com falha pontual de conexão
    Dado que estou logado como administrador na tela "Admin" (T-61)
    E existe 1 nota com falha "SEFAZ_TIMEOUT" na fila de ingestão
    Quando clico no botão "Reprocessar" daquela nota
    Então o worker efetua nova chamada ao portal da Fazenda PR
    E o HTML da DANFE é parseado com sucesso
    E a nota e seus itens são persistidos nas tabelas oficiais
    E a nota é marcada como "RESOLVIDA" na fila de falhas

  Cenário: Falha persistente após 3 tentativas
    Dado que a SEFAZ continua fora do ar
    Quando aciono o reprocessamento da nota
    Então o contador de tentativas é incrementado para 4
    E a nota permanece na fila com status "FALHA_PERSISTENTE"
```

---

## US-ADM.02 — Ocultar observação ou preço classificado como spam / inconsistente
**Como** moderador do catálogo,  
**quero** ocultar um registro de item ou observação de preço anômala (ex.: erro de cadastro da loja, digitação absurda ou vínculo de EAN errado),  
**para** proteger a integridade do índice de preços e evitar que valores irreais distorçam as comparações e os rankings.

**Regras de negócio:**
- O administrador pode buscar uma observação de preço por `item_id`, `ean` ou estabelecimento na tela `T-61`.
- Ação de moderação: "Ocultar observação".
- A exclusão física não é realizada para fins de preservação contábil da nota; em vez disso, aplica-se a flag `status = 'oculto'` (ou `moderado = true`) na tabela `itens` ou `codigos_barras`.
- O item ocultado é imediatamente expurgado:
  - Do cálculo do menor preço na Home (`T-10`).
  - Da comparação de lojas (`T-12`).
  - Do cálculo de score do ranking de lojas (`T-31`).
  - Da tabela de cache de destaques (`destaques_cache`).
- Exige justificativa textual obrigatória no formulário e gera registro em `audit_log`.

```gherkin
# language: pt
Funcionalidade: Ocultar observação de preço spam ou inconsistente

  Cenário: Ocultação de preço anômalo de R$ 0,01 decorrente de erro do caixa
    Dado que um item "Cerveja Heineken 350ml" foi registrado por "R$ 0,01" no mercado X
    Quando o administrador abre a tela "Admin" (T-61) e busca pelo item
    E seleciona "Ocultar observação" preenchendo a justificativa "Preço anômalo / erro de PDV"
    Então o item tem seu status atualizado para "oculto"
    E a observação deixa de aparecer na tela de comparação (T-12)
    E a ação é gravada no log de auditoria com ID do admin e data/hora
```

---

## US-ADM.03 — Painel de métricas operacionais e engajamento do Beta
**Como** gestor do produto Notinhas,  
**quero** acompanhar os indicadores vitais de desempenho, volume de notas e engajamento comunitário em tempo real,  
**para** avaliar o sucesso do Beta e direcionar os esforços de cobertura de lojas na cidade.

**Regras de negócio:**
- Painel de métricas na tela `T-61`.
- Indicadores exibidos:
  - Total de notas fiscais depositadas (geral e nas últimas 24h).
  - Total de estabelecimentos cadastrados e geocodificados.
  - Total de itens indexados e percentual de itens com vínculo EAN confirmado (taxa de cobertura EAN).
  - Usuários cadastrados e usuários ativos na semana (WAU).
  - Taxa de sucesso na ingestão da SEFAZ PR (alvo: ≥98%).
  - Volume de buscas realizadas e cotações de cestas geradas.

```gherkin
# language: pt
Funcionalidade: Painel de métricas operacionais do Beta

  Cenário: Consulta dos indicadores do sistema pelo administrador
    Dado que estou autenticado com credenciais de administrador
    Quando acesso o painel de métricas na tela "Admin" (T-61)
    Então visualizo os cards com total de 1.450 notas depositadas
    E vejo a taxa de cobertura de EAN em 68% dos itens
    E vejo 84 estabelecimentos mapeados em Curitiba
    E o indicador de disponibilidade do parser da SEFAZ em 99,2%
```
