-- V3: Multiplayer Games Foundation, Match History & ELO Ratings
-- Idempotent migration for PostgreSQL (compatible with hibernate.ddl-auto: validate)

-- 1. Extend games table with slug, game_mode, min_players, max_players
ALTER TABLE games ADD COLUMN IF NOT EXISTS slug VARCHAR(64);
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) NOT NULL DEFAULT 'SINGLE';
ALTER TABLE games ADD COLUMN IF NOT EXISTS min_players INT NOT NULL DEFAULT 1;
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_players INT NOT NULL DEFAULT 1;

UPDATE games SET game_mode = 'SINGLE' WHERE game_mode IS NULL;
UPDATE games SET min_players = 1 WHERE min_players IS NULL;
UPDATE games SET max_players = 1 WHERE max_players IS NULL;

-- Backfill slugs for existing seeded games if missing
UPDATE games SET slug = 'quiz-knowledge' WHERE slug IS NULL AND (LOWER(title) LIKE '%quiz%' OR LOWER(title) LIKE '%đố vui%');
UPDATE games SET slug = 'memory-match' WHERE slug IS NULL AND (LOWER(title) LIKE '%memory%' OR LOWER(title) LIKE '%lật thẻ%');
UPDATE games SET slug = 'speed-typing' WHERE slug IS NULL AND (LOWER(title) LIKE '%speed%' OR LOWER(title) LIKE '%gõ nhanh%');

CREATE UNIQUE INDEX IF NOT EXISTS ux_games_slug ON games(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_game_mode ON games(game_mode);

-- 2. Game Matches (Multiplayer / Bot Match History)
CREATE TABLE IF NOT EXISTS game_matches (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    room_code VARCHAR(16) NOT NULL,
    mode VARCHAR(20) NOT NULL DEFAULT 'PVP', -- PVP, BOT, RANKED
    status VARCHAR(20) NOT NULL DEFAULT 'FINISHED', -- FINISHED, ABORTED
    winner_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    total_moves INT NOT NULL DEFAULT 0,
    end_reason VARCHAR(40) NULL, -- FIVE_IN_ROW, TIMEOUT, FORFEIT, DRAW, DISCONNECT
    metadata_json TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_game_matches_game_created ON game_matches(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_matches_winner ON game_matches(winner_id);

-- 3. Game Match Players (Per-player match outcome & ELO delta)
CREATE TABLE IF NOT EXISTS game_match_players (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES game_matches(id) ON DELETE CASCADE,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL, -- NULL if Bot AI
    is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    display_name VARCHAR(100) NOT NULL,
    seat_index INT NOT NULL DEFAULT 0,
    score INT NOT NULL DEFAULT 0,
    elo_before INT NOT NULL DEFAULT 1000,
    elo_after INT NOT NULL DEFAULT 1000,
    result VARCHAR(16) NOT NULL DEFAULT 'DRAW' -- WIN, LOSS, DRAW
);

CREATE INDEX IF NOT EXISTS idx_game_match_players_match ON game_match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_game_match_players_user ON game_match_players(user_id);

-- 4. User Game Ratings (ELO & Win/Loss/Streak per game)
CREATE TABLE IF NOT EXISTS user_game_ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    elo INT NOT NULL DEFAULT 1000,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0,
    win_streak INT NOT NULL DEFAULT 0,
    best_win_streak INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_game_ratings UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_user_game_ratings_game_elo ON user_game_ratings(game_id, elo DESC);
