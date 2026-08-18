from flask import Blueprint, request, jsonify, g

from models.quiz import Quiz
from models.category import Category
from utils.auth import login_required

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/api")


@quizzes_bp.get("/categories")
def list_categories():
    categories = Category.query.order_by(Category.name).all()
    return jsonify({"categories": [c.to_dict(include_stats=True) for c in categories]}), 200


@quizzes_bp.get("/quizzes")
def list_quizzes():
    query = Quiz.query.filter_by(is_active=True)

    category_slug = request.args.get("category")
    if category_slug and category_slug != "all":
        query = query.join(Category).filter(Category.slug == category_slug)

    difficulty = request.args.get("difficulty")
    if difficulty and difficulty != "all":
        query = query.filter(Quiz.difficulty == difficulty)

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(Quiz.title.ilike(like))

    sort = request.args.get("sort", "popular")
    quizzes = query.all()

    if sort == "newest":
        quizzes.sort(key=lambda q: q.created_at, reverse=True)
    else:  # popular (default)
        quizzes.sort(key=lambda q: q.attempt_count(), reverse=True)

    # Duration filter applied in-memory since it depends only on a small field
    duration = request.args.get("duration")
    if duration and duration != "all":
        bounds = {"short": (0, 10), "medium": (11, 20), "long": (21, 999)}
        lo, hi = bounds.get(duration, (0, 999))
        quizzes = [q for q in quizzes if lo <= q.duration_minutes <= hi]

    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(int(request.args.get("perPage", 12)), 50)
    start = (page - 1) * per_page
    paged = quizzes[start:start + per_page]

    return jsonify({
        "quizzes": [q.to_dict() for q in paged],
        "total": len(quizzes),
        "page": page,
        "perPage": per_page,
    }), 200


@quizzes_bp.get("/quizzes/<int:quiz_id>")
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    data = quiz.to_dict()
    data["rules"] = [
        "Each question has exactly one correct answer.",
        "You can navigate between questions freely and change your answers.",
        "Use \"Mark for review\" to flag questions you want to revisit.",
        "The quiz auto-submits when the timer reaches zero.",
        "Scoring: +1 for each correct answer, 0 for skipped or incorrect answers.",
    ]
    return jsonify({"quiz": data}), 200


@quizzes_bp.get("/quizzes/<int:quiz_id>/questions")
@login_required
def get_quiz_questions(quiz_id):
    """Returns questions WITHOUT correct answers -- used to render the live
    quiz-taking interface."""
    quiz = Quiz.query.get_or_404(quiz_id)
    questions = [q.to_public_dict() for q in quiz.questions]
    return jsonify({
        "quizId": quiz.id,
        "title": quiz.title,
        "durationMinutes": quiz.duration_minutes,
        "questions": questions,
    }), 200
