from sqlalchemy import func

from models import db
from models.user import User
from models.quiz_attempt import QuizAttempt
from models.answer import Answer
from models.achievement import Achievement, UserAchievement
from models.quiz import Quiz
from models.category import Category


def _unlock(user: User, code: str, newly_unlocked: list) -> None:
    achievement = Achievement.query.filter_by(code=code).first()
    if not achievement:
        return
    already = UserAchievement.query.filter_by(user_id=user.id, achievement_id=achievement.id).first()
    if already:
        return
    link = UserAchievement(user_id=user.id, achievement_id=achievement.id)
    db.session.add(link)
    user.xp += achievement.xp_reward
    newly_unlocked.append(achievement)


def evaluate_achievements(user: User, latest_attempt: QuizAttempt) -> list:
    """Checks all achievement conditions after a completed attempt and
    unlocks any newly-earned ones. Returns the list of Achievement objects
    unlocked during this call (empty if none)."""
    newly_unlocked: list = []

    completed_attempts = QuizAttempt.query.filter_by(user_id=user.id, status="completed")
    total_completed = completed_attempts.count()

    # First Quiz
    if total_completed >= 1:
        _unlock(user, "first_quiz", newly_unlocked)

    # 10 Quizzes Completed
    if total_completed >= 10:
        _unlock(user, "ten_quizzes", newly_unlocked)

    # Perfect Score
    if latest_attempt.total_questions > 0 and latest_attempt.correct_count == latest_attempt.total_questions:
        _unlock(user, "perfect_score", newly_unlocked)

    # 100 / 500 Questions Answered
    total_answered = (
        db.session.query(func.sum(QuizAttempt.total_questions))
        .filter(QuizAttempt.user_id == user.id, QuizAttempt.status == "completed")
        .scalar()
        or 0
    )
    if total_answered >= 100:
        _unlock(user, "hundred_questions", newly_unlocked)
    if total_answered >= 500:
        _unlock(user, "five_hundred_questions", newly_unlocked)

    # 7-Day Streak
    if user.current_streak >= 7:
        _unlock(user, "seven_day_streak", newly_unlocked)

    # Speed Solver: completed a quiz in under 40% of the allotted time with a good score
    quiz = latest_attempt.quiz
    if (
        latest_attempt.time_taken_seconds
        and quiz.duration_minutes
        and latest_attempt.time_taken_seconds <= quiz.duration_minutes * 60 * 0.4
        and latest_attempt.total_questions > 0
        and (latest_attempt.correct_count / latest_attempt.total_questions) >= 0.7
    ):
        _unlock(user, "speed_solver", newly_unlocked)

    # Category mastery badges (Python Master / SQL Master): 90%+ average
    # across at least 3 completed attempts in that category.
    category = quiz.category
    slug_to_code = {"python": "python_master", "sql": "sql_master"}
    code = slug_to_code.get(category.slug)
    if code:
        cat_attempts = (
            completed_attempts.join(Quiz).filter(Quiz.category_id == category.id).all()
        )
        if len(cat_attempts) >= 3:
            avg = sum(a.score_percent for a in cat_attempts) / len(cat_attempts)
            if avg >= 90:
                _unlock(user, code, newly_unlocked)

    return newly_unlocked
