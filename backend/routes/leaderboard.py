from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from sqlalchemy import func

from models import db
from models.user import User
from models.quiz_attempt import QuizAttempt

leaderboard_bp = Blueprint("leaderboard", __name__, url_prefix="/api/leaderboard")


@leaderboard_bp.get("")
def get_leaderboard():
    period = request.args.get("period", "all_time")  # weekly | monthly | all_time
    limit = min(int(request.args.get("limit", 20)), 100)

    query = (
        db.session.query(
            User.public_id,
            User.full_name,
            User.xp,
            func.count(QuizAttempt.id).label("quizzes_completed"),
            func.avg(QuizAttempt.score_percent).label("avg_score"),
        )
        .join(QuizAttempt, QuizAttempt.user_id == User.id)
        .filter(QuizAttempt.status == "completed")
    )

    if period == "weekly":
        since = datetime.utcnow() - timedelta(days=7)
        query = query.filter(QuizAttempt.completed_at >= since)
    elif period == "monthly":
        since = datetime.utcnow() - timedelta(days=30)
        query = query.filter(QuizAttempt.completed_at >= since)

    rows = (
        query.group_by(User.id)
        .order_by(func.sum(QuizAttempt.xp_earned).desc())
        .limit(limit)
        .all()
    )

    leaderboard = [
        {
            "rank": idx + 1,
            "name": row.full_name,
            "xp": row.xp,
            "quizzesCompleted": row.quizzes_completed,
            "averageScore": round(row.avg_score, 1) if row.avg_score else 0.0,
        }
        for idx, row in enumerate(rows)
    ]

    return jsonify({"period": period, "leaderboard": leaderboard}), 200
