"""Tests for column auto-detection."""

import pandas as pd

from app.utils.columns import detect_distance_column, get_column_mapping


class TestColumnMapping:

    def test_standard_columns_detected(self):
        df = pd.DataFrame(columns=["Order ID", "Lat Order", "Long Order", "Dark Store", "Lat Store", "Long Store"])
        mapping = get_column_mapping(df)
        assert mapping["order_id"] == "Order ID"
        assert mapping["order_lat"] == "Lat Order"
        assert mapping["store_id"] == "Dark Store"

    def test_empty_df_returns_empty_mapping(self):
        df = pd.DataFrame(columns=["foo", "bar"])
        mapping = get_column_mapping(df)
        assert mapping == {}


class TestDistanceColumn:

    def test_finds_distance_km(self):
        df = pd.DataFrame(columns=["Order ID", "distance_km"])
        assert detect_distance_column(df) == "distance_km"

    def test_finds_road_distance(self):
        df = pd.DataFrame(columns=["Order ID", "Road_Distance_km"])
        assert detect_distance_column(df) == "Road_Distance_km"

    def test_returns_none_when_absent(self):
        df = pd.DataFrame(columns=["Order ID", "store_lat"])
        assert detect_distance_column(df) is None
