#!/usr/bin/env python3
"""Verify an extracted encrypted SISE Auth/Storage backup without restoring it."""
import hashlib
import json
import re
import sys
from pathlib import Path, PurePosixPath

EXPECTED_PROJECT_REF = "vwprdviufqukdvcroynt"
FORBIDDEN_AUTH_KEY_PARTS = (
    "password", "token", "secret", "credential", "otp", "session",
    "access_key", "refresh", "mfa", "factor",
)


def fail(message):
    raise SystemExit(f"Platform backup verification failed: {message}")


def safe_file(root, relative):
    path = PurePosixPath(relative)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        fail("manifest contains an unsafe object path")
    target = (root / Path(*path.parts)).resolve()
    if root.resolve() not in target.parents:
        fail("manifest object path escapes the backup directory")
    if not target.is_file():
        fail(f"backup object is missing: {relative}")
    return target


def inspect_auth(value, path="$"):
    if isinstance(value, dict):
        for key, item in value.items():
            normalized = str(key).lower()
            if any(part in normalized for part in FORBIDDEN_AUTH_KEY_PARTS):
                fail(f"Auth export contains a forbidden credential/runtime field at {path}.{key}")
            inspect_auth(item, f"{path}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            inspect_auth(item, f"{path}[{index}]")


def verify(root):
    root = Path(root).resolve()
    manifest_path = root / "manifest.json"
    auth_path = root / "auth" / "users.json"
    bucket_sql_path = root / "storage" / "buckets.sql"
    policy_sql_path = root / "storage" / "object-policies.sql"
    for path in (manifest_path, auth_path, bucket_sql_path, policy_sql_path):
        if not path.is_file() or path.stat().st_size == 0:
            fail(f"required backup file is missing or empty: {path.relative_to(root)}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("project_ref") != EXPECTED_PROJECT_REF:
        fail("manifest project_ref does not match the configured SISE project")
    if manifest.get("storage_checksum_algorithm") != "sha256":
        fail("unsupported or missing Storage checksum algorithm")

    auth = json.loads(auth_path.read_text(encoding="utf-8"))
    users = auth.get("users")
    if not isinstance(users, list) or len(users) != manifest.get("auth_user_count"):
        fail("Auth user count does not match the manifest")
    inspect_auth(users)

    bucket_entries = manifest.get("buckets")
    if not isinstance(bucket_entries, list):
        fail("manifest buckets field is invalid")
    bucket_names = set()
    object_count = 0
    total_bytes = 0
    for bucket in bucket_entries:
        name = bucket.get("name")
        if not isinstance(name, str) or not name or name in bucket_names:
            fail("manifest contains an invalid or duplicate bucket name")
        bucket_names.add(name)
        objects = bucket.get("objects")
        if not isinstance(objects, list) or len(objects) != bucket.get("object_count"):
            fail(f"object count mismatch for bucket {name}")
        for item in objects:
            relative = item.get("path")
            if not isinstance(relative, str):
                fail(f"invalid object path in bucket {name}")
            target = safe_file(root / "storage" / name, relative)
            digest = hashlib.sha256()
            size = 0
            with target.open("rb") as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    digest.update(chunk)
                    size += len(chunk)
            if digest.hexdigest() != item.get("sha256"):
                fail(f"SHA-256 mismatch for {name}/{relative}")
            if size != item.get("size_bytes"):
                fail(f"byte count mismatch for {name}/{relative}")
            object_count += 1
            total_bytes += size

    if len(bucket_names) != manifest.get("storage_bucket_count"):
        fail("Storage bucket count does not match the manifest")
    if object_count != manifest.get("storage_object_count"):
        fail("Storage object total does not match the manifest")
    if total_bytes != manifest.get("storage_total_bytes"):
        fail("Storage byte total does not match the manifest")

    policy_sql = policy_sql_path.read_text(encoding="utf-8")
    policy_buckets = set(re.findall(r"bucket_id\s*=\s*'([^']+)'", policy_sql))
    if policy_buckets != bucket_names:
        fail("Storage bucket set differs from the object-policy snapshot")

    print(
        f"PASS: {len(users)} Auth users, {len(bucket_names)} buckets, "
        f"{object_count} Storage objects, {total_bytes} bytes; all object SHA-256 checksums verified."
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        fail("usage: verify-platform-backup.py EXTRACTED_BACKUP_DIRECTORY")
    verify(sys.argv[1])
