from .python_data import PYTHON_QUESTIONS
from .java_data import JAVA_QUESTIONS
from .javascript_data import JAVASCRIPT_QUESTIONS
from .html_css_data import HTML_CSS_QUESTIONS
from .sql_data import SQL_QUESTIONS
from .dbms_data import DBMS_QUESTIONS
from .os_data import OS_QUESTIONS
from .cn_data import CN_QUESTIONS
from .data_structures_data import DS_QUESTIONS
from .cpp_data import CPP_QUESTIONS
from .aptitude_data import APTITUDE_QUESTIONS

# --- Categories ------------------------------------------------------------
# (name, slug, description, icon)
CATEGORIES = [
    ("Python", "python", "Test your knowledge of Python syntax, data structures, and object-oriented concepts.", "python"),
    ("Java", "java", "Practice core Java concepts including OOP, collections, and exception handling.", "java"),
    ("C/C++", "c-cpp", "Sharpen your understanding of pointers, memory management, and C/C++ fundamentals.", "cpp"),
    ("JavaScript", "javascript", "Challenge yourself on JS fundamentals, async programming, and the DOM.", "javascript"),
    ("HTML & CSS", "html-css", "Cover the essentials of markup, styling, layout, and responsive design.", "html"),
    ("SQL", "sql", "Practice writing and reasoning about SQL queries, joins, and constraints.", "sql"),
    ("DBMS", "dbms", "Explore database design, normalization, transactions, and indexing concepts.", "database"),
    ("Operating Systems", "operating-systems", "Test your grasp of processes, scheduling, memory management, and concurrency.", "cpu"),
    ("Computer Networks", "computer-networks", "Cover networking fundamentals from the OSI model to TCP/IP and routing.", "network"),
    ("Data Structures", "data-structures", "Practice arrays, trees, graphs, hashing, and algorithmic complexity.", "structure"),
    ("Aptitude & Reasoning", "aptitude-reasoning", "Sharpen quantitative aptitude and logical reasoning for placement prep.", "brain"),
]

# --- Quizzes -----------------------------------------------------------
# Each category gets 2 quizzes built by splitting its question bank into a
# "Fundamentals" quiz (mostly Beginner/Intermediate) and a "Practice Test"
# (Intermediate/Advanced), so difficulty progresses naturally.
#
# (category_slug, title, slug, description, difficulty, duration_minutes, question_bank, question_slice)

def _split_bank(bank, first_n):
    return bank[:first_n], bank[first_n:]


QUIZZES = []


def _register(category_slug, title, slug, description, difficulty, duration, questions):
    QUIZZES.append({
        "category_slug": category_slug,
        "title": title,
        "slug": slug,
        "description": description,
        "difficulty": difficulty,
        "duration_minutes": duration,
        "questions": questions,
    })


_banks = [
    ("python", "Python", PYTHON_QUESTIONS, 10),
    ("java", "Java", JAVA_QUESTIONS, 10),
    ("c-cpp", "C/C++", CPP_QUESTIONS, 8),
    ("javascript", "JavaScript", JAVASCRIPT_QUESTIONS, 10),
    ("html-css", "HTML & CSS", HTML_CSS_QUESTIONS, 9),
    ("sql", "SQL", SQL_QUESTIONS, 10),
    ("dbms", "DBMS", DBMS_QUESTIONS, 8),
    ("operating-systems", "Operating Systems", OS_QUESTIONS, 8),
    ("computer-networks", "Computer Networks", CN_QUESTIONS, 8),
    ("data-structures", "Data Structures", DS_QUESTIONS, 8),
    ("aptitude-reasoning", "Aptitude & Reasoning", APTITUDE_QUESTIONS, 8),
]

for slug, label, bank, split_point in _banks:
    fundamentals, practice = _split_bank(bank, split_point)

    _register(
        slug,
        f"{label} Fundamentals",
        f"{slug}-fundamentals",
        f"A well-rounded warm-up covering the core building blocks of {label}. "
        f"Perfect if you're starting out or want a quick refresher.",
        "Beginner",
        max(len(fundamentals), 5),
        fundamentals,
    )
    _register(
        slug,
        f"{label} Practice Test",
        f"{slug}-practice-test",
        f"A tougher set of {label} questions covering intermediate-to-advanced concepts, "
        f"ideal for interview and exam preparation.",
        "Intermediate",
        max(len(practice), 5),
        practice,
    )

# --- Achievements ----------------------------------------------------------
# (code, title, description, icon, xp_reward)
ACHIEVEMENTS = [
    ("first_quiz", "First Quiz", "Complete your very first quiz.", "flag", 20),
    ("perfect_score", "Perfect Score", "Score 100% on any quiz.", "star", 50),
    ("ten_quizzes", "10 Quizzes Completed", "Complete 10 quizzes.", "target", 75),
    ("hundred_questions", "100 Questions Answered", "Answer 100 questions in total.", "check-circle", 40),
    ("five_hundred_questions", "500 Questions", "Answer 500 questions in total.", "layers", 150),
    ("seven_day_streak", "7-Day Streak", "Practice for 7 days in a row.", "flame", 60),
    ("speed_solver", "Speed Solver", "Finish a quiz quickly with a strong score.", "zap", 45),
    ("python_master", "Python Master", "Average 90%+ across at least 3 Python quizzes.", "award", 100),
    ("sql_master", "SQL Master", "Average 90%+ across at least 3 SQL quizzes.", "award", 100),
]
