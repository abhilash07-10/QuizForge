from flask import Blueprint, jsonify, g

from models.achievement import Achievement, UserAchievement
from utils.auth import login_required

achievements_bp = Blueprint("achievements", __name__, url_prefix="/api/achievements")


@achievements_bp.get("")
@login_required
def list_achievements():
    """Returns every achievement in the system, flagged with whether the
    current user has unlocked it (and when)."""
    all_achievements = Achievement.query.all()
    unlocked = {
        ua.achievement_id: ua.unlocked_at
        for ua in UserAchievement.query.filter_by(user_id=g.current_user.id).all()
    }

    data = []
    for a in all_achievements:
        item = a.to_dict()
        item["unlocked"] = a.id in unlocked
        item["unlockedAt"] = unlocked[a.id].isoformat() if a.id in unlocked else None
        data.append(item)

    return jsonify({"achievements": data}), 200
