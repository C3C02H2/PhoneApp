from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.achievement import UserAchievement
from app.models.checkin import DailyCheckin
from app.models.comment import Comment
from app.models.post import Post

ACHIEVEMENT_DEFS = {
    "first_checkin": {"title": "First Step", "description": "Complete your first check-in", "icon": "1"},
    "streak_3": {"title": "3 Day Streak", "description": "3 consecutive days of trying", "icon": "3"},
    "streak_7": {"title": "Week Warrior", "description": "7 consecutive days of trying", "icon": "7"},
    "streak_14": {"title": "Two Week Force", "description": "14 days without stopping", "icon": "14"},
    "streak_30": {"title": "Monthly Master", "description": "30 days of pure effort", "icon": "30"},
    "streak_100": {"title": "Centurion", "description": "100 consecutive days", "icon": "100"},
    "total_10": {"title": "Getting Started", "description": "10 total check-ins", "icon": "10"},
    "total_50": {"title": "Dedicated", "description": "50 total check-ins", "icon": "50"},
    "total_100": {"title": "One Hundred", "description": "100 total check-ins", "icon": "100"},
    "first_post": {"title": "Voice Found", "description": "Publish your first post", "icon": "P"},
    "first_comment": {"title": "Engaged", "description": "Leave your first comment", "icon": "C"},
    "ten_posts": {"title": "Storyteller", "description": "Publish 10 posts", "icon": "10"},
}


class AchievementService:

    @staticmethod
    def get_user_achievements(db: Session, user_id: UUID) -> list[dict]:
        unlocked = {
            a.achievement_key: a.unlocked_at
            for a in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
        }
        result = []
        for key, defn in ACHIEVEMENT_DEFS.items():
            result.append({
                "key": key,
                "title": defn["title"],
                "description": defn["description"],
                "icon": defn["icon"],
                "unlocked": key in unlocked,
                "unlocked_at": unlocked.get(key),
            })
        return result

    @staticmethod
    def check_and_award(db: Session, user_id: UUID) -> list[str]:
        """Check all achievement conditions and award new ones. Returns list of newly unlocked keys."""
        existing = {
            a.achievement_key
            for a in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
        }

        total_yes = (
            db.query(DailyCheckin)
            .filter(and_(DailyCheckin.user_id == user_id, DailyCheckin.answer == True))
            .count()
        )
        posts_count = db.query(Post).filter(Post.author_id == user_id).count()
        comments_count = db.query(Comment).filter(Comment.author_id == user_id).count()

        positive_dates = {
            d[0]
            for d in db.query(DailyCheckin.checkin_date)
            .filter(and_(DailyCheckin.user_id == user_id, DailyCheckin.answer == True))
            .all()
        }
        longest = AchievementService._longest_streak(positive_dates)

        conditions = {
            "first_checkin": total_yes >= 1,
            "streak_3": longest >= 3,
            "streak_7": longest >= 7,
            "streak_14": longest >= 14,
            "streak_30": longest >= 30,
            "streak_100": longest >= 100,
            "total_10": total_yes >= 10,
            "total_50": total_yes >= 50,
            "total_100": total_yes >= 100,
            "first_post": posts_count >= 1,
            "first_comment": comments_count >= 1,
            "ten_posts": posts_count >= 10,
        }

        newly_unlocked = []
        for key, met in conditions.items():
            if met and key not in existing:
                db.add(UserAchievement(user_id=user_id, achievement_key=key))
                newly_unlocked.append(key)

        if newly_unlocked:
            db.commit()

        return newly_unlocked

    @staticmethod
    def _longest_streak(dates_set: set) -> int:
        if not dates_set:
            return 0
        sorted_dates = sorted(dates_set)
        longest = 1
        current = 1
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] - sorted_dates[i - 1] == timedelta(days=1):
                current += 1
                longest = max(longest, current)
            else:
                current = 1
        return longest
