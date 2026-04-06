"""
Integration tests for API endpoints.

These use Flask's test client to make real HTTP requests to the app
— but everything runs in memory, no actual server needed.
"""

import io
import time


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

    def test_upload_precalculated_csv(self, client, sample_csv_with_distance):
        data = {"file": (sample_csv_with_distance, "test.csv")}
        resp = client.post("/api/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["has_distance_column"] is True

        job_id = body["job_id"]

        # Wait for background processing
        for _ in range(20):
            progress = client.get(f"/api/progress/{job_id}").get_json()
            if progress["status"] == "complete":
                break
            time.sleep(0.25)

        stats_resp = client.get(f"/api/stats/{job_id}")
        assert stats_resp.status_code == 200
        stats = stats_resp.get_json()
        assert stats["total_orders"] == 5


class TestJobManagement:

    def test_list_jobs_empty(self, client):
        resp = client.get("/api/jobs")
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_delete_nonexistent_job_returns_404(self, client):
        resp = client.delete("/api/jobs/nonexistent")
        assert resp.status_code == 404

    def test_upload_then_delete(self, client, sample_csv):
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
