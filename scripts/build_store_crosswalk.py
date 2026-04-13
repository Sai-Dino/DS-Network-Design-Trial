#!/usr/bin/env python3
"""Build a crosswalk from the old 103-store master to the 151-store master."""

from __future__ import annotations

import argparse
import csv
import math
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class StoreSite:
    site_id: str
    store_code: str
    lat: float
    lon: float
    status: str = ""


def normalize_site_id(site_id: str) -> str:
    return site_id.strip().lower()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    return 2.0 * radius_km * math.asin(math.sqrt(a))


def load_old_sites(path: Path) -> dict[str, StoreSite]:
    sites: dict[str, StoreSite] = {}
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            site_id = (row.get("site_ID") or "").strip()
            if not site_id:
                continue
            key = normalize_site_id(site_id)
            if key in sites:
                continue
            sites[key] = StoreSite(
                site_id=site_id,
                store_code=(row.get("store code") or "").strip(),
                lat=float(row["Store Latitude"]),
                lon=float(row["Store Longitude"]),
            )
    return sites


def load_new_sites(path: Path) -> dict[str, StoreSite]:
    sites: dict[str, StoreSite] = {}
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            site_id = (row.get("Site ID") or "").strip()
            if not site_id:
                continue
            key = normalize_site_id(site_id)
            if key in sites:
                continue
            sites[key] = StoreSite(
                site_id=site_id,
                store_code=(row.get("store_code") or "").strip(),
                lat=float(row["Store Latitude"]),
                lon=float(row["Store Longitude"]),
                status=(row.get("Store Status") or "").strip(),
            )
    return sites


def confidence_for_match(match_type: str, distance_km: float, status: str) -> str:
    if match_type == "exact_id":
        return "high"
    status_ok = status.strip().lower() == "live"
    if distance_km <= 0.5 and status_ok:
        return "high"
    if distance_km <= 1.0 and status_ok:
        return "medium"
    if distance_km <= 1.5 and status_ok:
        return "low"
    return "review"


def review_flag(confidence: str, distance_km: float, status: str) -> str:
    if confidence == "review":
        return "manual_review"
    if distance_km > 1.5:
        return "manual_review"
    if status and status.strip().lower() != "live":
        return "manual_review"
    return ""


def build_crosswalk(old_sites: dict[str, StoreSite], new_sites: dict[str, StoreSite]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    new_site_values = list(new_sites.values())

    for old_key in sorted(old_sites):
        old_site = old_sites[old_key]
        exact_match = new_sites.get(old_key)
        if exact_match:
            rows.append(
                {
                    "old_site_id": old_site.site_id,
                    "old_store_code": old_site.store_code,
                    "old_latitude": f"{old_site.lat:.6f}",
                    "old_longitude": f"{old_site.lon:.6f}",
                    "new_site_id": exact_match.site_id,
                    "new_store_code": exact_match.store_code,
                    "new_status": exact_match.status,
                    "match_type": "exact_id",
                    "distance_km": "0.000",
                    "confidence": "high",
                    "review_flag": "",
                }
            )
            continue

        nearest = min(
            new_site_values,
            key=lambda candidate: haversine_km(
                old_site.lat,
                old_site.lon,
                candidate.lat,
                candidate.lon,
            ),
        )
        distance_km = haversine_km(
            old_site.lat,
            old_site.lon,
            nearest.lat,
            nearest.lon,
        )
        confidence = confidence_for_match("nearest_coord", distance_km, nearest.status)
        rows.append(
            {
                "old_site_id": old_site.site_id,
                "old_store_code": old_site.store_code,
                "old_latitude": f"{old_site.lat:.6f}",
                "old_longitude": f"{old_site.lon:.6f}",
                "new_site_id": nearest.site_id,
                "new_store_code": nearest.store_code,
                "new_status": nearest.status,
                "match_type": "nearest_coord",
                "distance_km": f"{distance_km:.3f}",
                "confidence": confidence,
                "review_flag": review_flag(confidence, distance_km, nearest.status),
            }
        )
    return rows


def write_crosswalk(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "old_site_id",
        "old_store_code",
        "old_latitude",
        "old_longitude",
        "new_site_id",
        "new_store_code",
        "new_status",
        "match_type",
        "distance_km",
        "confidence",
        "review_flag",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def print_summary(rows: list[dict[str, object]]) -> None:
    exact = sum(1 for row in rows if row["match_type"] == "exact_id")
    nearest = sum(1 for row in rows if row["match_type"] == "nearest_coord")
    manual = sum(1 for row in rows if row["review_flag"])
    print(f"crosswalk_rows={len(rows)}")
    print(f"exact_id_matches={exact}")
    print(f"nearest_coord_matches={nearest}")
    print(f"manual_review_rows={manual}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--old", required=True, type=Path, help="CSV for old 103 stores")
    parser.add_argument("--new", required=True, type=Path, help="CSV for 151 stores")
    parser.add_argument("--out", required=True, type=Path, help="Output crosswalk CSV")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    old_sites = load_old_sites(args.old)
    new_sites = load_new_sites(args.new)
    rows = build_crosswalk(old_sites, new_sites)
    write_crosswalk(args.out, rows)
    print_summary(rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
