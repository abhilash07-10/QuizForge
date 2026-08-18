"""
Seeds the QuizForge database with categories, quizzes, questions, and
achievements. Safe to run multiple times -- existing records (matched by
their unique slug/code) are left untouched rather than duplicated.

Usage:
    python seed.py            # seed (idempotent)
    python seed.py --reset    # wipe quiz-content tables and reseed fresh
"""
import sys

from app import create_app
from models import db
from models.category import Category
from models.quiz import Quiz
from models.question import Question
from models.achievement import Achievement
from seed_data.definitions import CATEGORIES, QUIZZES, ACHIEVEMENTS


def reset_content_tables():
    print("Resetting quiz content tables (categories, quizzes, questions, achievements)...")
    Question.query.delete()
    Quiz.query.delete()
    Category.query.delete()
    Achievement.query.delete()
    db.session.commit()


def seed_categories():
    slug_to_category = {}
    created = 0
    for name, slug, description, icon in CATEGORIES:
        category = Category.query.filter_by(slug=slug).first()
        if not category:
            category = Category(name=name, slug=slug, description=description, icon=icon)
            db.session.add(category)
            created += 1
        slug_to_category[slug] = category
    db.session.commit()
    print(f"Categories: {created} created, {len(CATEGORIES) - created} already existed.")
    return slug_to_category


def seed_quizzes(slug_to_category):
    created_quizzes = 0
    created_questions = 0

    for quiz_def in QUIZZES:
        category = slug_to_category[quiz_def["category_slug"]]
        quiz = Quiz.query.filter_by(slug=quiz_def["slug"]).first()

        if not quiz:
            quiz = Quiz(
                title=quiz_def["title"],
                slug=quiz_def["slug"],
                description=quiz_def["description"],
                category_id=category.id,
                difficulty=quiz_def["difficulty"],
                duration_minutes=quiz_def["duration_minutes"],
            )
            db.session.add(quiz)
            db.session.flush()  # get quiz.id for questions
            created_quizzes += 1

            for idx, q in enumerate(quiz_def["questions"]):
                text, a, b, c, d, correct, explanation, difficulty = q
                question = Question(
                    quiz_id=quiz.id,
                    order_index=idx,
                    text=text,
                    option_a=a,
                    option_b=b,
                    option_c=c,
                    option_d=d,
                    correct_option=correct,
                    explanation=explanation,
                    difficulty=difficulty,
                )
                db.session.add(question)
                created_questions += 1

    db.session.commit()
    print(f"Quizzes: {created_quizzes} created, {len(QUIZZES) - created_quizzes} already existed.")
    print(f"Questions: {created_questions} created.")


def seed_achievements():
    created = 0
    for code, title, description, icon, xp_reward in ACHIEVEMENTS:
        achievement = Achievement.query.filter_by(code=code).first()
        if not achievement:
            db.session.add(Achievement(
                code=code, title=title, description=description, icon=icon, xp_reward=xp_reward,
            ))
            created += 1
    db.session.commit()
    print(f"Achievements: {created} created, {len(ACHIEVEMENTS) - created} already existed.")


def main():
    app = create_app()
    with app.app_context():
        db.create_all()

        if "--reset" in sys.argv:
            reset_content_tables()

        slug_to_category = seed_categories()
        seed_quizzes(slug_to_category)
        seed_achievements()

        print("\nSeeding complete. QuizForge is ready to explore!")


if __name__ == "__main__":
    main()
