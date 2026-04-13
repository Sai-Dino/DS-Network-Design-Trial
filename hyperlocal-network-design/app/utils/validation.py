"""Request-level input validation helpers."""

from typing import List, Optional
from urllib.parse import urlparse

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_osrm_url(url: str, allowed_hosts: List[str]) -> Optional[str]:
    """
    Return an error string if the URL is not on the allow-list, else None.

    Prevents SSRF — stops attackers from tricking the server into making
    requests to internal services (e.g. http://169.254.169.254/ on AWS).
    """
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    if hostname not in allowed_hosts:
        return f"OSRM host '{hostname}' is not in the allow-list: {allowed_hosts}"
    return None


def safe_int(value, default: int = 0, minimum: Optional[int] = None, maximum: Optional[int] = None) -> int:
    try:
        v = int(value)
    except (TypeError, ValueError):
        return default
    if minimum is not None:
        v = max(v, minimum)
    if maximum is not None:
        v = min(v, maximum)
    return v


def safe_float(value, default: float = 0.0) -> float:
    try:
        v = float(value)
        return default if v != v else v  # NaN check
    except (TypeError, ValueError):
        return default
