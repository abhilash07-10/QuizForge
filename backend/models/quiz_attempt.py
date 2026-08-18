from datetime import datetime

from . import db


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False, index=True)

    status = db.Column(db.String(20), nullable=False, default="in_progress")  # in_progress | completed
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    time_taken_seconds = db.Column(db.Integer, nullable=True)

    total_questions = db.Column(db.Integer, nullable=False, default=0)
    correct_count = db.Column(db.Integer, nullable=False, default=0)
    wrong_count = db.Column(db.Integer, nullable=False, default=0)
    skipped_count = db.Column(db.Integer, nullable=False, default=0)
    score_percent = db.Column(db.Float, nullable=False, default=0.0)
    xp_earned = db.Column(db.Integer, nullable=False, default=0)

    answers = db.relationship("Answer", backref="attempt", lazy="dynamic", cascade="all, delete-orphan")

    def to_summary_dict(self) -> dict:
        return {
            "id": self.id,
            "quizId": self.quiz_id,
            "quizTitle": self.quiz.title,
            "category": self.quiz.category.name,
            "status": self.status,
            "startedAt": self.started_at.isoformat(),
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "timeTakenSeconds": self.time_taken_seconds,
            "totalQuestions": self.total_questions,
            "correctCount": self.correct_count,
            "wrongCount": self.wrong_count,
            "skippedCount": self.skipped_count,
            "scorePercent": self.score_percent,
            "xpEarned": self.xp_earned,
        }
