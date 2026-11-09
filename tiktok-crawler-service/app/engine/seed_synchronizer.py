"""
Backward compatibility bridge for SeedSynchronizer.
Actual implementation has moved to app.engine.sagas.seed_synchronizer.
"""

try:
    from engine.sagas.seed_synchronizer import SeedSynchronizer
except ImportError:
    from app.engine.sagas.seed_synchronizer import SeedSynchronizer

__all__ = ["SeedSynchronizer"]
