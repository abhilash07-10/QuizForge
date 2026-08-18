from flask import Blueprint, request, jsonify, g

from models.quiz_attempt import QuizAttempt
from utils.auth import login_required

results_bp = Blueprint("results", __name__, url_prefix="/api/results")


@results_bp.get("")
@login_required
def list_results():
    limit = min(int(request.args.get("limit", 10)), 50)
    attempts = (
        QuizAttempt.query.filter_by(user_id=g.current_user.id, status="completed")
        .order_by(QuizAttempt.completed_at.desc())
        .limit(limit)
        .all()
    )
    return jsonify({"results": [a.to_summary_dict() for a in attempts]}), 200
