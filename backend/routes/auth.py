from flask import Blueprint, request, jsonify, g

from models import db
from models.user import User
from utils.validators import is_valid_email, password_strength_errors
from utils.auth import generate_token, login_required
from utils.rate_limit import rate_limited

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
@rate_limited(max_requests=10, window_seconds=60)
def register():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("fullName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm_password = data.get("confirmPassword") or ""

    errors = {}

    if not full_name or len(full_name) < 2:
        errors["fullName"] = "Please enter your full name."

    if not is_valid_email(email):
        errors["email"] = "Please enter a valid email address."
    elif User.query.filter_by(email=email).first():
        errors["email"] = "An account with this email already exists."

    pw_errors = password_strength_errors(password)
    if pw_errors:
        errors["password"] = pw_errors[0]

    if password != confirm_password:
        errors["confirmPassword"] = "Passwords do not match."

    if errors:
        return jsonify({"error": "Please fix the errors below.", "fields": errors}), 400

    user = User(full_name=full_name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_public_dict()}), 201


@auth_bp.post("/login")
@rate_limited(max_requests=10, window_seconds=60)
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_public_dict()}), 200


@auth_bp.post("/logout")
@login_required
def logout():
    # Tokens are stateless (JWT); logout is handled client-side by
    # discarding the token. This endpoint exists for a clean API surface
    # and could be extended with a server-side token blocklist later.
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.get("/me")
@login_required
def me():
    return jsonify({"user": g.current_user.to_public_dict()}), 200
