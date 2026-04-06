"""
Flask extensions — instantiated here so that any module can import them
without creating circular imports.

Think of this as a "shared toolbox" that every part of the app can reach into.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()
