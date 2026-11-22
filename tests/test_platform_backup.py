#!/usr/bin/env python3
import importlib.util
import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / ".github" / "scripts" / "sise-platform-backup.py"
os.environ.setdefault("SUPABASE_URL", "https://vwprdviufqukdvcroynt.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-only-not-a-real-key")

spec = importlib.util.spec_from_file_location("sise_platform_backup", SCRIPT)
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class StorageRecoveryExportTests(unittest.TestCase):
    def test_exports_bucket_sql_and_policy_snapshot(self):
        buckets = [
            {
                "name": "chat",
                "public": True,
                "avif_autodetection": False,
                "file_size_limit": 3145728,
                "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"],
                "type": "STANDARD",
                "versioning_status": "DISABLED",
                "lifecycle_configuration": None,
            },
            {
                "name": "media",
                "public": True,
                "avif_autodetection": False,
                "file_size_limit": 15728640,
                "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
                "type": "STANDARD",
                "versioning_status": "DISABLED",
                "lifecycle_configuration": {"rules": []},
            },
        ]
        with tempfile.TemporaryDirectory() as directory:
            backup.OUT = Path(directory)
            backup.export_storage_recovery_files(buckets)
            bucket_sql = (Path(directory) / "storage" / "buckets.sql").read_text()
            policy_sql = (Path(directory) / "storage" / "object-policies.sql").read_text()
            self.assertIn("'chat', 'chat', TRUE, FALSE, 3145728", bucket_sql)
            self.assertIn("'media', 'media', TRUE, FALSE, 15728640", bucket_sql)
            self.assertIn("'image/svg+xml'", bucket_sql)
            self.assertIn('"rules"', bucket_sql)
            self.assertIn('CREATE POLICY "chat img read"', policy_sql)
            self.assertIn('CREATE POLICY "media write"', policy_sql)
            self.assertIn("NULL::uuid", policy_sql)
            self.assertNotIn("7a52dd4c-f75a-4e1c-9b49-230b84c4fec8", policy_sql)

    def test_auth_export_strips_password_tokens_and_mfa(self):
        user = {
            "id": "user-1",
            "email": "customer@example.test",
            "encrypted_password": "must-not-export",
            "confirmation_token": "must-not-export",
            "refresh_token": "must-not-export",
            "factors": [{"factor_type": "totp", "secret": "must-not-export"}],
            "app_metadata": {"provider": "email", "access_token": "must-not-export"},
            "user_metadata": {"display_name": "Customer", "api_secret": "must-not-export"},
            "identities": [{
                "provider": "google",
                "identity_data": {"email": "customer@example.test", "sub": "provider-user"},
                "identity_token": "must-not-export",
            }],
        }
        cleaned = backup.sanitize_auth_user(user)
        serialized = str(cleaned)
        self.assertEqual(cleaned["email"], "customer@example.test")
        self.assertEqual(cleaned["app_metadata"]["provider"], "email")
        self.assertEqual(cleaned["identities"][0]["provider"], "google")
        for forbidden in ("encrypted_password", "confirmation_token", "refresh_token",
                          "factors", "secret", "access_token", "identity_token"):
            self.assertNotIn(forbidden, serialized)

    def test_fails_when_bucket_set_differs_from_policy_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            backup.OUT = Path(directory)
            with self.assertRaisesRegex(RuntimeError, "bucket set differs"):
                backup.export_storage_recovery_files([{
                    "name": "unexpected",
                    "public": True,
                    "allowed_mime_types": ["image/png"],
                }])

    def test_rejects_invalid_bucket_mime_types(self):
        with tempfile.TemporaryDirectory() as directory:
            backup.OUT = Path(directory)
            with self.assertRaises(RuntimeError):
                backup.export_storage_recovery_files([{
                    "name": "bad", "allowed_mime_types": "image/png"
                }])


if __name__ == "__main__":
    unittest.main()
