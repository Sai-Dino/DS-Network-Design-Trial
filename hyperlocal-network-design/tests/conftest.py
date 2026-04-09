"""
Shared test fixtures.

Each test gets a fresh app with an in-memory SQLite database, a
temporary data directory, and a pre-authenticated test client.
"""

import io
import os

import pytest

from app import create_app
from app.config import Testing
from app.extensions import bcrypt, db as _db
from app.models import User


@pytest.fixture()
def app(tmp_path):
    """Create an app configured for testing with temp data directory."""
    Testing.DATA_DIR = str(tmp_path / "data")
    os.makedirs(os.path.join(Testing.DATA_DIR, "uploads"), exist_ok=True)
    os.makedirs(os.path.join(Testing.DATA_DIR, "results"), exist_ok=True)

    application = create_app(Testing)
    with application.app_context():
        _db.create_all()

        pw = bcrypt.generate_password_hash("testpass").decode("utf-8")
        test_user = User(username="testuser", password_hash=pw, display_name="Test User")
        _db.session.add(test_user)
        _db.session.commit()

        yield application
        _db.session.remove()


@pytest.fixture()
def client(app):
    """An authenticated test client."""
    c = app.test_client()
    c.post("/api/auth/login", json={"username": "testuser", "password": "testpass"})
    return c


@pytest.fixture()
def anon_client(app):
    """A test client with NO login (for testing auth enforcement)."""
    return app.test_client()


@pytest.fixture()
def sample_csv():
    """A tiny CSV file in memory for upload tests."""
    content = (
        "Order ID,Lat Order,Long Order,Dark Store,Lat Store,Long Store\n"
        "O001,12.9716,77.5946,STORE_A,12.9800,77.6000\n"
        "O002,12.9750,77.5900,STORE_A,12.9800,77.6000\n"
        "O003,12.9600,77.6100,STORE_B,12.9650,77.6050\n"
    )
    return io.BytesIO(content.encode("utf-8"))


@pytest.fixture()
def sample_csv_with_distance():
    """A CSV with pre-calculated distances."""
    content = (
        "Order ID,Lat Order,Long Order,Dark Store,Lat Store,Long Store,distance_km\n"
        "O001,12.9716,77.5946,STORE_A,12.9800,77.6000,1.5\n"
        "O002,12.9750,77.5900,STORE_A,12.9800,77.6000,2.3\n"
        "O003,12.9600,77.6100,STORE_B,12.9650,77.6050,0.8\n"
        "O004,12.9500,77.6200,STORE_B,12.9650,77.6050,4.5\n"
        "O005,12.9400,77.6300,STORE_B,12.9650,77.6050,6.2\n"
    )
    return io.BytesIO(content.encode("utf-8"))
