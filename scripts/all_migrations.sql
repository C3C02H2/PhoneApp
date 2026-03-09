-- ============================================================
-- DoYouTry - All migrations (v2, v3, v4, v5)
-- Run: psql -U user -d doyoutry -f scripts/all_migrations.sql
-- ============================================================

-- Migration v2: posts category/prompt, user_achievements
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS prompt VARCHAR(200);
CREATE INDEX IF NOT EXISTS ix_posts_category ON posts (category);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS ix_user_achievements_id ON user_achievements (id);
CREATE INDEX IF NOT EXISTS ix_user_achievements_user_id ON user_achievements (user_id);

-- Migration v3: user settings
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Migration v4: settings + chat
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_reminder_time VARCHAR(5) NOT NULL DEFAULT '08:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS evening_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS evening_reminder_time VARCHAR(5) NOT NULL DEFAULT '21:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_anonymous BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS chat_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_chat_requests_sender_id ON chat_requests(sender_id);
CREATE INDEX IF NOT EXISTS ix_chat_requests_receiver_id ON chat_requests(receiver_id);
CREATE INDEX IF NOT EXISTS ix_chat_requests_status ON chat_requests(status);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES chat_requests(id) ON DELETE CASCADE,
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS ix_chat_sessions_user1_id ON chat_sessions(user1_id);
CREATE INDEX IF NOT EXISTS ix_chat_sessions_user2_id ON chat_sessions(user2_id);
CREATE INDEX IF NOT EXISTS ix_chat_sessions_is_active ON chat_sessions(is_active);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_chat_messages_session_id ON chat_messages(session_id);

-- Migration v5: weekly targets
CREATE TABLE IF NOT EXISTS weekly_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 1 CHECK (target_count >= 1 AND target_count <= 999),
    current_count INTEGER NOT NULL DEFAULT 0 CHECK (current_count >= 0),
    week_start DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, week_start, title)
);
CREATE INDEX IF NOT EXISTS ix_weekly_targets_user_week ON weekly_targets(user_id, week_start);
