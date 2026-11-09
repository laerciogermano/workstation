-- Fila de falhas lembra quem mandou a nota: na nova tentativa a nota entra no histórico dessa pessoa (RN-15 + REQ-051).
ALTER TABLE ingest_failures ADD COLUMN visitor_id bigint REFERENCES visitors (id) ON DELETE SET NULL;
ALTER TABLE ingest_failures ADD COLUMN user_id bigint REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX ingest_failures_visitor_idx ON ingest_failures (visitor_id);
CREATE INDEX ingest_failures_user_idx ON ingest_failures (user_id);
