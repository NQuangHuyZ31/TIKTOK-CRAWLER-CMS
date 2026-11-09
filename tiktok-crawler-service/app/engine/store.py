"""
Backward compatibility bridge for QueueStore.
Actual implementation has moved to app.repositories.queue_store.
"""

try:
    from repositories.queue_store import QueueStore, _utc_now_iso
except ImportError:
    from app.repositories.queue_store import QueueStore, _utc_now_iso

__all__ = ["QueueStore"]
