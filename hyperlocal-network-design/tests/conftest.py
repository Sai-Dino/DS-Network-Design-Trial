"""
Shared test fixtures.

A "fixture" is setup code that runs before each test.  For example,
``client`` gives every test a fake browser that can call our API
without starting a real server.

The database is created fresh in memory for each test — tests never
interfere with each other or with real data.
"""

import io

import pytest

from app import create_app
from app.config import Testing
from app.extensions import db as _db


@pytest.fixture()
def app():
    """Create an app configured for testing (in-memory SQLite)."""
    application = create_app(Testing)
    with application.app_context():
        _db.create_all()

        from app.routes.api import JOBS, JOBS_LOCK
        with JOBS_LOCK:
            JOBS.clear()

        yield application

        with JOBS_LOCK:
            JOBS.clear()

        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    """A test client — like a fake browser that can call API routes."""
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
