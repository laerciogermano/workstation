-- Hello World: o console.log recebe a entrada `saudacao` (dado sólido) e não tem saída.
insert into flow.data_defs (project_id, name, type, value, position)
select distinct e.project_id, 'saudacao', 'texto', 'Hello, World!',
       coalesce((select max(position)+1 from flow.data_defs d where d.project_id = e.project_id), 0)
  from flow.elements e join flow.agents a on a.id = e.agent_id
 where a.name = 'node:console' and e.title = 'log' and e.code like '%Hello, World!%'
   and exists (select 1 from flow.element_ios o where o.element_id = e.id and o.direction = 'out' and o.name = 'saudacao')
on conflict (project_id, name) do update set value = coalesce(nullif(flow.data_defs.value, ''), excluded.value);

update flow.element_ios o set direction = 'in', ref = null
  from flow.elements e join flow.agents a on a.id = e.agent_id
 where o.element_id = e.id and o.direction = 'out' and o.name = 'saudacao'
   and a.name = 'node:console' and e.title = 'log' and e.code like '%Hello, World!%';

update flow.elements e set code = E'// Hello World · node:console\nconsole.log(entrada.saudacao);'
  from flow.agents a
 where a.id = e.agent_id and a.name = 'node:console' and e.title = 'log' and e.code like '%Hello, World!%';
