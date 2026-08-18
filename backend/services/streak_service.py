from datetime import date, timedelta

from models.user import User


def register_activity(user: User) -> None:
    """Updates a user's streak counters for "today's" activity.

    Rules:
    - First-ever activity -> streak becomes 1.
    - Activity on the same day as the last recorded activity -> streak
      unchanged (never double-counted).
    - Activity exactly one day after the last recorded activity -> streak
      increments by 1.
    - Any larger gap -> streak resets to 1.
    """
    today = date.today()

    if user.last_activity_date == today:
        return  # already logged today, do not increment again

    if user.last_activity_date == today - timedelta(days=1):
        user.current_streak += 1
    else:
        user.current_streak = 1

    user.longest_streak = max(user.longest_streak, user.current_streak)
    user.last_activity_date = today
