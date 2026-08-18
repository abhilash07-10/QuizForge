from . import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    icon = db.Column(db.String(50), nullable=True)  # icon keyword used by the frontend icon map

    quizzes = db.relationship("Quiz", backref="category", lazy="dynamic")

    def to_dict(self, include_stats: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "icon": self.icon,
        }
        if include_stats:
            data["quizCount"] = self.quizzes.count()
        return data
