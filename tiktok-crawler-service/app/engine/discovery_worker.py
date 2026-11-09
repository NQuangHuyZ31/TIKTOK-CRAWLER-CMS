"""
Backward compatibility bridge for DiscoveryWorker.
Actual implementation has moved to app.workers.discovery_worker.
"""

try:
    from workers.discovery_worker import DiscoveryWorker, DiscoveryWorkerPool
except ImportError:
    from app.workers.discovery_worker import DiscoveryWorker, DiscoveryWorkerPool

__all__ = ["DiscoveryWorker", "DiscoveryWorkerPool"]
