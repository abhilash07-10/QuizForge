from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import models so they register with SQLAlchemy's metadata when the
# package is imported (needed for `db.create_all()` / migrations).
from .user import User  # noqa: E402,F401
from .category import Category  # noqa: E402,F401
from .quiz import Quiz  # noqa: E402,F401
from .question import Question  # noqa: E402,F401
from .quiz_attempt import QuizAttempt  # noqa: E402,F401
from .answer import Answer  # noqa: E402,F401
from .achievement import Achievement, UserAchievement  # noqa: E402,F401
from .user_progress import UserProgress  # noqa: E402,F401
