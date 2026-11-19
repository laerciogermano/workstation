-- Responsável = arquivo | lib | pessoa | agente | modelo.
-- Arquivo (módulo) e modelo são referências virtuais: "file:<public_id>" / "md:<public_id>" (agent_id fica nulo).
alter table flow.elements
  add column if not exists agent_ref text check (agent_ref ~ '^(file|md):[0-9a-f-]{36}$'),
  add column if not exists resp_ref  text check (resp_ref  ~ '^(file|md):[0-9a-f-]{36}$');
