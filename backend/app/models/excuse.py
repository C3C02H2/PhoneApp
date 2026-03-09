import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

EXCUSE_CATEGORIES = [
    "no_time",
    "exhausted",
    "procrastinated",
    "didnt_know_where_to_start",
    "other",
]


class Excuse(Base):
    """Reason for a No check-in."""
    __tablename__ = "excuses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    checkin_id = Column(
        UUID(as_uuid=True),
        ForeignKey("daily_checkins.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    category = Column(String(50), nullable=False)
    detail = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    checkin = relationship("DailyCheckin", back_populates="excuse")

    def __repr__(self):
        return f"<Excuse(checkin_id={self.checkin_id}, category={self.category})>"
