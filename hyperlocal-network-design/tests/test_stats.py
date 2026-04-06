"""
Tests for the statistics computation module.

Each test function checks one specific behavior.  If any assertion
fails, pytest tells you exactly which line broke and why.
"""

from app.services.stats import calculate_stats


class TestCalculateStats:
    """Group of tests for calculate_stats()."""

    def test_empty_input_returns_zeros(self):
        result = calculate_stats([])
        assert result["total"] == 0
        assert result["avg"] == 0

    def test_single_result(self):
        result = calculate_stats([{"distance_km": 2.5}])
        assert result["total"] == 1
        assert result["avg"] == 2.5
        assert result["min"] == 2.5
        assert result["max"] == 2.5

    def test_multiple_results_basic_stats(self):
        data = [{"distance_km": d} for d in [1.0, 2.0, 3.0, 4.0, 5.0]]
        result = calculate_stats(data)
        assert result["total"] == 5
        assert result["avg"] == 3.0
        assert result["min"] == 1.0
        assert result["max"] == 5.0
        assert result["median"] == 3.0

    def test_histogram_bins_correct(self):
        data = [
            {"distance_km": 0.5},  # 0-1
            {"distance_km": 1.5},  # 1-2
            {"distance_km": 1.8},  # 1-2
            {"distance_km": 3.5},  # 3-4
            {"distance_km": 7.0},  # 5+
        ]
        result = calculate_stats(data)
        bins = result["histogram_bins"]
        assert bins["0-1 km"] == 1
        assert bins["1-2 km"] == 2
        assert bins["2-3 km"] == 0
        assert bins["3-4 km"] == 1
        assert bins["5+ km"] == 1

    def test_nan_values_excluded(self):
        data = [
            {"distance_km": 1.0},
            {"distance_km": None},
            {"distance_km": float("nan")},
            {"distance_km": 3.0},
        ]
        result = calculate_stats(data)
        assert result["successful"] == 2
        assert result["failed"] == 2
        assert result["avg"] == 2.0

    def test_percentiles_calculated(self):
        data = [{"distance_km": float(i)} for i in range(1, 101)]
        result = calculate_stats(data)
        assert result["p25"] == 25.75
        assert result["p90"] == 90.1
