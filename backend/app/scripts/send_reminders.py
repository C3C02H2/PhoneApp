import asyncio
from datetime import datetime

from app.db.database import SessionLocal
from app.models.user import User
from app.services.push_service import PushService


async def _send_daily_reminders() -> None:
  db = SessionLocal()
  try:
    now_hm = datetime.now().strftime("%H:%M")

    users = (
      db.query(User)
      .filter(
        User.notifications_enabled == True,  # noqa: E712
        User.daily_reminder_enabled == True,  # noqa: E712
        User.daily_reminder_time == now_hm,
      )
      .all()
    )

    if not users:
      return

    user_ids = [u.id for u in users]
    tokens = PushService.get_tokens_for_users(db, user_ids)
    if not tokens:
      return

    await PushService.send_notifications(
      tokens,
      "Did you try today?",
      "Open DoYouTry and answer the daily question.",
      {"type": "daily_reminder"},
    )
  finally:
    db.close()


def main() -> None:
  asyncio.run(_send_daily_reminders())


if __name__ == "__main__":
  main()

