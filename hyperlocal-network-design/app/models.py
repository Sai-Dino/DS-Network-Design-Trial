"""
Database models.

These classes define the structure of our database tables — like a
blueprint for a house.  SQLAlchemy automatically creates the actual
tables when the app starts.

Currently used for **job metadata persistence** so that a server
restart doesn't lose track of previous jobs.  The heavy runtime
data (DataFrames, result lists) still lives in-memory for speed,
but the metadata survives restarts.
"""

from datetime import datetime, timezone

from app.extensions import db


class Job(db.Model):
    """
    Persistent record of an uploaded dataset and its processing status.

    Think of it as a "receipt" — even if the server restarts, you can
    still see what was uploaded, when, and what happened.
    """

    __tablename__ = "jobs"

    id = db.Column(db.String(36), primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    total_rows = db.Column(db.Integer, default=0)
    store_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="idle")
    processed_rows = db.Column(db.Integer, default=0)
    failed_rows = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text, nullable=True)

    # Stats snapshot (JSON blob) — stored on completion so the dashboard
    # can load instantly without recomputing from raw results.
    stats_json = db.Column(db.Text, nullable=True)

    # Threshold that was active at completion (for reference)
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
    """
    Immutable log of significant actions — who did what, when.
    Useful for compliance, debugging, and understanding usage patterns.
    """

    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    action = db.Column(db.String(50), nullable=False)  # e.g. "upload", "calculate", "download"
    job_id = db.Column(db.String(36), db.ForeignKey("jobs.id"), nullable=True)
    details = db.Column(db.Text, nullable=True)  # JSON string with extra info
    ip_address = db.Column(db.String(45), nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.action} @ {self.timestamp}>"
