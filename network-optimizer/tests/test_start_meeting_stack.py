import pathlib
import unittest


SCRIPT_PATH = pathlib.Path(__file__).resolve().parents[1] / "start_meeting_stack.sh"


class StartMeetingStackScriptTests(unittest.TestCase):
    def test_uses_osrm_5001_for_optimizer_startup(self):
        script = SCRIPT_PATH.read_text()
        self.assertIn('OSRM_URL="http://127.0.0.1:5001"', script)

    def test_restores_latest_decision_packet_after_startup(self):
        script = SCRIPT_PATH.read_text()
        self.assertIn("/api/load-latest-decision-packet", script)


if __name__ == "__main__":
    unittest.main()
