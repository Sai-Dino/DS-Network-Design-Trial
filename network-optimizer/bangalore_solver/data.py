from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List, Sequence

import numpy as np
import pandas as pd

import server

from .config import BangaloreSolverConfig
from .contracts import DemandCluster, LoadedBangaloreData, SolverSite


def _load_demand_cells(config: BangaloreSolverConfig) -> pd.DataFrame:
    header_df = pd.read_csv(config.order_csv_path, nrows=5)
    mapping = server.detect_columns(header_df)
    rename_map = {mapping[key]: key for key in mapping}
    usecols = list(set(rename_map.keys()))
    df = pd.read_csv(config.order_csv_path, usecols=usecols)
    df = df.rename(columns=rename_map)
    df = df.dropna(subset=["customer_lat", "customer_lon"])
    if "orders_per_day" not in df.columns:
        df["orders_per_day"] = pd.to_numeric(df["order_count"], errors="coerce")
    else:
        df["orders_per_day"] = pd.to_numeric(df["orders_per_day"], errors="coerce")
    df = df.dropna(subset=["orders_per_day"])
    df = df[df["orders_per_day"] > 0].copy()
    df["cell_lat"] = pd.to_numeric(df["customer_lat"], errors="coerce").round(3)
    df["cell_lon"] = pd.to_numeric(df["customer_lon"], errors="coerce").round(3)
    grid = (
        df.groupby(["cell_lat", "cell_lon"], as_index=False)
        .agg(
            orders_per_day=("orders_per_day", "sum"),
            avg_cust_lat=("customer_lat", "mean"),
            avg_cust_lon=("customer_lon", "mean"),
        )
        .sort_values(["cell_lat", "cell_lon"], ascending=True)
        .reset_index(drop=True)
    )
    grid["grid_id"] = [
        f"grid-{idx:05d}" for idx in range(len(grid))
    ]
    return grid


def _load_business_regions(config: BangaloreSolverConfig) -> List[Dict[str, Any]]:
    df = server._load_store_dataframe(str(config.scope_csv_path))
    df.columns = [str(col).strip() for col in df.columns]
    site_id_col = server._find_col(df.columns, ["site id", "site_id", "id"])
    store_code_col = server._find_col(df.columns, ["store_code", "store code"])
    store_lat_col = server._find_col(df.columns, ["store latitude", "store_latitude", "latitude", "lat"])
    store_lon_col = server._find_col(df.columns, ["store longitude", "store_longitude", "longitude", "lon"])
    point_lat_col = server._find_col(df.columns, ["point latitude", "point_latitude"])
    point_lon_col = server._find_col(df.columns, ["point longitude", "point_longitude"])
    edge_col = server._find_col(df.columns, ["polygon_edge", "polygon edge", "edge"])
    group_col = site_id_col or store_code_col
    if group_col is None:
        raise ValueError("Could not identify polygon grouping column in the Bangalore scope file.")

    business_regions: List[Dict[str, Any]] = []
    for group_id, group in df.groupby(group_col, dropna=True, sort=False):
        row0 = group.iloc[0]
        poly_coords = server._rows_to_polygon_coords(group, point_lat_col, point_lon_col, edge_col=edge_col)
        if not poly_coords:
            continue
        business_regions.append(
            {
                "id": str(group_id).strip(),
                "store_code": str(row0.get(store_code_col) or "").strip() if store_code_col else "",
                "lat": float(row0[store_lat_col]) if store_lat_col else float(poly_coords[0][0]),
                "lon": float(row0[store_lon_col]) if store_lon_col else float(poly_coords[0][1]),
                "polygon_coords": server._normalize_polygon_coords(poly_coords),
                "excluded": False,
            }
        )
    return business_regions


def _load_fixed_sites(config: BangaloreSolverConfig, demand_cells: pd.DataFrame) -> List[SolverSite]:
    df = server._load_store_dataframe(str(config.fixed_store_csv_path))
    df.columns = [str(col).strip() for col in df.columns]
    site_id_col = server._find_col(df.columns, ["site_id", "site id", "site_ID"])
    store_code_col = server._find_col(df.columns, ["store code", "store_code"])
    store_lat_col = server._find_col(df.columns, ["store latitude", "store_latitude", "latitude", "lat"])
    store_lon_col = server._find_col(df.columns, ["store longitude", "store_longitude", "longitude", "lon"])
    point_lat_col = server._find_col(df.columns, ["point latitude", "point_latitude"])
    point_lon_col = server._find_col(df.columns, ["point longitude", "point_longitude"])
    edge_col = server._find_col(df.columns, ["polygon edge", "polygon_edge", "edge"])
    if site_id_col is None or store_lat_col is None or store_lon_col is None:
        raise ValueError("Could not identify required columns in the 103-store file.")

    metadata_map: Dict[str, Dict[str, Any]] = {}
    metadata_df = pd.read_csv(config.fixed_store_metadata_path)
    for _, row in metadata_df.iterrows():
        key = server._normalize_store_lookup_id(row.get("site_id"))
        if not key:
            continue
        sqft = row.get("store_sqft")
        try:
            sqft_value = float(sqft) if sqft == sqft else None
        except Exception:
            sqft_value = None
        metadata_map[key] = {
            "store_sqft": sqft_value,
            "super_eligible_fixed": bool(
                sqft_value is not None and sqft_value >= float(config.fixed_super_min_sqft)
            ),
        }

    fixed_sites: List[SolverSite] = []
    for group_id, group in df.groupby(site_id_col, dropna=True, sort=False):
        row0 = group.iloc[0]
        site_id = str(group_id).strip().lower()
        poly_coords = server._rows_to_polygon_coords(group, point_lat_col, point_lon_col, edge_col=edge_col)
        metadata = metadata_map.get(server._normalize_store_lookup_id(site_id), {})
        fixed_sites.append(
            SolverSite(
                site_id=site_id,
                lat=float(row0[store_lat_col]),
                lon=float(row0[store_lon_col]),
                fixed=True,
                source="fixed_store",
                store_sqft=metadata.get("store_sqft"),
                super_eligible_fixed=bool(metadata.get("super_eligible_fixed", False)),
                polygon_coords=tuple((float(lat), float(lon)) for lat, lon in server._normalize_polygon_coords(poly_coords)),
            )
        )

    if len(demand_cells) and fixed_sites:
        ref_lat = float(np.mean(demand_cells["avg_cust_lat"].values))
        demand_xy = server._latlon_to_xy_km(
            demand_cells["avg_cust_lat"].values,
            demand_cells["avg_cust_lon"].values,
            ref_lat=ref_lat,
        )
        site_xy = server._latlon_to_xy_km(
            [site.lat for site in fixed_sites],
            [site.lon for site in fixed_sites],
            ref_lat=ref_lat,
        )
        tree = server.cKDTree(site_xy)
        _, nearest_idx = tree.query(demand_xy, k=1)
        assigned_orders = np.zeros(len(fixed_sites), dtype=np.float64)
        for demand_idx, site_idx in enumerate(nearest_idx):
            assigned_orders[int(site_idx)] += float(demand_cells.iloc[demand_idx]["orders_per_day"])
        fixed_sites = [
            SolverSite(
                site_id=site.site_id,
                lat=site.lat,
                lon=site.lon,
                fixed=True,
                source=site.source,
                store_sqft=site.store_sqft,
                super_eligible_fixed=site.super_eligible_fixed,
                orders_per_day=float(assigned_orders[idx]),
                polygon_coords=site.polygon_coords,
            )
            for idx, site in enumerate(fixed_sites)
        ]

    return sorted(fixed_sites, key=lambda site: site.site_id)


def cluster_demand_cells(demand_cells: pd.DataFrame, cluster_cell_size_km: float) -> List[DemandCluster]:
    ref_lat = float(demand_cells["avg_cust_lat"].mean()) if len(demand_cells) else 0.0
    xy = server._latlon_to_xy_km(
        demand_cells["avg_cust_lat"].values,
        demand_cells["avg_cust_lon"].values,
        ref_lat=ref_lat,
    )
    working = demand_cells.copy().reset_index(drop=True)
    working["bin_x"] = np.floor(xy[:, 0] / max(cluster_cell_size_km, 1e-6)).astype(int)
    working["bin_y"] = np.floor(xy[:, 1] / max(cluster_cell_size_km, 1e-6)).astype(int)

    clusters: List[DemandCluster] = []
    for idx, (_, group) in enumerate(
        working.groupby(["bin_x", "bin_y"], sort=True), start=1
    ):
        weights = group["orders_per_day"].astype(float)
        total = float(weights.sum())
        if total <= 0:
            continue
        lat = float(np.average(group["avg_cust_lat"].astype(float), weights=weights))
        lon = float(np.average(group["avg_cust_lon"].astype(float), weights=weights))
        clusters.append(
            DemandCluster(
                cluster_id=f"cluster-{idx:04d}",
                lat=lat,
                lon=lon,
                orders_per_day=round(total, 4),
                member_count=int(len(group)),
                source_cell_ids=tuple(group["grid_id"].astype(str).tolist()),
            )
        )
    return clusters


def load_bangalore_data(config: BangaloreSolverConfig) -> LoadedBangaloreData:
    demand_cells = _load_demand_cells(config)
    business_regions = _load_business_regions(config)
    excluded_islands: List[Dict[str, Any]] = []
    mask = server._scope_mask_for_grid(demand_cells, business_regions, excluded_islands)
    in_scope = demand_cells[mask].copy().reset_index(drop=True)
    fixed_sites = _load_fixed_sites(config, in_scope)
    demand_summary = {
        "grid_cell_count": int(len(demand_cells)),
        "in_scope_grid_cell_count": int(len(in_scope)),
        "total_demand": round(float(in_scope["orders_per_day"].sum()), 4),
        "cluster_cell_size_km": float(config.cluster_cell_size_km),
    }
    return LoadedBangaloreData(
        demand_cells=demand_cells,
        in_scope_demand_cells=in_scope,
        fixed_sites=tuple(fixed_sites),
        business_regions=tuple(business_regions),
        excluded_islands=tuple(excluded_islands),
        demand_summary=demand_summary,
    )
