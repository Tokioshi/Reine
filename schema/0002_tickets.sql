CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interaction_id TEXT NOT NULL UNIQUE,
  guild_id TEXT NOT NULL,
  parent_channel_id TEXT NOT NULL,
  thread_id TEXT UNIQUE,
  starter_message_id TEXT,
  owner_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'ask')),
  service TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'creating'
    CHECK (status IN ('creating', 'open', 'closing', 'closed', 'failed')),
  close_reason TEXT,
  closed_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_one_active_per_owner
ON tickets(guild_id, owner_id)
WHERE status IN ('creating', 'open', 'closing');

CREATE INDEX IF NOT EXISTS idx_tickets_thread_id ON tickets(thread_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status, updated_at);
