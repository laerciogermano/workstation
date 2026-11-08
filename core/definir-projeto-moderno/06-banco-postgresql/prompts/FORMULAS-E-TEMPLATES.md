# Fórmulas e templates — definir schema PostgreSQL

Anexar [`../POSTGRES.md`](../POSTGRES.md) + skill [`../skills/database-schema-designer-onewave/SKILL.md`](../skills/database-schema-designer-onewave/SKILL.md).

## 1. Greenfield (schema completo)

```text
Desenhe o schema PostgreSQL deste produto seguindo POSTGRES.md e a skill database-schema-designer.

Colete só o que bloquear: entidades/relações, 5–10 queries (filtros + ORDER BY), volume, tenancy, ferramenta de migração/ORM.

Defaults: bigint identity interno; uuidv7 para IDs públicos; text; timestamptz; numeric para dinheiro; NOT NULL/UNIQUE/CHECK/FK com ON DELETE explícito; índice em todo FK; índices derivados das queries; updated_at com trigger ou hook do ORM.

Entregue: (1) modelo + cardinalidade, (2) DDL ou schema ORM, (3) racional de índices, (4) migração up/down ou forward-fix, (5) RLS se multi-tenant, (6) checklist marcado.
```

## 2. Feature / recurso novo

```text
Estenda o schema existente para {{recurso}}. Não quebre deploys: expand → backfill/dual-write → contract. Não use RENAME/DROP/NOT NULL em um único passo em tabela com tráfego. CREATE INDEX CONCURRENTLY e ADD CONSTRAINT … NOT VALID + VALIDATE quando a tabela for grande. Liste locks esperados.
```

## 3. Setup Cursor (boilerprompt)

```text
Design a Postgres schema for {{resource}} in this project and write it as versioned migrations using the migration tool already present, or add a lightweight one and note why you chose it. Use bigint identity primary keys, timestamptz created_at and updated_at with a trigger or ORM hook keeping updated_at current, NOT NULL plus CHECK constraints where the domain demands them, and foreign keys with an explicit ON DELETE choice per relationship rather than a blanket CASCADE. Add unique indexes for natural keys and partial indexes for common filtered queries, for example WHERE deleted_at IS NULL if soft deletes are used. Generate both up and down migrations, apply them to a local database, run the rollback once to prove the down path works, then print the final schema for each table.
```

Fonte: https://boilerprompt.dev/cursor/set-up-a-postgres-database-schema

## 4. Loop Cursor em estágios (Plan → Agent)

1. Plan Mode → `docs/data-model.md` (sem código)  
2. Agent → schema ORM + migration  
3. Testes que inserem linha proibida e esperam rejeição do banco  
4. EXPLAIN nas queries do modelo  
5. Mudanças breaking = expand/contract  

Fonte: https://developertoolkit.ai/en/cursor-ide/plan/database-design/

## 5. Multi-tenant + RLS

```text
Modele multi-tenant shared-schema: tenant_id NOT NULL em toda tabela de tenant; unique/FK compostos (tenant_id, id); índices com tenant_id à esquerda; ENABLE + FORCE ROW LEVEL SECURITY; policies com USING e WITH CHECK; app role não-owner; set_config('app.current_tenant', $1, true) dentro da transação (SET LOCAL). App continua filtrando por tenant_id.
```

## 6. Review / auditoria

```text
Audite este schema/migração como db-guardian: classifique must-fix / should-refactor / style. Verifique tipos, FKs sem índice, locks de DDL, soft delete + unique parcial, JSONB indevido, RLS, pooling. Cite arquivo:linha e seção do guia.
```

## Supabase

Usar arquivos em [`supabase/`](supabase/): `code-format-sql`, `database-create-migration`, `database-rls-policies`, `declarative-database-schema`, `database-functions`.
