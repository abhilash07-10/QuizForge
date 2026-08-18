from datetime import datetime

from . import db

DIFFICULTY_LEVELS = ("Beginner", "Intermediate", "Advanced")


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(170), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)
    difficulty = db.Column(db.String(20), nullable=False, default="Beginner")
    duration_minutes = db.Column(db.Integer, nullable=False, default=10)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    questions = db.relationship(
        "Question", backref="quiz", lazy="dynamic", cascade="all, delete-orphan", order_by="Question.order_index"
    )
    attempts = db.relationship("QuizAttempt", backref="quiz", lazy="dynamic")

    def question_count(self) -> int:
        return self.questions.count()

    def attempt_count(self) -> int:
        return self.attempts.filter_by(status="completed").count()

    def average_score(self) -> float:
        from sqlalchemy import func
        from .quiz_attempt import QuizAttempt

        avg = (
            db.session.query(func.avg(QuizAttempt.score_percent))
            .filter(QuizAttempt.quiz_id == self.id, QuizAttempt.status == "completed")
            .scalar()
        )
        return round(avg, 1) if avg else 0.0

    def to_dict(self, include_description=True) -> dict:
        data = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "category": self.category.name,
            "categorySlug": self.category.slug,
            "difficulty": self.difficulty,
            "questionCount": self.question_count(),
            "durationMinutes": self.duration_minutes,
            "attempts": self.attempt_count(),
        }
        if include_description:
            data["description"] = self.description
        return data

