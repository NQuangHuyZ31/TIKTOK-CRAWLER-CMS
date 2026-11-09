"""
Backward compatibility bridge for OutboxDispatcher.
Actual implementation has moved to app.workers.outbox_dispatcher.
"""

try:
    from workers.outbox_dispatcher import OutboxDispatcher
except ImportError:
    from app.workers.outbox_dispatcher import OutboxDispatcher

__all__ = ["OutboxDispatcher"]
