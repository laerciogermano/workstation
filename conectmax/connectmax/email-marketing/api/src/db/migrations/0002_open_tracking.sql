-- 0002 — abertura por destinatário (pixel 1×1), CU-06.
set search_path to email_marketing;

alter table deliveries
  add column opened_at      timestamptz,
  add column last_opened_at timestamptz,
  add column open_count     integer not null default 0 check (open_count >= 0);
