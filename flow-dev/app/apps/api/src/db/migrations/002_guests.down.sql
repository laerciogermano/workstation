delete from flow.users where email is null;
alter table flow.users drop constraint users_registered_chk;
drop index flow.users_person_key_uq;
alter table flow.users drop column person_key;
alter table flow.users alter column name drop default;
alter table flow.users alter column password_hash set not null;
alter table flow.users alter column email set not null;
