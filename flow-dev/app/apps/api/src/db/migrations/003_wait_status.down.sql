update flow.elements set status = 'pendente' where status = 'wait';
alter table flow.elements drop constraint elements_status_check;
alter table flow.elements add constraint elements_status_check check (status in ('pendente', 'exec', 'ok', 'fail', 'cancel'));
