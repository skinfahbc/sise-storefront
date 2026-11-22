#!/usr/bin/env python3
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / ".github" / "scripts" / "verify-platform-backup.py"
spec = importlib.util.spec_from_file_location("verify_platform_backup", SCRIPT)
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


class PlatformBackupVerificationTests(unittest.TestCase):
    def build_fixture(self, root):
        root = Path(root)
        (root / "auth").mkdir()
        (root / "storage" / "chat").mkdir(parents=True)
        payload = b"SISE object bytes"
        (root / "storage" / "chat" / "photo.png").write_bytes(payload)
        (root / "auth" / "users.json").write_text(
            json.dumps({"users": [{"id": "u1", "email": "customer@example.test"}]}),
            encoding="utf-8",
        )
        (root / "storage" / "buckets.sql").write_text("INSERT INTO storage.buckets ...;", encoding="utf-8")
        (root / "storage" / "object-policies.sql").write_text(
            "USING (bucket_id = 'chat');", encoding="utf-8"
        )
        manifest = {
            "project_ref": "vwprdviufqukdvcroynt",
            "auth_user_count": 1,
            "storage_bucket_count": 1,
            "storage_object_count": 1,
            "storage_total_bytes": len(payload),
            "storage_checksum_algorithm": "sha256",
            "buckets": [{
                "name": "chat",
                "object_count": 1,
                "objects": [{
                    "path": "photo.png",
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "size_bytes": len(payload),
                }],
            }],
        }
        (root / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        return root

    def test_valid_platform_archive_contents(self):
        with tempfile.TemporaryDirectory() as directory:
            verifier.verify(self.build_fixture(directory))

    def test_rejects_modified_storage_object(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.build_fixture(directory)
            (root / "storage" / "chat" / "photo.png").write_bytes(b"changed")
            with self.assertRaisesRegex(SystemExit, "SHA-256 mismatch"):
                verifier.verify(root)

    def test_rejects_path_traversal(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.build_fixture(directory)
            manifest_path = root / "manifest.json"
            manifest = json.loads(manifest_path.read_text())
            manifest["buckets"][0]["objects"][0]["path"] = "../outside"
            manifest_path.write_text(json.dumps(manifest))
            with self.assertRaisesRegex(SystemExit, "unsafe object path"):
                verifier.verify(root)

    def test_rejects_auth_secret_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.build_fixture(directory)
            auth_path = root / "auth" / "users.json"
            auth_path.write_text(json.dumps({
                "users": [{"id": "u1", "email": "customer@example.test", "api_token": "no"}]
            }))
            with self.assertRaisesRegex(SystemExit, "forbidden credential"):
                verifier.verify(root)


if __name__ == "__main__":
    unittest.main()
