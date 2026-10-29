import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from services.callback_service import CallbackService


class TestCallbackService(unittest.TestCase):

    def test_send_returns_parsed_json_response(self):
        """CallbackService.send should return parsed response body."""
        service = CallbackService("http://localhost:8000/api")

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.raise_for_status = MagicMock()
        mock_response.json = MagicMock(return_value={"message": "ok", "result_id": 42})

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            res = asyncio.run(
                service.send("account", 1, {"status": "success"})
            )

            self.assertEqual(res, {"message": "ok", "result_id": 42})
            mock_post.assert_called_once()


if __name__ == "__main__":
    unittest.main()
