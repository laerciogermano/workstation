---
source_url: https://www.postgresql.org/docs/current/ddl-schemas.html
docs_version: PostgreSQL 18 (current)
---

# 5.10. Schemas

A database contains one or more named schemas, which in turn contain tables. Schemas also contain other kinds of named objects, including data types, functions, and operators. Within one schema, two objects of the same type cannot have the same name. Furthermore, tables, sequences, indexes, views, materialized views, and foreign tables share the same namespace, so that, for example, an index and a table must have different names if they are in the same schema. The same object name can be used in different schemas without conflict.

To create a schema:

```sql
CREATE SCHEMA myschema;
```

Qualified name:

```sql
schema.table
```

Schema names beginning with `pg_` are reserved for system purposes and cannot be created by users.

Tables are often referred to by unqualified names. The system determines which table is meant by following a search path. The first matching table in the search path is taken to be the one wanted.

Tip from Table Basics (related): When you create many interrelated tables it is wise to choose a consistent naming pattern for the tables and columns. For instance, there is a choice of using singular or plural nouns for table names.
