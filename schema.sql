-- Group Randomizer — D1 (SQLite) schema

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,      -- Google account id ("sub")
  email       TEXT NOT NULL,
  name        TEXT,
  picture     TEXT,
  phrases     TEXT,                  -- JSON array of custom shuffle phrases (null = use defaults)
  sound       TEXT,                  -- chosen shuffle sound key (null/'off' = silent)
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id           TEXT PRIMARY KEY,     -- random id
  user_id      TEXT NOT NULL,        -- owner (users.id)
  title        TEXT NOT NULL,
  names        TEXT NOT NULL DEFAULT '[]',   -- JSON array of student names
  mode         TEXT NOT NULL DEFAULT 'groups', -- 'groups' | 'size'
  size         INTEGER NOT NULL DEFAULT 5,
  avoid_repeat INTEGER NOT NULL DEFAULT 0,
  keep_apart   TEXT NOT NULL DEFAULT '[]',    -- JSON array of [a,b] pairs (teacher-only)
  result       TEXT,                          -- JSON array of arrays, or null
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_groups_user ON groups(user_id, updated_at DESC);
