"""
Database models.

``User``  — login credentials (username + bcrypt password hash).
``Job``   — uploaded dataset metadata, with a foreign key to the owning user.
"""

from datetime import datetime, timezone

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    display_name = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    jobs = db.relationship("Job", backref="owner", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name or self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User {self.username}>"


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    total_rows = db.Column(db.Integer, default=0)
    store_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="idle")
    processed_rows = db.Column(db.Integer, default=0)
    failed_rows = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text, nullable=True)

    mapping_json = db.Column(db.Text, nullable=True)
    stats_json = db.Column(db.Text, nullable=True)
    stores_json = db.Column(db.Text, nullable=True)
    has_distance_column = db.Column(db.Boolean, default=False)

    upload_path = db.Column(db.String(500), nullable=True)
    results_path = db.Column(db.String(500), nullable=True)

    threshold = db.Column(db.Float, default=3.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.id,
            "filename": self.filename,
            "rows": self.total_rows,
            "stores": self.store_count,
            "status": self.status,
            "processed": self.processed_rows,
            "failed": self.failed_rows,
            "error": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

    def __repr__(self):
        return f"<Job {self.id} [{self.status}] {self.filename}>"


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    action = db.Column(db.String(50), nullable=False)
    job_id = db.Column(db.String(36), db.ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.action} @ {self.timestamp}>"
