import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class CheckinContext(Base):
    """Extra context for a Yes check-in: what they tried, for how long, notes."""
    __tablename__ = "checkin_contexts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    checkin_id = Column(
        UUID(as_uuid=True),
        ForeignKey("daily_checkins.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    goal_id = Column(
        UUID(as_uuid=True),
        ForeignKey("goals.id", ondelete="SET NULL"),
        nullable=True,
    )
    what_i_tried = Column(String(500), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    note = Column(Text, nullable=True)
    next_step = Column(String(500), nullable=True)
    mood = Column(String(20), nullable=True)
    energy = Column(Integer, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    checkin = relationship("DailyCheckin", back_populates="context")
    goal = relationship("Goal", back_populates="checkin_contexts")

    def __repr__(self):
        return f"<CheckinContext(checkin_id={self.checkin_id})>"
