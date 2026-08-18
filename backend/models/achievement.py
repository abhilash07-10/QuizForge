from datetime import datetime

from . import db


class Achievement(db.Model):
    __tablename__ = "achievements"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)  # stable machine key, e.g. "first_quiz"
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="trophy")
    xp_reward = db.Column(db.Integer, nullable=False, default=0)

    user_links = db.relationship("UserAchievement", backref="achievement", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "title": self.title,
            "description": self.description,
            "icon": self.icon,
            "xpReward": self.xp_reward,
        }


class UserAchievement(db.Model):
    __tablename__ = "user_achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id"), nullable=False, index=True)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (db.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    def to_dict(self) -> dict:
        data = self.achievement.to_dict()
        data["unlockedAt"] = self.unlocked_at.isoformat()
        return data
