from flask import Blueprint, request, jsonify, g

from models import db
from models.quiz import Quiz
from models.question import Question
from models.quiz_attempt import QuizAttempt
from models.answer import Answer
from utils.auth import login_required
from services.scoring_service import submit_attempt

attempts_bp = Blueprint("attempts", __name__, url_prefix="/api/attempts")


@attempts_bp.post("")
@login_required
def start_attempt():
    data = request.get_json(silent=True) or {}
    quiz_id = data.get("quizId")

    quiz = Quiz.query.get(quiz_id)
    if not quiz or not quiz.is_active:
        return jsonify({"error": "Invalid quiz."}), 400

    if quiz.question_count() == 0:
        return jsonify({"error": "This quiz has no questions yet."}), 400

    attempt = QuizAttempt(
        user_id=g.current_user.id,
        quiz_id=quiz.id,
        status="in_progress",
        total_questions=quiz.question_count(),
    )
    db.session.add(attempt)
    db.session.commit()

    return jsonify({"attemptId": attempt.id}), 201


@attempts_bp.post("/<int:attempt_id>/submit")
@login_required
def submit(attempt_id):
    attempt = QuizAttempt.query.get_or_404(attempt_id)

    if attempt.user_id != g.current_user.id:
        return jsonify({"error": "You cannot access another user's attempt."}), 403

    if attempt.status == "completed":
        return jsonify({"error": "This attempt has already been submitted."}), 400

    data = request.get_json(silent=True) or {}
    raw_answers = data.get("answers", {})  # { "12": "A", "13": None, ... }
    time_taken_seconds = int(data.get("timeTakenSeconds", 0))

    # Validate every question id belongs to this quiz before scoring.
    valid_ids = {q.id for q in attempt.quiz.questions}
    submitted_answers = {}
    for key, value in raw_answers.items():
        try:
            qid = int(key)
        except (TypeError, ValueError):
            continue
        if qid not in valid_ids:
            return jsonify({"error": "Invalid question id in submission."}), 400
        submitted_answers[qid] = value if value in ("A", "B", "C", "D") else None

    result = submit_attempt(attempt, submitted_answers, time_taken_seconds)

    return jsonify({
        "attempt": result["attempt"].to_summary_dict(),
        "newlyUnlockedAchievements": [a.to_dict() for a in result["newlyUnlockedAchievements"]],
    }), 200


@attempts_bp.get("/<int:attempt_id>")
@login_required
def get_attempt(attempt_id):
    attempt = QuizAttempt.query.get_or_404(attempt_id)
    if attempt.user_id != g.current_user.id:
        return jsonify({"error": "You cannot access another user's attempt."}), 403
    return jsonify({"attempt": attempt.to_summary_dict()}), 200


@attempts_bp.get("/<int:attempt_id>/review")
@login_required
def review_attempt(attempt_id):
    attempt = QuizAttempt.query.get_or_404(attempt_id)
    if attempt.user_id != g.current_user.id:
        return jsonify({"error": "You cannot access another user's attempt."}), 403
    if attempt.status != "completed":
        return jsonify({"error": "This attempt is not yet completed."}), 400

    answers_by_question = {a.question_id: a.selected_option for a in attempt.answers}
    questions = list(attempt.quiz.questions)
    review = [q.to_review_dict(answers_by_question.get(q.id)) for q in questions]

    return jsonify({
        "attempt": attempt.to_summary_dict(),
        "questions": review,
    }), 200
