CREATE TABLE IF NOT EXISTS anime_watchlist (
  anilist_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail TEXT,
  url TEXT,
  last_episode INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anime_watchlist_title ON anime_watchlist(title);
