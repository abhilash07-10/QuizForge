DIFFICULTY_MULTIPLIER = {"Beginner": 1.0, "Intermediate": 1.3, "Advanced": 1.6}

BASE_XP_PER_CORRECT = 10
PERFECT_SCORE_BONUS = 50
FIRST_ATTEMPT_BONUS = 20
STREAK_BONUS_PER_DAY = 5
STREAK_BONUS_CAP = 50


def calculate_xp(
    *,
    correct_count: int,
    total_questions: int,
    difficulty: str,
    is_first_attempt: bool,
    current_streak: int,
) -> int:
    multiplier = DIFFICULTY_MULTIPLIER.get(difficulty, 1.0)
    xp = correct_count * BASE_XP_PER_CORRECT * multiplier

    if total_questions and correct_count == total_questions:
        xp += PERFECT_SCORE_BONUS

    if is_first_attempt:
        xp += FIRST_ATTEMPT_BONUS

    xp += min(current_streak * STREAK_BONUS_PER_DAY, STREAK_BONUS_CAP)

    return int(round(xp))
