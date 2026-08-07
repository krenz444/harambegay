CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  n    INTEGER NOT NULL DEFAULT 0
);
-- seeded from cloudflare's real pageView totals for harambe.gay, 2026-07-31..08-07
INSERT OR IGNORE INTO counters (name, n) VALUES ('hits', 1231);
