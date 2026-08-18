from . import db


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False, index=True)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    text = db.Column(db.Text, nullable=False)

    option_a = db.Column(db.String(500), nullable=False)
    option_b = db.Column(db.String(500), nullable=False)
    option_c = db.Column(db.String(500), nullable=False)
    option_d = db.Column(db.String(500), nullable=False)
    correct_option = db.Column(db.String(1), nullable=False)  # 'A' | 'B' | 'C' | 'D'

    explanation = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.String(20), nullable=False, default="Beginner")

    answers = db.relationship("Answer", backref="question", lazy="dynamic")

    def options_dict(self) -> dict:
        return {"A": self.option_a, "B": self.option_b, "C": self.option_c, "D": self.option_d}

    def to_public_dict(self) -> dict:
        """Version sent to the client while a quiz is in progress. Never
        exposes the correct answer or explanation."""
        return {
            "id": self.id,
            "orderIndex": self.order_index,
            "text": self.text,
            "options": self.options_dict(),
        }

    def to_review_dict(self, user_answer: str | None) -> dict:
        """Full version used on the answer-review screen after submission."""
        return {
            "id": self.id,
            "orderIndex": self.order_index,
            "text": self.text,
            "options": self.options_dict(),
            "correctOption": self.correct_option,
            "userOption": user_answer,
            "isCorrect": bool(user_answer) and user_answer == self.correct_option,
            "explanation": self.explanation,
        }
