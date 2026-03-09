-- ============================================================
-- DATABASE SCHEMA: "Do You Try?" Motivational App
-- PostgreSQL
-- ============================================================

-- Изтриване на съществуващи таблици (за чиста инсталация)
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50)  NOT NULL,
    email           VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT chk_users_username_length CHECK (char_length(username) >= 3),
    CONSTRAINT chk_users_email_format    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Индекси за users
CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_created  ON users (created_at DESC);

-- ============================================================
-- TABLE: posts
-- ============================================================
CREATE TABLE posts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(200) NOT NULL,
    content     TEXT         NOT NULL,
    author_id   UUID         NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_posts_author
        FOREIGN KEY (author_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_posts_title_length CHECK (char_length(title) >= 1),
    CONSTRAINT chk_posts_content_length CHECK (char_length(content) >= 1)
);

-- Индекси за posts
CREATE INDEX idx_posts_author   ON posts (author_id);
CREATE INDEX idx_posts_created  ON posts (created_at DESC);

-- ============================================================
-- TABLE: daily_checkins
-- ============================================================
CREATE TABLE daily_checkins (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID    NOT NULL,
    checkin_date DATE   NOT NULL DEFAULT CURRENT_DATE,
    answer      BOOLEAN NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_checkins_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Всеки потребител може да има само 1 check-in на ден
    CONSTRAINT uq_checkins_user_date UNIQUE (user_id, checkin_date)
);

-- Индекси за daily_checkins
CREATE INDEX idx_checkins_user     ON daily_checkins (user_id);
CREATE INDEX idx_checkins_date     ON daily_checkins (checkin_date DESC);
CREATE INDEX idx_checkins_user_date ON daily_checkins (user_id, checkin_date DESC);

-- ============================================================
-- TRIGGER: Автоматично обновяване на updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA: Примерни данни
-- ============================================================

-- Потребители (паролите са bcrypt хешове на "password123")
INSERT INTO users (id, username, email, hashed_password) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'tryer_one', 'tryer1@example.com', '$2b$12$LJ3m4ys2Kn.JmYGOEOYXxOQGz0ToCkPvO5sW3yOkqHMKF/kMbGDKe'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'daily_grinder', 'grinder@example.com', '$2b$12$LJ3m4ys2Kn.JmYGOEOYXxOQGz0ToCkPvO5sW3yOkqHMKF/kMbGDKe'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'motivation_king', 'king@example.com', '$2b$12$LJ3m4ys2Kn.JmYGOEOYXxOQGz0ToCkPvO5sW3yOkqHMKF/kMbGDKe');

-- Постове
INSERT INTO posts (title, content, author_id) VALUES
    ('The Power of Trying', 'Every great achievement starts with the decision to try. Not to succeed, not to be perfect — just to try. Today, I chose to try, and that alone made me stronger.', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('Day 30 of Never Giving Up', 'A month ago, I asked myself: Do you try? The answer was yes. And every single day since then, I''ve kept that promise. 30 days. 30 tries. Zero regrets.', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('Why "No" is a Lie', 'When you say "No, I don''t try" — you''re lying to yourself. The fact that you opened this app means you''re already trying. Give yourself credit.', 'c3d4e5f6-a7b8-9012-cdef-123456789012'),
    ('Start Small, Stay Consistent', 'You don''t need to move mountains. Just show up. Check in. Say yes. That''s all it takes to build an unstoppable streak.', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('The Compound Effect of Daily Effort', 'One day of trying means nothing. But 100 days? 365 days? That''s when the magic happens. Keep your streak alive.', 'b2c3d4e5-f6a7-8901-bcde-f12345678901');

-- Дневни check-ins (последните 7 дни за tryer_one)
INSERT INTO daily_checkins (user_id, checkin_date, answer) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '6 days', TRUE),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '5 days', TRUE),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '4 days', TRUE),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '3 days', TRUE),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '2 days', TRUE),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '1 day',  TRUE),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE,                      TRUE);

-- Check-ins за daily_grinder (с прекъсване)
INSERT INTO daily_checkins (user_id, checkin_date, answer) VALUES
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', CURRENT_DATE - INTERVAL '4 days', TRUE),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', CURRENT_DATE - INTERVAL '3 days', FALSE),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', CURRENT_DATE - INTERVAL '2 days', TRUE),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', CURRENT_DATE - INTERVAL '1 day',  TRUE),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', CURRENT_DATE,                      TRUE);

-- ============================================================
-- ПРИМЕРНИ QUERIES
-- ============================================================

-- 1. Създаване на нов пост
-- INSERT INTO posts (title, content, author_id)
-- VALUES ('My New Post', 'This is the content of my post.', 'USER_UUID_HERE');

-- 2. Дневен check-in
-- INSERT INTO daily_checkins (user_id, checkin_date, answer)
-- VALUES ('USER_UUID_HERE', CURRENT_DATE, TRUE)
-- ON CONFLICT (user_id, checkin_date) DO UPDATE SET answer = EXCLUDED.answer;

-- 3. Изчисляване на текущ streak (последователни дни с answer = TRUE)
-- WITH ordered_checkins AS (
--     SELECT
--         checkin_date,
--         answer,
--         checkin_date - (ROW_NUMBER() OVER (ORDER BY checkin_date DESC))::int AS grp
--     FROM daily_checkins
--     WHERE user_id = 'USER_UUID_HERE'
--       AND answer = TRUE
--     ORDER BY checkin_date DESC
-- )
-- SELECT COUNT(*) AS current_streak
-- FROM ordered_checkins
-- WHERE grp = (SELECT grp FROM ordered_checkins LIMIT 1);

-- 4. Общ брой check-ins за потребител
-- SELECT COUNT(*) AS total_checkins
-- FROM daily_checkins
-- WHERE user_id = 'USER_UUID_HERE' AND answer = TRUE;

-- 5. Всички постове с автор (JOIN)
-- SELECT p.id, p.title, p.content, p.created_at, u.username
-- FROM posts p
-- JOIN users u ON p.author_id = u.id
-- ORDER BY p.created_at DESC;

-- 6. Профил на потребител с streak
-- SELECT
--     u.username,
--     u.email,
--     u.created_at AS joined_at,
--     COUNT(CASE WHEN dc.answer = TRUE THEN 1 END) AS total_tries
-- FROM users u
-- LEFT JOIN daily_checkins dc ON u.id = dc.user_id
-- WHERE u.id = 'USER_UUID_HERE'
-- GROUP BY u.id;

