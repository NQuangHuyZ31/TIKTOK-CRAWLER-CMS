"""
Backward compatibility bridge for PrivacySagaCoordinator.
Actual implementation has moved to app.engine.sagas.privacy_saga.
"""

try:
    from engine.sagas.privacy_saga import PrivacySagaCoordinator
except ImportError:
    from app.engine.sagas.privacy_saga import PrivacySagaCoordinator

__all__ = ["PrivacySagaCoordinator"]
