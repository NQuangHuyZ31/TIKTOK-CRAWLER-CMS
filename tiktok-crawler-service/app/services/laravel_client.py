import asyncio
import logging
import httpx

from core.config import CRAWLER_TOKEN, LARAVEL_API_URL, normalize_callback_url
from schemas.models import AccountCrawlOutcome

logger = logging.getLogger(__name__)


class LaravelDeliveryError(RuntimeError):
    """Raised when sending an event to Laravel fails after all retry attempts."""


class LaravelClient:
    """
    HTTP client for sending crawl events (`started`, `account`, `completed`)
    to Laravel CMS and fetching `unfinished` jobs during fallback recovery.
    """

    MAX_ATTEMPTS = 5

    def __init__(
        self,
        base_url: str = LARAVEL_API_URL,
        token: str | None = CRAWLER_TOKEN,
        http_client: httpx.AsyncClient | None = None,
        backoff_base: float = 1.0,
    ):
        self.base_url = normalize_callback_url(base_url)
        self.token = token
        self._external_client = http_client is not None
        self._client = http_client
        self.backoff_base = backoff_base

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self) -> None:
        if self._client is not None and not self._external_client:
            await self._client.aclose()
            self._client = None

    @staticmethod
    def _headers(token: str | None) -> dict[str, str]:
        if not token:
            return {"Accept": "application/json"}
        return {
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
        }

    async def send_event(
        self,
        event: str,
        job_id: int,
        data: dict,
        callback_url: str | None = None,
        callback_token: str | None = None,
    ) -> dict:
        base = normalize_callback_url(callback_url or self.base_url)
        token = callback_token if callback_token is not None else self.token
        endpoint = f"{base}/crawl-jobs/{job_id}/events"
        payload = {
            "event": event,
            "job_id": job_id,
            **data,
        }

        client = await self._get_client()
        last_error: Exception | None = None

        for attempt in range(1, self.MAX_ATTEMPTS + 1):
            response = None
            try:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=self._headers(token),
                )
                response.raise_for_status()
                try:
                    return response.json()
                except ValueError:
                    return {"status_code": response.status_code, "text": response.text}
            except httpx.HTTPError as error:
                last_error = self._format_error(error, response)
                logger.warning(
                    "[Job #%d] Callback '%s' attempt %d/%d failed: %s",
                    job_id,
                    event,
                    attempt,
                    self.MAX_ATTEMPTS,
                    last_error,
                )

            if attempt < self.MAX_ATTEMPTS and self.backoff_base > 0:
                await asyncio.sleep(self.backoff_base * (2 ** (attempt - 1)))

        raise LaravelDeliveryError(
            f"Could not deliver '{event}' event for job #{job_id} after "
            f"{self.MAX_ATTEMPTS} attempts: {last_error}"
        )

    async def send_started(
        self,
        job_id: int,
        worker_id: str,
        resumed: bool = False,
        callback_url: str | None = None,
        callback_token: str | None = None,
    ) -> dict:
        return await self.send_event(
            event="started",
            job_id=job_id,
            data={
                "status": "running",
                "worker_id": worker_id,
                "resumed": resumed,
            },
            callback_url=callback_url,
            callback_token=callback_token,
        )

    async def send_account_outcome(
        self,
        job_id: int,
        outcome: AccountCrawlOutcome,
        callback_url: str | None = None,
        callback_token: str | None = None,
    ) -> dict:
        if outcome.status == "success" and outcome.account is not None:
            dumped = outcome.account.model_dump(mode="json")
            dumped["username"] = outcome.username
            dumped["avatar_url"] = None
            if dumped.get("status") not in ("active", "inactive"):
                dumped["status"] = "active"
            data: dict = {
                "status": "success",
                "username": outcome.username,
                "profile_url": outcome.profile_url,
                "account": dumped,
            }
            if outcome.error_code:
                data["error_code"] = outcome.error_code
            if outcome.avatar is not None:
                data["avatar"] = outcome.avatar.model_dump(mode="json")
        else:
            data = {
                "status": "failed",
                "username": outcome.username,
                "profile_url": outcome.profile_url,
                "error_code": outcome.error_code or "CRAWL_FAILED",
                "error_message": outcome.error_message or "Profile crawl failed",
            }

        return await self.send_event(
            event="account",
            job_id=job_id,
            data=data,
            callback_url=callback_url,
            callback_token=callback_token,
        )

    async def send_completed(
        self,
        job_id: int,
        status: str,
        total_accounts: int,
        success_count: int,
        failed_count: int,
        error_message: str | None = None,
        callback_url: str | None = None,
        callback_token: str | None = None,
    ) -> dict:
        data: dict = {
            "status": status,
            "total_accounts": total_accounts,
            "success_count": success_count,
            "failed_count": failed_count,
        }
        if error_message:
            data["error_message"] = error_message

        return await self.send_event(
            event="completed",
            job_id=job_id,
            data=data,
            callback_url=callback_url,
            callback_token=callback_token,
        )

    async def send_paused(
        self,
        job_id: int,
        status: str = "running",
        error_message: str = "Crawler service has shut down — waiting for service to restart and resume.",
        callback_url: str | None = None,
        callback_token: str | None = None,
    ) -> dict:
        return await self.send_event(
            event="paused",
            job_id=job_id,
            data={
                "status": status if status in ("running", "queued") else "running",
                "error_message": error_message,
            },
            callback_url=callback_url,
            callback_token=callback_token,
        )

    async def fetch_unfinished_jobs(self) -> list[dict]:
        """Fallback recovery endpoint when local SQLite database is empty after redeploy."""
        endpoint = f"{self.base_url}/jobs/unfinished"
        client = await self._get_client()
        try:
            response = await client.get(
                endpoint,
                headers=self._headers(self.token),
            )
            response.raise_for_status()
            body = response.json()
            if isinstance(body, dict):
                items = body.get("data", body.get("jobs", []))
                return items if isinstance(items, list) else []
            if isinstance(body, list):
                return body
            return []
        except Exception as error:
            logger.warning("Could not fetch unfinished jobs from Laravel (%s): %s", endpoint, error)
            return []

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
        return RuntimeError(f"Callback failed with HTTP {response.status_code}: {body}")
