import datetime
from functools import wraps

import jwt
from flask import request, jsonify, current_app, g

from models import db
from models.user import User


def generate_token(user: User) -> str:
    payload = {
        "sub": user.public_id,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + current_app.config["JWT_ACCESS_TOKEN_EXPIRES"],
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token: str):
    return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])


def login_required(f):
    """Protects a route: requires a valid `Authorization: Bearer <token>`
    header and attaches the authenticated user to `g.current_user`."""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = None
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

        if not token:
            return jsonify({"error": "Authentication required."}), 401

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token."}), 401

        user = User.query.filter_by(public_id=payload.get("sub")).first()
        if not user:
            return jsonify({"error": "User not found."}), 401

        g.current_user = user
        return f(*args, **kwargs)

    return decorated
