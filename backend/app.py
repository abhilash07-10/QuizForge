import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import config_by_name
from models import db


def create_app(config_name: str = None) -> Flask:
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    db.init_app(app)

    # CORS: allow the configured frontend origin (comma-separated list
    # supported for local + deployed frontends at once).
    origins = [o.strip() for o in app.config["FRONTEND_URL"].split(",") if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": origins or "*"}}, supports_credentials=False)

    register_blueprints(app)
    register_error_handlers(app)

    @app.get("/api/health")
    def health_check():
        return jsonify({"status": "ok", "service": "QuizForge API"}), 200

    return app


def register_blueprints(app: Flask) -> None:
    from routes.auth import auth_bp
    from routes.quizzes import quizzes_bp
    from routes.attempts import attempts_bp
    from routes.results import results_bp
    from routes.leaderboard import leaderboard_bp
    from routes.achievements import achievements_bp
    from routes.profile import profile_bp
    from routes.progress import progress_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(quizzes_bp)
    app.register_blueprint(attempts_bp)
    app.register_blueprint(results_bp)
    app.register_blueprint(leaderboard_bp)
    app.register_blueprint(achievements_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(progress_bp)


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "The requested resource was not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def server_error(e):
        # Never leak stack traces / internal details to the client.
        app.logger.exception("Unhandled server error")
        return jsonify({"error": "Something went wrong on our end. Please try again."}), 500

    @app.errorhandler(Exception)
    def handle_unexpected(e):
        from werkzeug.exceptions import HTTPException

        if isinstance(e, HTTPException):
            return jsonify({"error": e.description}), e.code
        app.logger.exception("Unhandled exception")
        return jsonify({"error": "Something went wrong on our end. Please try again."}), 500


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", False))
