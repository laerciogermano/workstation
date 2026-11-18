-- Rollback da 001_init (apaga TODOS os dados do Flow.dev). Uso: npm run db:migrate -- down
drop schema if exists flow cascade;
