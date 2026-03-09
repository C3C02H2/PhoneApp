-- Migration v2: posts category/prompt, user_achievements

-- Posts: add category and prompt columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS prompt VARCHAR(200);
CREATE INDEX IF NOT EXISTS ix_posts_category ON posts (category);

-- User Achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS ix_user_achievements_id ON user_achievements (id);
CREATE INDEX IF NOT EXISTS ix_user_achievements_user_id ON user_achievements (user_id);
