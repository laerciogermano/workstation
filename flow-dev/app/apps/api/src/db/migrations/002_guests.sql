-- Visitante sem conta: cada pessoa tem um person_key (uuid v4, segredo dela). E-mail/senha entram depois ("vincular").
alter table flow.users alter column email drop not null;
alter table flow.users alter column password_hash drop not null;
alter table flow.users alter column name set default 'Visitante';
alter table flow.users add column person_key uuid not null default gen_random_uuid();
create unique index users_person_key_uq on flow.users (person_key);
alter table flow.users add constraint users_registered_chk check ((email is null) = (password_hash is null));
