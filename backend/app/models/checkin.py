import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class DailyCheckin(Base):
    __tablename__ = "daily_checkins"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    checkin_date = Column(
        Date,
        default=date.today,
        nullable=False,
    )
    answer = Column(Boolean, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Unique constraint: 1 check-in per user per day
    __table_args__ = (
        UniqueConstraint("user_id", "checkin_date", name="uq_checkins_user_date"),
    )

    # Relationships
    user = relationship("User", back_populates="checkins")
    context = relationship("CheckinContext", back_populates="checkin", uselist=False, cascade="all, delete-orphan")
    excuse = relationship("Excuse", back_populates="checkin", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DailyCheckin(user_id={self.user_id}, date={self.checkin_date}, answer={self.answer})>"

