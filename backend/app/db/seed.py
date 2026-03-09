"""Seed script за попълване на базата с примерни данни."""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.user import User
from app.models.post import Post
from app.models.checkin import DailyCheckin


def seed_database():
    """Попълва базата с примерни данни."""
    db: Session = SessionLocal()

    try:
        # Проверка дали вече има данни
        if db.query(User).first():
            print("Database already seeded. Skipping.")
            return

        # Създаване на потребители
        users = [
            User(
                username="tryer_one",
                email="tryer1@example.com",
                hashed_password=hash_password("password123"),
            ),
            User(
                username="daily_grinder",
                email="grinder@example.com",
                hashed_password=hash_password("password123"),
            ),
            User(
                username="motivation_king",
                email="king@example.com",
                hashed_password=hash_password("password123"),
            ),
        ]

        for user in users:
            db.add(user)
        db.flush()

        # Създаване на постове
        posts = [
            Post(
                title="The Power of Trying",
                content="Every great achievement starts with the decision to try. "
                "Not to succeed, not to be perfect — just to try. "
                "Today, I chose to try, and that alone made me stronger.",
                author_id=users[0].id,
            ),
            Post(
                title="Day 30 of Never Giving Up",
                content="A month ago, I asked myself: Do you try? The answer was yes. "
                "And every single day since then, I've kept that promise. "
                "30 days. 30 tries. Zero regrets.",
                author_id=users[1].id,
            ),
            Post(
                title="Why 'No' is a Lie",
                content="When you say 'No, I don't try' — you're lying to yourself. "
                "The fact that you opened this app means you're already trying. "
                "Give yourself credit.",
                author_id=users[2].id,
            ),
            Post(
                title="Start Small, Stay Consistent",
                content="You don't need to move mountains. Just show up. "
                "Check in. Say yes. That's all it takes to build an unstoppable streak.",
                author_id=users[0].id,
            ),
            Post(
                title="The Compound Effect of Daily Effort",
                content="One day of trying means nothing. But 100 days? 365 days? "
                "That's when the magic happens. Keep your streak alive.",
                author_id=users[1].id,
            ),
        ]

        for post in posts:
            db.add(post)

        # Създаване на check-ins (7-дневен streak за tryer_one)
        today = date.today()
        for i in range(7):
            checkin = DailyCheckin(
                user_id=users[0].id,
                checkin_date=today - timedelta(days=6 - i),
                answer=True,
            )
            db.add(checkin)

        # Check-ins за daily_grinder (с прекъсване)
        grinder_checkins = [
            (4, True),
            (3, False),
            (2, True),
            (1, True),
            (0, True),
        ]
        for days_ago, answer in grinder_checkins:
            checkin = DailyCheckin(
                user_id=users[1].id,
                checkin_date=today - timedelta(days=days_ago),
                answer=answer,
            )
            db.add(checkin)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

