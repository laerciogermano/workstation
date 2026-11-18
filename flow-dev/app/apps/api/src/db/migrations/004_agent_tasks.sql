-- Tasks obrigatórias do responsável (lib Node = métodos).
alter table flow.agents
  add column if not exists tasks text[] not null default '{}';

-- Libs Node conhecidas: cadastra os métodos.
update flow.agents set tasks = array['get','post','request','createServer','put','patch','delete','head']
  where kind = 'maquina' and name = 'node:http' and cardinality(tasks) = 0;
update flow.agents set tasks = array['readFile','writeFile','copyFile','mkdir','readdir','unlink','rename','appendFile','stat']
  where kind = 'maquina' and name = 'node:fs' and cardinality(tasks) = 0;
update flow.agents set tasks = array['join','resolve','basename','dirname','extname','parse','format']
  where kind = 'maquina' and name = 'node:path' and cardinality(tasks) = 0;
update flow.agents set tasks = array['randomBytes','createHash','createHmac','randomUUID']
  where kind = 'maquina' and name = 'node:crypto' and cardinality(tasks) = 0;
update flow.agents set tasks = array['pipeline','finished','Readable','Writable','Transform']
  where kind = 'maquina' and name = 'node:stream' and cardinality(tasks) = 0;
update flow.agents set tasks = array['log','info','warn','error','debug','table','clear']
  where kind = 'maquina' and name = 'node:console' and cardinality(tasks) = 0;

-- Scripts: task = nome sem ().
update flow.agents set tasks = array[regexp_replace(name, '\(\)\s*$', '')]
  where kind = 'script' and cardinality(tasks) = 0;

-- Títulos de etapas node:http alinhados ao método quando o código deixa claro.
update flow.elements e set title = 'post'
  from flow.agents a
  where e.agent_id = a.id and a.name = 'node:http' and e.code ilike '%http.post%' and e.title <> 'post';
update flow.elements e set title = 'get'
  from flow.agents a
  where e.agent_id = a.id and a.name = 'node:http' and e.code ilike '%http.get%' and e.title <> 'get'
    and (e.code is null or e.code not ilike '%http.post%');
update flow.elements e set title = 'copyFile'
  from flow.agents a
  where e.agent_id = a.id and a.name = 'node:fs' and e.code ilike '%fs.copy%' and e.title <> 'copyFile';
update flow.elements e set title = 'log'
  from flow.agents a
  where e.agent_id = a.id and a.name = 'node:console' and e.code ilike '%console.log%' and e.title <> 'log';
