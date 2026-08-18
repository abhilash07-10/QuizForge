from . import db


class Answer(db.Model):
    """A single answer a user gave to a question within one attempt.

    We store only the option letter chosen plus a reference to the
    question/attempt -- never a duplicated copy of question text, to
    keep storage efficient.
    """

    __tablename__ = "answers"

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("quiz_attempts.id"), nullable=False, index=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False, index=True)

    selected_option = db.Column(db.String(1), nullable=True)  # NULL == skipped
    is_correct = db.Column(db.Boolean, nullable=False, default=False)
    marked_for_review = db.Column(db.Boolean, nullable=False, default=False)

    __table_args__ = (db.UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question"),)
