-- Weekly targets: up to 5 custom targets per week
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
