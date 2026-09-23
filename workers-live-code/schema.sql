-- Weko QR Code 活码 D1 schema

CREATE TABLE IF NOT EXISTS codes (
  id TEXT PRIMARY KEY,
  short_key TEXT NOT NULL UNIQUE,
  user_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('url', 'text', 'vcard', 'wifi', 'page')),
  title TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_codes_short_key ON codes(short_key);
CREATE INDEX IF NOT EXISTS idx_codes_user ON codes(user_id);

CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_id TEXT NOT NULL,
  short_key TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  ua TEXT,
  referer TEXT,
  country TEXT,
  ip_hash TEXT,
  FOREIGN KEY (code_id) REFERENCES codes(id)
);

CREATE INDEX IF NOT EXISTS idx_scans_code_ts ON scans(code_id, ts);
