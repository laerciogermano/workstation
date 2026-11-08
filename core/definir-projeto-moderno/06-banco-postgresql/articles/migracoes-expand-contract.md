# Estratégias de migração (expand/contract)

**Fonte:** https://www.prisma.io/dataguide/types/relational/migration-strategies

## Desafios

- Migrar dados existentes (transformações, tempo)
- Reversibilidade → preferir **roll forward**
- Testar com dados reais / edge constraints
- Performance e disponibilidade em produção

## Estratégias (resumo)

| Estratégia | Uso |
|---|---|
| Maintenance window | Simples; custo = downtime |
| Blue/green | Bom para app; schema exige expand/contract |
| Feature flags | Desacopla deploy de ativação; dual path de schema |
| Canary | Valida com fatia de tráfego |
| **Expand and contract** | Melhor para mudança breaking sem downtime |

## Expand and contract (passos)

1. Deploy schema novo **ao lado** do antigo  
2. App escreve nos dois  
3. Backfill do histórico  
4. Testar  
5. App lê do novo  
6. Parar escrita no antigo  
7. Remover schema antigo  

Combinar com feature flags para gates de read/write.

## Relação com este pacote

Skills: `database-migrations-*`, `db-weapon`, prompts §2–3 em [`../prompts/FORMULAS-E-TEMPLATES.md`](../prompts/FORMULAS-E-TEMPLATES.md).
