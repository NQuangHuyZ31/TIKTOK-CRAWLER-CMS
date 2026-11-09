"""
Unit tests for Canonical Event Envelope & RFC 8785 JCS Hashing.
Verifies determinism, key sorting, unicode handling, and envelope integrity.
"""

from pathlib import Path
import sys
import unittest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from schemas.canonical_event import (
    CanonicalEventEnvelope,
    canonical_json,
    compute_payload_hash,
    compute_event_id,
)


class TestCanonicalEvent(unittest.TestCase):

    def test_canonical_json_lexicographical_key_sorting(self):
        data = {
            "zebra": 1,
            "apple": 2,
            "mango": {
                "sweet": True,
                "bitter": False
            }
        }
        canonical = canonical_json(data)
        # RFC 8785 expects keys sorted alphabetically: "apple", "mango", "zebra"
        expected = '{"apple":2,"mango":{"bitter":false,"sweet":true},"zebra":1}'
        self.assertEqual(canonical, expected)

    def test_canonical_json_unicode_characters_preserved(self):
        data = {
            "creator": "Văn Hậu",
            "bio": "Âm nhạc & Đời sống 🎵"
        }
        canonical = canonical_json(data)
        # RFC 8785 requires raw UTF-8 characters, not \\u escape sequences
        self.assertIn("Văn Hậu", canonical)
        self.assertIn("Âm nhạc & Đời sống 🎵", canonical)
        self.assertNotIn("\\u", canonical)

    def test_compute_payload_hash_determinism(self):
        payload1 = {"b": 2, "a": 1}
        payload2 = {"a": 1, "b": 2}

        hash1 = compute_payload_hash(payload1)
        hash2 = compute_payload_hash(payload2)

        self.assertEqual(len(hash1), 64)
        self.assertEqual(hash1, hash2)

    def test_create_canonical_event_envelope(self):
        payload = {
            "username": "camvangdasac",
            "follower_count": 125000,
            "is_verified": True
        }
        observed_at = "2026-11-05T12:00:00.123456Z"

        envelope = CanonicalEventEnvelope.create(
            crawl_run_id="run_01jbx89k3e",
            entity_type="account",
            entity_key="camvangdasac",
            payload=payload,
            observed_at=observed_at,
            entity_revision=1
        )

        self.assertEqual(envelope.logical_event_key, "account:camvangdasac")
        self.assertEqual(len(envelope.payload_hash), 64)
        self.assertEqual(len(envelope.event_id), 64)
        self.assertEqual(envelope.observed_at, observed_at)

        # Recomputing event_id with same parameters must produce exact identical hash
        expected_id = compute_event_id(
            schema_version="1.0",
            crawl_run_id="run_01jbx89k3e",
            entity_type="account",
            entity_key="camvangdasac",
            operation="upsert",
            observed_at=observed_at,
            entity_revision=1,
            payload_hash=envelope.payload_hash
        )
        self.assertEqual(envelope.event_id, expected_id)

    def test_different_observed_at_produces_new_event_id(self):
        payload = {"username": "camvangdasac"}

        env1 = CanonicalEventEnvelope.create(
            crawl_run_id="run_01jbx89k3e",
            entity_type="account",
            entity_key="camvangdasac",
            payload=payload,
            observed_at="2026-11-05T12:00:00.000000Z"
        )

        env2 = CanonicalEventEnvelope.create(
            crawl_run_id="run_01jbx89k3e",
            entity_type="account",
            entity_key="camvangdasac",
            payload=payload,
            observed_at="2026-11-05T12:05:00.000000Z"
        )

        # Same payload -> identical payload_hash
        self.assertEqual(env1.payload_hash, env2.payload_hash)
        # Different observed_at -> distinct event_id (no event_id mutation or collision)
        self.assertNotEqual(env1.event_id, env2.event_id)


if __name__ == "__main__":
    unittest.main()
