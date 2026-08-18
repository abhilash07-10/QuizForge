import uuid
from datetime import datetime, date

from werkzeug.security import generate_password_hash, check_password_hash

from . import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Gamification
    xp = db.Column(db.Integer, default=0, nullable=False)
    current_streak = db.Column(db.Integer, default=0, nullable=False)
    longest_streak = db.Column(db.Integer, default=0, nullable=False)
    last_activity_date = db.Column(db.Date, nullable=True)

    attempts = db.relationship("QuizAttempt", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    achievements = db.relationship("UserAchievement", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    progress_entries = db.relationship("UserProgress", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, raw_password: str) -> None:
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash, raw_password)

    def to_public_dict(self) -> dict:
        """Never expose password_hash or internal DB id in API responses."""
        return {
            "id": self.public_id,
            "fullName": self.full_name,
            "email": self.email,
            "joinedDate": self.created_at.isoformat(),
            "xp": self.xp,
            "currentStreak": self.current_streak,
            "longestStreak": self.longest_streak,
        }
