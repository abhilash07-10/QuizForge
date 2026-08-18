from collections import defaultdict
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, g

from models.quiz_attempt import QuizAttempt
from models.user_progress import UserProgress
from utils.auth import login_required

progress_bp = Blueprint("progress", __name__, url_prefix="/api/progress")


@progress_bp.get("")
@login_required
def get_progress():
    user = g.current_user
    completed = (
        QuizAttempt.query.filter_by(user_id=user.id, status="completed")
        .order_by(QuizAttempt.completed_at.asc())
        .all()
    )

    total_quizzes = len(completed)
    total_questions = sum(a.total_questions for a in completed)
    total_correct = sum(a.correct_count for a in completed)
    accuracy = round((total_correct / total_questions) * 100, 1) if total_questions else 0.0
    avg_score = round(sum(a.score_percent for a in completed) / total_quizzes, 1) if total_quizzes else 0.0
    best_score = round(max((a.score_percent for a in completed), default=0.0), 1)

    # Score-over-time series (chronological, last 20 attempts)
    score_over_time = [
        {"label": a.completed_at.strftime("%b %d"), "score": a.score_percent}
        for a in completed[-20:]
    ]

    # Weekly activity: quizzes completed per day for the last 7 days
    today = datetime.utcnow().date()
    activity_by_day = defaultdict(int)
    for a in completed:
        if a.completed_at and (today - a.completed_at.date()).days < 7:
            activity_by_day[a.completed_at.strftime("%a")] += 1
    day_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly_activity = [{"day": d, "count": activity_by_day.get(d, 0)} for d in day_order]

    # Correct vs incorrect totals
    total_wrong = sum(a.wrong_count for a in completed)
    total_skipped = sum(a.skipped_count for a in completed)

    category_performance = [
        p.to_dict() for p in UserProgress.query.filter_by(user_id=user.id).all()
    ]

    return jsonify({
        "totalQuizzes": total_quizzes,
        "averageScore": avg_score,
        "bestScore": best_score,
        "totalQuestionsAnswered": total_questions,
        "accuracy": accuracy,
        "currentStreak": user.current_streak,
        "longestStreak": user.longest_streak,
        "scoreOverTime": score_over_time,
        "weeklyActivity": weekly_activity,
        "categoryPerformance": category_performance,
        "correctVsIncorrect": {
            "correct": total_correct,
            "incorrect": total_wrong,
            "skipped": total_skipped,
        },
    }), 200
