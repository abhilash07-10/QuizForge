from datetime import datetime

from models import db
from models.answer import Answer
from models.quiz_attempt import QuizAttempt
from models.user_progress import UserProgress
from services import streak_service, xp_service, achievement_service


def submit_attempt(attempt: QuizAttempt, submitted_answers: dict, time_taken_seconds: int) -> dict:
    """Scores an in-progress attempt, persists answers, updates the user's
    XP/streak/progress, evaluates achievements, and marks it completed.

    `submitted_answers` maps question_id (int) -> selected option letter
    ('A'..'D') or None for a skipped question.
    """
    user = attempt.user
    questions = list(attempt.quiz.questions)

    correct = wrong = skipped = 0

    for question in questions:
        selected = submitted_answers.get(question.id)
        is_correct = bool(selected) and selected == question.correct_option

        if selected is None:
            skipped += 1
        elif is_correct:
            correct += 1
        else:
            wrong += 1

        answer = Answer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_option=selected,
            is_correct=is_correct,
        )
        db.session.add(answer)

    total = len(questions)
    score_percent = round((correct / total) * 100, 1) if total else 0.0

    is_first_attempt = (
        QuizAttempt.query.filter_by(user_id=user.id, quiz_id=attempt.quiz_id, status="completed").count() == 0
    )

    # Streak must be updated before XP calc so today's streak bonus applies.
    streak_service.register_activity(user)

    xp_earned = xp_service.calculate_xp(
        correct_count=correct,
        total_questions=total,
        difficulty=attempt.quiz.difficulty,
        is_first_attempt=is_first_attempt,
        current_streak=user.current_streak,
    )

    attempt.status = "completed"
    attempt.completed_at = datetime.utcnow()
    attempt.time_taken_seconds = time_taken_seconds
    attempt.total_questions = total
    attempt.correct_count = correct
    attempt.wrong_count = wrong
    attempt.skipped_count = skipped
    attempt.score_percent = score_percent
    attempt.xp_earned = xp_earned

    user.xp += xp_earned

    # Update per-category rolling progress
    progress = UserProgress.query.filter_by(user_id=user.id, category_id=attempt.quiz.category_id).first()
    if not progress:
        progress = UserProgress(
            user_id=user.id,
            category_id=attempt.quiz.category_id,
            quizzes_completed=0,
            total_questions=0,
            total_correct=0,
        )
        db.session.add(progress)
    progress.quizzes_completed += 1
    progress.total_questions += total
    progress.total_correct += correct

    db.session.flush()  # ensure attempt has final values before achievement checks

    newly_unlocked = achievement_service.evaluate_achievements(user, attempt)

    db.session.commit()

    return {
        "attempt": attempt,
        "newlyUnlockedAchievements": newly_unlocked,
    }
