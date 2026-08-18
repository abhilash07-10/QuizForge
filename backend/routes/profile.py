from flask import Blueprint, request, jsonify, g

from models import db
from models.quiz_attempt import QuizAttempt
from models.user_progress import UserProgress
from utils.auth import login_required

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")


@profile_bp.get("")
@login_required
def get_profile():
    user = g.current_user
    completed = QuizAttempt.query.filter_by(user_id=user.id, status="completed")
    total_quizzes = completed.count()
    scores = [a.score_percent for a in completed]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    best_score = round(max(scores), 1) if scores else 0.0

    progress = UserProgress.query.filter_by(user_id=user.id).all()

    data = user.to_public_dict()
    data.update({
        "quizzesCompleted": total_quizzes,
        "averageScore": avg_score,
        "bestScore": best_score,
        "categoryStrengths": [p.to_dict() for p in progress],
    })
    return jsonify({"profile": data}), 200


@profile_bp.put("")
@login_required
def update_profile():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("fullName") or "").strip()

    if not full_name or len(full_name) < 2:
        return jsonify({"error": "Please enter a valid name.", "fields": {"fullName": "Name is too short."}}), 400

    g.current_user.full_name = full_name
    db.session.commit()

    return jsonify({"user": g.current_user.to_public_dict()}), 200
