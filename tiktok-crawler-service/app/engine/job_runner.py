"""
Backward compatibility bridge for JobRunner.
Actual implementation has moved to app.workers.job_runner.
"""

try:
    from workers.job_runner import JobRunner, parse_target_entry
except ImportError:
    from app.workers.job_runner import JobRunner, parse_target_entry

__all__ = ["JobRunner", "parse_target_entry"]
