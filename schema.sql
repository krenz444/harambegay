CREATE TABLE IF NOT EXISTS entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  msg        TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ip_hash    TEXT,
  hidden     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_entries_created ON entries (created_at);
CREATE INDEX IF NOT EXISTS idx_entries_rate ON entries (ip_hash, created_at);

-- the originals. they were here first.
INSERT INTO entries (name, msg, created_at, ip_hash) VALUES
  ('xXsephiroth420Xx', 'first!!!! also rip king 😔🌈',                                                        1464393600, 'seed'),
  ('Xx_fuRPhY_xX',     'omg thanks 4 visiting my shrine!! sign the guestbook or else xD',                      1464394000, 'seed'),
  ('ur mom',           'nice site sweetie. dinner at 6.',                                                      1464395000, 'seed'),
  ('dolphinluvr88',    'crying in the club rn (the club is my bedroom) (the song is amazing grace 8 bit) 😭😭', 1464396000, 'seed'),
  ('jeff',             '[jeff was here but asks that u respect his privacy]',                                  1464397000, 'seed'),
  ('glitterghost',     '~*~ he came to me in a dream and said gay rights ~*~',                                 1464398000, 'seed');
