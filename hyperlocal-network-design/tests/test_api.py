"""
Integration tests for API endpoints.

All state is now persisted via DB + filesystem.  Tests verify that the
API routes work correctly through the storage layer.
"""

import io
import json
import os
import time

import pandas as pd
import pytest


class TestHealthEndpoint:

    def test_health_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "healthy"
        assert "uptime_seconds" in data


class TestUploadEndpoint:

    def test_upload_no_file_returns_400(self, client):
        resp = client.post("/api/upload")
        assert resp.status_code == 400

    def test_upload_invalid_extension_returns_400(self, client):
        data = {"file": (io.BytesIO(b"hello"), "test.txt")}
        resp = client.post("/api/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400

    def test_upload_valid_csv(self, client, sample_csv):
        data = {"file": (sample_csv, "test.csv")}
        resp = client.post("/api/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["rows"] == 3
        assert "job_id" in body
        assert body["has_distance_column"] is False

    def test_upload_creates_db_record(self, app, client, sample_csv):
        data = {"file": (sample_csv, "test.csv")}
        resp = client.post("/api/upload", data=data, content_type="multipart/form-data")
        job_id = resp.get_json()["job_id"]

        from app.services.storage import get_job
        with app.app_context():
            job = get_job(job_id)
            assert job is not None
            assert job.filename == "test.csv"
            assert job.total_rows == 3

    def test_upload_saves_parquet_to_disk(self, app, client, sample_csv):
        data = {"file": (sample_csv, "test.csv")}
        resp = client.post("/api/upload", data=data, content_type="multipart/form-data")
        job_id = resp.get_json()["job_id"]

        from app.services.storage import get_job
        with app.app_context():
            job = get_job(job_id)
            assert job.upload_path is not None
            assert os.path.exists(job.upload_path)
            df = pd.read_parquet(job.upload_path)
            assert len(df) == 3

    def test_upload_precalculated_csv(self, client, sample_csv_with_distance):
        data = {"file": (sample_csv_with_distance, "test.csv")}
        resp = client.post("/api/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["has_distance_column"] is True

        job_id = body["job_id"]

        for _ in range(40):
            progress = client.get(f"/api/progress/{job_id}").get_json()
            if progress["status"] == "complete":
                break
            time.sleep(0.25)

        stats_resp = client.get(f"/api/stats/{job_id}")
        assert stats_resp.status_code == 200
        stats = stats_resp.get_json()
        assert stats["total_orders"] == 5

    def test_precalculated_results_survive_reload(self, app, client, sample_csv_with_distance):
        """Results are stored on disk, not in memory."""
        data = {"file": (sample_csv_with_distance, "test.csv")}
        resp = client.post("/api/upload", data=data, content_type="multipart/form-data")
        job_id = resp.get_json()["job_id"]

        for _ in range(40):
            progress = client.get(f"/api/progress/{job_id}").get_json()
            if progress["status"] == "complete":
                break
            time.sleep(0.25)

        from app.services.storage import get_job, load_results
        with app.app_context():
            job = get_job(job_id)
            assert job.results_path is not None
            assert os.path.exists(job.results_path)
            results = load_results(job_id)
            assert len(results) == 5


class TestJobManagement:

    def test_list_jobs_empty(self, client):
        resp = client.get("/api/jobs")
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_delete_nonexistent_job_returns_404(self, client):
        resp = client.delete("/api/jobs/nonexistent")
        assert resp.status_code == 404

    def test_upload_then_delete(self, app, client, sample_csv):
        upload_resp = client.post(
            "/api/upload",
            data={"file": (sample_csv, "test.csv")},
            content_type="multipart/form-data",
        )
        job_id = upload_resp.get_json()["job_id"]

        jobs = client.get("/api/jobs").get_json()
        assert len(jobs) == 1

        del_resp = client.delete(f"/api/jobs/{job_id}")
        assert del_resp.status_code == 200

        jobs = client.get("/api/jobs").get_json()
        assert len(jobs) == 0

    def test_delete_removes_files(self, app, client, sample_csv):
        upload_resp = client.post(
            "/api/upload",
            data={"file": (sample_csv, "test.csv")},
            content_type="multipart/form-data",
        )
        job_id = upload_resp.get_json()["job_id"]

        from app.services.storage import get_job
        with app.app_context():
            job = get_job(job_id)
            upload_path = job.upload_path

        assert os.path.exists(upload_path)
        client.delete(f"/api/jobs/{job_id}")
        assert not os.path.exists(upload_path)


class TestStorageLayer:
    """Direct tests of the storage service."""

    def test_create_and_get_job(self, app, sample_csv):
        import pandas as pd
        from app.services import storage

        with app.app_context():
            df = pd.read_csv(sample_csv)
            mapping = {"store_id": "Dark Store", "order_id": "Order ID",
                        "store_lat": "Lat Store", "store_lon": "Long Store",
                        "order_lat": "Lat Order", "order_lon": "Long Order"}
            job = storage.create_job("test-123", "test.csv", df, mapping, False)

            loaded = storage.get_job("test-123")
            assert loaded is not None
            assert loaded.filename == "test.csv"
            assert loaded.total_rows == 3

    def test_save_and_load_results(self, app, sample_csv):
        import pandas as pd
        from app.services import storage

        with app.app_context():
            df = pd.read_csv(sample_csv)
            mapping = {"store_id": "Dark Store", "order_id": "Order ID",
                        "store_lat": "Lat Store", "store_lon": "Long Store",
                        "order_lat": "Lat Order", "order_lon": "Long Order"}
            storage.create_job("test-456", "test.csv", df, mapping, False)

            results = [
                {"order_id": "O001", "store_id": "STORE_A", "distance_km": 1.5},
                {"order_id": "O002", "store_id": "STORE_A", "distance_km": 2.3},
            ]
            storage.complete_job("test-456", results, df, mapping, 1)

            loaded = storage.load_results("test-456")
            assert len(loaded) == 2
            assert loaded[0]["distance_km"] == pytest.approx(1.5)

            job = storage.get_job("test-456")
            assert job.status == "complete"
            assert job.failed_rows == 1

    def test_checkpoint_save_and_load(self, app, sample_csv):
        import pandas as pd
        from app.services import storage

        with app.app_context():
            df = pd.read_csv(sample_csv)
            mapping = {"store_id": "Dark Store", "order_id": "Order ID",
                        "store_lat": "Lat Store", "store_lon": "Long Store",
                        "order_lat": "Lat Order", "order_lon": "Long Order"}
            storage.create_job("test-cp", "test.csv", df, mapping, False)

            partial = [{"order_id": "O001", "store_id": "STORE_A", "distance_km": 1.5}]
            storage.save_checkpoint("test-cp", partial, 1)

            loaded = storage.load_checkpoint("test-cp")
            assert loaded is not None
            assert len(loaded) == 1

            storage.clear_checkpoint("test-cp")
            assert storage.load_checkpoint("test-cp") is None

    def test_mapping_persistence(self, app, sample_csv):
        import pandas as pd
        from app.services import storage

        with app.app_context():
            df = pd.read_csv(sample_csv)
            mapping = {"store_id": "Dark Store", "order_id": "Order ID",
                        "store_lat": "Lat Store", "store_lon": "Long Store",
                        "order_lat": "Lat Order", "order_lon": "Long Order"}
            storage.create_job("test-map", "test.csv", df, mapping, False)

            loaded_mapping = storage.get_mapping("test-map")
            assert loaded_mapping["store_id"] == "Dark Store"
            assert loaded_mapping["order_lat"] == "Lat Order"


class TestValidation:

    def test_osrm_ssrf_blocked(self, client, sample_csv):
        upload_resp = client.post(
            "/api/upload",
            data={"file": (sample_csv, "test.csv")},
            content_type="multipart/form-data",
        )
        job_id = upload_resp.get_json()["job_id"]

        resp = client.post(
            f"/api/calculate/{job_id}",
            json={"osrm_url": "http://evil.example.com:5000"},
        )
        assert resp.status_code == 400
        assert "not in the allow-list" in resp.get_json()["error"]


class TestDashboardEndpoints:
    """Test chart/stats endpoints after precalculated upload."""

    @pytest.fixture()
    def completed_job_id(self, client, sample_csv_with_distance):
        data = {"file": (sample_csv_with_distance, "test.csv")}
        resp = client.post("/api/upload", data=data, content_type="multipart/form-data")
        job_id = resp.get_json()["job_id"]

        for _ in range(40):
            progress = client.get(f"/api/progress/{job_id}").get_json()
            if progress["status"] == "complete":
                break
            time.sleep(0.25)

        return job_id

    def test_network_analysis(self, client, completed_job_id):
        resp = client.get(f"/api/network-analysis/{completed_job_id}?threshold=3")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "coverage_pct" in data
        assert "store_analysis" in data

    def test_stores_endpoint(self, client, completed_job_id):
        resp = client.get(f"/api/stores/{completed_job_id}")
        assert resp.status_code == 200
        stores = resp.get_json()
        assert isinstance(stores, list)
        assert len(stores) > 0

    def test_table_endpoint(self, client, completed_job_id):
        resp = client.get(f"/api/table/{completed_job_id}?page=1&per_page=10")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "data" in data
        assert "total" in data
        assert len(data["data"]) > 0

    def test_download_endpoint(self, client, completed_job_id):
        resp = client.get(f"/api/download/{completed_job_id}")
        assert resp.status_code == 200
        assert resp.content_type == "text/csv; charset=utf-8"

    def test_map_endpoint(self, client, completed_job_id):
        resp = client.get(f"/api/map/{completed_job_id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "stores" in data
        assert "orders" in data

    def test_daily_chart(self, client, completed_job_id):
        resp = client.get(f"/api/chart/daily/{completed_job_id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "labels" in data
        assert "orders" in data

    def test_store_avg_chart(self, client, completed_job_id):
        resp = client.get(f"/api/chart/store_avg/{completed_job_id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "labels" in data
        assert "values" in data

    def test_store_orders_chart(self, client, completed_job_id):
        resp = client.get(f"/api/chart/store_orders/{completed_job_id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "labels" in data
        assert "values" in data


class TestAuth:
    """Tests for login, logout, and session enforcement."""

    def test_unauthenticated_api_returns_401(self, anon_client):
        resp = anon_client.get("/api/jobs")
        assert resp.status_code == 401

    def test_health_is_public(self, anon_client):
        resp = anon_client.get("/health")
        assert resp.status_code == 200

    def test_login_success(self, anon_client):
        resp = anon_client.post("/api/auth/login", json={"username": "testuser", "password": "testpass"})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["user"]["username"] == "testuser"

    def test_login_wrong_password(self, anon_client):
        resp = anon_client.post("/api/auth/login", json={"username": "testuser", "password": "wrong"})
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, anon_client):
        resp = anon_client.post("/api/auth/login", json={"username": "nobody", "password": "x"})
        assert resp.status_code == 401

    def test_me_after_login(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.get_json()["user"]["username"] == "testuser"

    def test_logout_clears_session(self, client):
        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200

        resp = client.get("/api/jobs")
        assert resp.status_code == 401

    def test_jobs_isolated_per_user(self, app, client, sample_csv):
        upload_resp = client.post(
            "/api/upload",
            data={"file": (sample_csv, "test.csv")},
            content_type="multipart/form-data",
        )
        assert upload_resp.status_code == 200

        jobs = client.get("/api/jobs").get_json()
        assert len(jobs) == 1

        from app.extensions import bcrypt, db
        from app.models import User
        with app.app_context():
            pw = bcrypt.generate_password_hash("pass2").decode("utf-8")
            user2 = User(username="user2", password_hash=pw)
            db.session.add(user2)
            db.session.commit()

        client2 = app.test_client()
        client2.post("/api/auth/login", json={"username": "user2", "password": "pass2"})
        jobs2 = client2.get("/api/jobs").get_json()
        assert len(jobs2) == 0

    def test_signup_success(self, anon_client):
        resp = anon_client.post("/api/auth/signup", json={
            "username": "newguy",
            "password": "secret",
            "display_name": "New Guy",
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["user"]["username"] == "newguy"
        assert data["user"]["display_name"] == "New Guy"

        me_resp = anon_client.get("/api/auth/me")
        assert me_resp.status_code == 200

    def test_signup_duplicate_username(self, anon_client):
        resp = anon_client.post("/api/auth/signup", json={"username": "testuser", "password": "abcd"})
        assert resp.status_code == 409

    def test_signup_short_password(self, anon_client):
        resp = anon_client.post("/api/auth/signup", json={"username": "x_user", "password": "ab"})
        assert resp.status_code == 400

    def test_signup_bad_username(self, anon_client):
        resp = anon_client.post("/api/auth/signup", json={"username": "a@b", "password": "abcdef"})
        assert resp.status_code == 400
