from . import db


class UserProgress(db.Model):
    """Aggregated, per-category performance for a user. Updated after each
    completed attempt instead of recomputing from scratch every request."""

    __tablename__ = "user_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)

    quizzes_completed = db.Column(db.Integer, nullable=False, default=0)
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    total_correct = db.Column(db.Integer, nullable=False, default=0)

    category = db.relationship("Category")

    __table_args__ = (db.UniqueConstraint("user_id", "category_id", name="uq_user_category"),)

    @property
    def accuracy_percent(self) -> float:
        if not self.total_questions:
            return 0.0
        return round((self.total_correct / self.total_questions) * 100, 1)

    def to_dict(self) -> dict:
        return {
            "category": self.category.name,
            "quizzesCompleted": self.quizzes_completed,
            "accuracyPercent": self.accuracy_percent,
        }
