import asyncio

import httpx


class CallbackService:
    """Sends crawl events to Laravel and retries temporary failures."""

    MAX_ATTEMPTS = 3

    def __init__(
        self,
        callback_url: str,
        callback_token: str | None = None,
    ):
        self.callback_url = callback_url.rstrip("/")
        self.callback_token = callback_token

    async def send(self, event: str, job_id: int, data: dict) -> dict:
        payload = {
            "event": event,
            "job_id": job_id,
            **data,
        }
        endpoint = f"{self.callback_url}/crawl-jobs/{job_id}/events"

        async with httpx.AsyncClient(timeout=30) as client:
            last_error: Exception | None = None

            for attempt in range(1, self.MAX_ATTEMPTS + 1):
                response = None
                try:
                    response = await client.post(
                        endpoint,
                        json=payload,
                        headers=self._build_headers(),
                    )
                    response.raise_for_status()
                    try:
                        return response.json()
                    except ValueError:
                        return {"status_code": response.status_code, "text": response.text}
                except httpx.HTTPError as error:
                    last_error = self._format_error(error, response)

                if attempt < self.MAX_ATTEMPTS:
                    await asyncio.sleep(attempt)

        message = str(last_error) if last_error else "Unknown callback error"
        raise RuntimeError(
            f"Could not save crawler event after "
            f"{self.MAX_ATTEMPTS} attempts: {message}"
        )

    def _build_headers(self) -> dict[str, str]:
        if not self.callback_token:
            return {}
        return {"Authorization": "Bearer " + self.callback_token}

    @staticmethod
    def _format_error(
        error: httpx.HTTPError,
        response: httpx.Response | None,
    ) -> Exception:
        if response is None:
            return error

        try:
            body = response.json()
        except ValueError:
            body = response.text

        return RuntimeError(
            f"Callback failed with HTTP {response.status_code}: {body}"
        )
