"""
Backward compatibility bridge for SchedulerDaemon.
Actual implementation has moved to app.workers.scheduler_daemon.
"""

try:
    from workers.scheduler_daemon import SchedulerDaemon, FencingException, DiskSafeguards
except ImportError:
    from app.workers.scheduler_daemon import SchedulerDaemon, FencingException, DiskSafeguards

__all__ = ["SchedulerDaemon", "FencingException", "DiskSafeguards"]
