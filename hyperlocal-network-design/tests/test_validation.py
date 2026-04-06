"""Tests for input validation utilities."""

from app.utils.validation import allowed_file, safe_float, safe_int, validate_osrm_url


class TestAllowedFile:

    def test_csv_allowed(self):
        assert allowed_file("data.csv") is True

    def test_xlsx_allowed(self):
        assert allowed_file("data.xlsx") is True

    def test_txt_rejected(self):
        assert allowed_file("data.txt") is False

    def test_no_extension_rejected(self):
        assert allowed_file("noextension") is False


class TestOsrmValidation:

    def test_localhost_allowed(self):
        assert validate_osrm_url("http://localhost:5000", ["localhost"]) is None

    def test_external_host_blocked(self):
        err = validate_osrm_url("http://evil.com:5000", ["localhost"])
        assert err is not None
        assert "not in the allow-list" in err


class TestSafeInt:

    def test_valid_int(self):
        assert safe_int("42") == 42

    def test_invalid_returns_default(self):
        assert safe_int("abc", default=10) == 10

    def test_min_max_clamping(self):
        assert safe_int("500", minimum=1, maximum=100) == 100
        assert safe_int("-5", minimum=0) == 0


class TestSafeFloat:

    def test_valid(self):
        assert safe_float("3.14") == 3.14

    def test_nan_returns_default(self):
        assert safe_float(float("nan"), default=0.0) == 0.0

    def test_none_returns_default(self):
        assert safe_float(None, default=99.0) == 99.0
