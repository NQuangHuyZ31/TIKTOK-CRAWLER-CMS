"""
Canonical Event Envelope & RFC 8785 JCS Serialization
Defines immutable event identities, canonical payload hashing, and validation models.
"""

from datetime import datetime, timezone
import hashlib
import json
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


def canonical_json(obj: Any) -> str:
    """
    Serialize Python dictionary/list to canonical JSON string adhering to RFC 8785 (JCS).
    - Keys are recursively sorted lexicographically (UTF-16 code units).
    - No insignificant whitespace (separators=(',', ':')).
    - Characters are UTF-8 encoded without ASCII escaping.
    """
    if isinstance(obj, dict):
        sorted_items = sorted(obj.items(), key=lambda kv: kv[0])
        parts = []
        for k, v in sorted_items:
            key_str = json.dumps(k, ensure_ascii=False)
            val_str = canonical_json(v)
            parts.append(f"{key_str}:{val_str}")
        return "{" + ",".join(parts) + "}"
    elif isinstance(obj, list):
        parts = [canonical_json(item) for item in obj]
        return "[" + ",".join(parts) + "]"
    elif isinstance(obj, float):
        if obj.is_integer():
            return str(int(obj))
        return json.dumps(obj)
    else:
        return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def compute_payload_hash(payload: Dict[str, Any]) -> str:
    """Compute SHA-256 hex digest of the canonical JSON payload."""
    canonical_str = canonical_json(payload)
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()


def compute_event_id(
    schema_version: str,
    crawl_run_id: str,
    entity_type: str,
    entity_key: str,
    operation: str,
    observed_at: str,
    entity_revision: int,
    payload_hash: str
) -> str:
    """
    Compute immutable event ID as SHA-256 of the canonical event envelope (without event_id).
    Eliminates circular hashing.
    """
    envelope_dict = {
        "crawl_run_id": crawl_run_id,
        "entity_key": entity_key,
        "entity_revision": entity_revision,
        "entity_type": entity_type,
        "observed_at": observed_at,
        "operation": operation,
        "payload_hash": payload_hash,
        "schema_version": schema_version,
    }
    canonical_envelope = canonical_json(envelope_dict)
    return hashlib.sha256(canonical_envelope.encode("utf-8")).hexdigest()


def format_utc_microseconds(dt: Optional[datetime] = None) -> str:
    """Format datetime in UTC ISO 8601 with microsecond precision: YYYY-MM-DDTHH:MM:SS.ffffffZ."""
    if dt is None:
        dt = datetime.now(timezone.utc)
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")


class CanonicalEventEnvelope(BaseModel):
    """Immutable Canonical Event Envelope contract for Webhook dispatch and Laravel ingestion."""
    schema_version: str = Field(default="1.0")
    event_id: str
    logical_event_key: str
    parent_event_id: Optional[str] = None
    crawl_run_id: str
    entity_type: str  # 'account' or 'video'
    entity_key: str
    operation: str = Field(default="upsert")
    entity_revision: int = Field(default=1)
    observed_at: str
    payload_hash: str
    payload: Dict[str, Any]

    @classmethod
    def create(
        cls,
        crawl_run_id: str,
        entity_type: str,
        entity_key: str,
        payload: Dict[str, Any],
        observed_at: Optional[str] = None,
        entity_revision: int = 1,
        parent_event_id: Optional[str] = None,
        operation: str = "upsert",
        schema_version: str = "1.0",
    ) -> "CanonicalEventEnvelope":
        if observed_at is None:
            observed_at = format_utc_microseconds()

        payload_hash = compute_payload_hash(payload)
        logical_event_key = f"{entity_type}:{entity_key}"

        event_id = compute_event_id(
            schema_version=schema_version,
            crawl_run_id=crawl_run_id,
            entity_type=entity_type,
            entity_key=entity_key,
            operation=operation,
            observed_at=observed_at,
            entity_revision=entity_revision,
            payload_hash=payload_hash,
        )

        return cls(
            schema_version=schema_version,
            event_id=event_id,
            logical_event_key=logical_event_key,
            parent_event_id=parent_event_id,
            crawl_run_id=crawl_run_id,
            entity_type=entity_type,
            entity_key=entity_key,
            operation=operation,
            entity_revision=entity_revision,
            observed_at=observed_at,
            payload_hash=payload_hash,
            payload=payload,
        )
